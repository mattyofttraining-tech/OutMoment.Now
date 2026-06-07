import {
  signInAnonymously,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import type {
  EventMember,
  EventType,
  OurEvent,
  Photo,
  Quest,
  SavedPhoto,
} from '@/types';
import {
  getDb,
  getFirebaseAuth,
  getFirebaseFunctions,
  getFirebaseStorage,
} from '@/lib/firebase/app';
import { generateQuestsLocally } from './questGenerator';
import type { AuthUser, CreateEventInput, DataService } from './dataService';

/**
 * Production data layer. The closed-group security model is enforced by
 * firestore.rules / storage.rules — this client only ever reads/writes paths it
 * has been granted membership to via the joinEvent / createEvent Cloud
 * Functions.
 */
export class FirebaseDataService implements DataService {
  readonly isDemo = false;

  private currentUser(): User {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Not authenticated. Call ensureAuth() first.');
    return user;
  }

  async ensureAuth(): Promise<AuthUser> {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      return { uid: auth.currentUser.uid, displayName: auth.currentUser.displayName };
    }
    // Wait for any persisted session to rehydrate before signing in anew.
    const existing = await new Promise<User | null>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u);
      });
    });
    if (existing) return { uid: existing.uid, displayName: existing.displayName };
    const cred = await signInAnonymously(auth);
    return { uid: cred.user.uid, displayName: cred.user.displayName };
  }

  async setDisplayName(name: string): Promise<void> {
    await updateProfile(this.currentUser(), { displayName: name.trim() });
  }

  async joinEventByCode(code: string, displayName: string): Promise<OurEvent> {
    const callable = httpsCallable<{ code: string; displayName: string }, { eventId: string }>(
      getFirebaseFunctions(),
      'joinEvent',
    );
    const { data } = await callable({ code, displayName });
    const event = await this.getEvent(data.eventId);
    if (!event) throw new Error('Joined, but the event could not be loaded.');
    return event;
  }

  async createEvent(input: CreateEventInput): Promise<OurEvent> {
    const callable = httpsCallable<CreateEventInput, { event: OurEvent }>(
      getFirebaseFunctions(),
      'createEvent',
    );
    const { data } = await callable(input);
    return data.event;
  }

  async getMyEvents(): Promise<OurEvent[]> {
    const uid = this.currentUser().uid;
    const q = query(
      collection(getDb(), 'events'),
      where('memberUids', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toEvent(d.id, d.data()));
  }

  async getEvent(eventId: string): Promise<OurEvent | null> {
    const snap = await getDoc(doc(getDb(), 'events', eventId));
    return snap.exists() ? toEvent(snap.id, snap.data()) : null;
  }

  async getMembers(eventId: string): Promise<EventMember[]> {
    const snap = await getDocs(collection(getDb(), 'events', eventId, 'members'));
    return snap.docs.map((d) => d.data() as EventMember);
  }

  async getQuests(eventId: string): Promise<Quest[]> {
    const q = query(collection(getDb(), 'events', eventId, 'quests'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quest, 'id'>) }));
  }

  subscribePhotos(eventId: string, cb: (photos: Photo[]) => void): () => void {
    const q = query(
      collection(getDb(), 'events', eventId, 'photos'),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Photo, 'id'>) })));
    });
  }

  async uploadPhoto(eventId: string, localUri: string, questId?: string | null): Promise<Photo> {
    const user = this.currentUser();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `events/${eventId}/photos/${id}.jpg`;

    // Read the local file into a blob and upload to per-event storage.
    const blob = await (await fetch(localUri)).blob();
    const storageRef = ref(getFirebaseStorage(), storagePath);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(storageRef);

    const photoData: Omit<Photo, 'id'> = {
      eventId,
      uploaderUid: user.uid,
      uploaderName: user.displayName ?? 'Guest',
      storagePath,
      url,
      width: 1000,
      height: 1400,
      createdAt: Date.now(),
      questId: questId ?? null,
    };
    const docRef = await addDoc(collection(getDb(), 'events', eventId, 'photos'), {
      ...photoData,
      serverCreatedAt: serverTimestamp(),
    });

    // Bump the event photo counter and mark the quest complete.
    await updateDoc(doc(getDb(), 'events', eventId), { photoCount: increment(1) });
    if (questId) {
      await updateDoc(doc(getDb(), 'events', eventId, 'quests', questId), {
        completedBy: arrayUnion(user.uid),
      });
    }
    return { id: docRef.id, ...photoData };
  }

  async generateQuests(brief: string, eventType: EventType): Promise<Quest[]> {
    try {
      const callable = httpsCallable<
        { brief: string; eventType: EventType },
        { quests: Quest[] }
      >(getFirebaseFunctions(), 'generateQuests');
      const { data } = await callable({ brief, eventType });
      if (Array.isArray(data.quests) && data.quests.length >= 6) return data.quests;
      throw new Error('AI returned too few quests.');
    } catch {
      // Never block event creation on the AI — fall back to the local generator.
      return generateQuestsLocally(brief, eventType);
    }
  }

  async savePhoto(photo: Photo, exportedToDevice: boolean): Promise<void> {
    const uid = this.currentUser().uid;
    const saved: SavedPhoto = {
      photoId: photo.id,
      eventId: photo.eventId,
      url: photo.url,
      savedAt: Date.now(),
      exportedToDevice,
    };
    await setDoc(doc(getDb(), 'users', uid, 'saved', photo.id), saved);
  }

  async unsavePhoto(photoId: string): Promise<void> {
    const uid = this.currentUser().uid;
    await deleteDoc(doc(getDb(), 'users', uid, 'saved', photoId));
  }

  async getSavedPhotos(): Promise<SavedPhoto[]> {
    const uid = this.currentUser().uid;
    const snap = await getDocs(collection(getDb(), 'users', uid, 'saved'));
    return snap.docs.map((d) => d.data() as SavedPhoto);
  }
}

function toEvent(id: string, data: Record<string, unknown>): OurEvent {
  return {
    id,
    type: data.type as EventType,
    title: (data.title as string) ?? 'Event',
    subtitle: data.subtitle as string | undefined,
    hostUid: data.hostUid as string,
    hostName: (data.hostName as string) ?? 'Host',
    code: (data.code as string) ?? '',
    coverImage: (data.coverImage as string) ?? '',
    status: (data.status as OurEvent['status']) ?? 'live',
    createdAt: (data.createdAt as number) ?? Date.now(),
    startsAt: (data.startsAt as number) ?? Date.now(),
    expiresAt: (data.expiresAt as number) ?? Date.now(),
    memberCount: (data.memberCount as number) ?? 0,
    photoCount: (data.photoCount as number) ?? 0,
    aiBrief: data.aiBrief as string | undefined,
  };
}
