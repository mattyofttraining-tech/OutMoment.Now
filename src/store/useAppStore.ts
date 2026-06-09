import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  EventMember,
  OurEvent,
  Photo,
  Quest,
  SavedPhoto,
} from '@/types';
import { getDataService, type CreateEventInput } from '@/services';

const ONBOARDED_KEY = 'ourmoment.onboarded.v1';

interface AppState {
  ready: boolean;
  isDemo: boolean;
  uid: string | null;
  displayName: string;
  hasOnboarded: boolean;

  myEvents: OurEvent[];
  activeEventId: string | null;

  membersByEvent: Record<string, EventMember[]>;
  questsByEvent: Record<string, Quest[]>;
  photosByEvent: Record<string, Photo[]>;

  saved: SavedPhoto[];
  savedIds: Set<string>;

  // lifecycle
  bootstrap: () => Promise<void>;
  refreshMyEvents: () => Promise<void>;

  // events
  joinByCode: (code: string, displayName: string) => Promise<OurEvent>;
  createEvent: (input: CreateEventInput) => Promise<OurEvent>;
  setActiveEvent: (eventId: string) => void;
  loadEventDetail: (eventId: string) => Promise<void>;
  subscribeToPhotos: (eventId: string) => () => void;

  // capture + quests
  capture: (eventId: string, localUri: string, questId?: string | null) => Promise<Photo>;

  // save (personal curation)
  save: (photo: Photo, exportedToDevice: boolean) => Promise<void>;
  unsave: (photoId: string) => Promise<void>;

  setDisplayName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  isDemo: getDataService().isDemo,
  uid: null,
  displayName: 'You',
  hasOnboarded: false,

  myEvents: [],
  activeEventId: null,

  membersByEvent: {},
  questsByEvent: {},
  photosByEvent: {},

  saved: [],
  savedIds: new Set(),

  async bootstrap() {
    const svc = getDataService();
    const [user, onboardedRaw] = await Promise.all([
      svc.ensureAuth(),
      AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null),
    ]);
    const [events, saved] = await Promise.all([svc.getMyEvents(), svc.getSavedPhotos()]);
    set({
      ready: true,
      uid: user.uid,
      displayName: user.displayName ?? get().displayName,
      hasOnboarded: onboardedRaw === 'true',
      myEvents: events,
      activeEventId: events[0]?.id ?? get().activeEventId,
      saved,
      savedIds: new Set(saved.map((s) => s.photoId)),
    });
  },

  async completeOnboarding() {
    set({ hasOnboarded: true });
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
  },

  async refreshMyEvents() {
    const events = await getDataService().getMyEvents();
    set({ myEvents: events });
  },

  async joinByCode(code, displayName) {
    const svc = getDataService();
    await svc.setDisplayName(displayName);
    const event = await svc.joinEventByCode(code, displayName);
    set((s) => ({
      displayName,
      activeEventId: event.id,
      myEvents: dedupeEvents([event, ...s.myEvents]),
    }));
    return event;
  },

  async createEvent(input) {
    const event = await getDataService().createEvent(input);
    set((s) => ({
      activeEventId: event.id,
      myEvents: dedupeEvents([event, ...s.myEvents]),
    }));
    return event;
  },

  setActiveEvent(eventId) {
    set({ activeEventId: eventId });
  },

  async loadEventDetail(eventId) {
    const svc = getDataService();
    const [event, members, quests] = await Promise.all([
      svc.getEvent(eventId),
      svc.getMembers(eventId),
      svc.getQuests(eventId),
    ]);
    set((s) => ({
      myEvents: event ? dedupeEvents([event, ...s.myEvents]) : s.myEvents,
      membersByEvent: { ...s.membersByEvent, [eventId]: members },
      questsByEvent: { ...s.questsByEvent, [eventId]: quests },
    }));
  },

  subscribeToPhotos(eventId) {
    return getDataService().subscribePhotos(eventId, (photos) => {
      set((s) => ({ photosByEvent: { ...s.photosByEvent, [eventId]: photos } }));
    });
  },

  async capture(eventId, localUri, questId) {
    const photo = await getDataService().uploadPhoto(eventId, localUri, questId);
    // Optimistically reflect quest completion locally.
    if (questId) {
      const uid = get().uid;
      set((s) => ({
        questsByEvent: {
          ...s.questsByEvent,
          [eventId]: (s.questsByEvent[eventId] ?? []).map((q) =>
            q.id === questId && uid && !q.completedBy.includes(uid)
              ? { ...q, completedBy: [...q.completedBy, uid] }
              : q,
          ),
        },
      }));
    }
    return photo;
  },

  async save(photo, exportedToDevice) {
    await getDataService().savePhoto(photo, exportedToDevice);
    set((s) => {
      if (s.savedIds.has(photo.id)) return s;
      const entry: SavedPhoto = {
        photoId: photo.id,
        eventId: photo.eventId,
        url: photo.url,
        savedAt: Date.now(),
        exportedToDevice,
      };
      const savedIds = new Set(s.savedIds);
      savedIds.add(photo.id);
      return { saved: [entry, ...s.saved], savedIds };
    });
  },

  async unsave(photoId) {
    await getDataService().unsavePhoto(photoId);
    set((s) => {
      const savedIds = new Set(s.savedIds);
      savedIds.delete(photoId);
      return { saved: s.saved.filter((x) => x.photoId !== photoId), savedIds };
    });
  },

  async setDisplayName(name) {
    await getDataService().setDisplayName(name);
    set({ displayName: name });
  },
}));

function dedupeEvents(events: OurEvent[]): OurEvent[] {
  const seen = new Set<string>();
  const out: OurEvent[] = [];
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}
