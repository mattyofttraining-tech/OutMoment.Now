import type {
  EventMember,
  EventType,
  OurEvent,
  Photo,
  Quest,
  SavedPhoto,
} from '@/types';
import { EVENT_WORLDS } from '@/data/eventWorlds';
import {
  DEMO_EVENT_ID,
  DEMO_UID,
  demoEvent,
  demoMembers,
  demoPhotos,
  demoQuests,
} from '@/data/seed';
import { generateQuestsLocally } from './questGenerator';
import type { CreateEventInput, DataService, AuthUser } from './dataService';
import { makeJoinCode } from '@/utils/code';

/**
 * In-memory implementation used in DEMO MODE. State is mutable for the session
 * so capture / save / create feel real, but nothing is persisted.
 */
export class DemoDataService implements DataService {
  readonly isDemo = true;

  private displayName = 'You';
  private events: OurEvent[] = [{ ...demoEvent }];
  private photosByEvent: Record<string, Photo[]> = { [DEMO_EVENT_ID]: [...demoPhotos] };
  private questsByEvent: Record<string, Quest[]> = { [DEMO_EVENT_ID]: [...demoQuests] };
  private membersByEvent: Record<string, EventMember[]> = { [DEMO_EVENT_ID]: [...demoMembers] };
  private saved: SavedPhoto[] = [];
  private listeners: Record<string, ((p: Photo[]) => void)[]> = {};

  async ensureAuth(): Promise<AuthUser> {
    return { uid: DEMO_UID, displayName: this.displayName };
  }

  async setDisplayName(name: string): Promise<void> {
    this.displayName = name.trim() || 'You';
  }

  async joinEventByCode(code: string): Promise<OurEvent> {
    const normalized = code.trim().toUpperCase();
    // In demo mode any non-empty code lands you in the showcase wedding.
    if (!normalized) throw new Error('Enter your event code.');
    return this.events[0]!;
  }

  async createEvent(input: CreateEventInput): Promise<OurEvent> {
    const world = EVENT_WORLDS[input.type];
    const now = Date.now();
    const event: OurEvent = {
      id: `evt_${now}`,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      hostUid: DEMO_UID,
      hostName: input.hostName,
      code: makeJoinCode(input.type),
      coverImage: world.coverImage,
      status: 'upcoming',
      createdAt: now,
      startsAt: input.startsAt,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      memberCount: 1,
      photoCount: 0,
      aiBrief: input.aiBrief,
      guestTier: input.guestTier ?? 'intimate',
    };
    this.events = [event, ...this.events];
    this.photosByEvent[event.id] = [];
    this.membersByEvent[event.id] = [
      { uid: DEMO_UID, displayName: input.hostName, role: 'host', joinedAt: now },
    ];
    const quests = input.aiBrief
      ? await this.generateQuests(input.aiBrief, input.type)
      : world.defaultQuests.map((q) => ({ ...q, completedBy: [] }));
    this.questsByEvent[event.id] = quests;
    return event;
  }

  async getMyEvents(): Promise<OurEvent[]> {
    return [...this.events];
  }

  async getEvent(eventId: string): Promise<OurEvent | null> {
    return this.events.find((e) => e.id === eventId) ?? null;
  }

  async getMembers(eventId: string): Promise<EventMember[]> {
    return this.membersByEvent[eventId] ?? [];
  }

  async getQuests(eventId: string): Promise<Quest[]> {
    return this.questsByEvent[eventId] ?? [];
  }

  subscribePhotos(eventId: string, cb: (photos: Photo[]) => void): () => void {
    cb([...(this.photosByEvent[eventId] ?? [])]);
    const list = this.listeners[eventId] ?? (this.listeners[eventId] = []);
    list.push(cb);
    return () => {
      this.listeners[eventId] = (this.listeners[eventId] ?? []).filter((l) => l !== cb);
    };
  }

  private emit(eventId: string) {
    const photos = [...(this.photosByEvent[eventId] ?? [])];
    (this.listeners[eventId] ?? []).forEach((l) => l(photos));
  }

  async uploadPhoto(eventId: string, localUri: string, questId?: string | null): Promise<Photo> {
    const now = Date.now();
    const photo: Photo = {
      id: `p_${now}`,
      eventId,
      uploaderUid: DEMO_UID,
      uploaderName: this.displayName,
      storagePath: `events/${eventId}/photos/p_${now}.jpg`,
      url: localUri,
      width: 1000,
      height: 1400,
      createdAt: now,
      questId: questId ?? null,
    };
    this.photosByEvent[eventId] = [photo, ...(this.photosByEvent[eventId] ?? [])];
    if (questId) {
      this.questsByEvent[eventId] = (this.questsByEvent[eventId] ?? []).map((q) =>
        q.id === questId && !q.completedBy.includes(DEMO_UID)
          ? { ...q, completedBy: [...q.completedBy, DEMO_UID] }
          : q,
      );
    }
    const event = this.events.find((e) => e.id === eventId);
    if (event) event.photoCount += 1;
    this.emit(eventId);
    return photo;
  }

  async generateQuests(brief: string, eventType: EventType): Promise<Quest[]> {
    // Demo mode uses the offline generator so it works with no network/keys.
    return generateQuestsLocally(brief, eventType);
  }

  async savePhoto(photo: Photo, exportedToDevice: boolean): Promise<void> {
    if (this.saved.some((s) => s.photoId === photo.id)) return;
    this.saved = [
      {
        photoId: photo.id,
        eventId: photo.eventId,
        url: photo.url,
        savedAt: Date.now(),
        exportedToDevice,
      },
      ...this.saved,
    ];
  }

  async unsavePhoto(photoId: string): Promise<void> {
    this.saved = this.saved.filter((s) => s.photoId !== photoId);
  }

  async getSavedPhotos(): Promise<SavedPhoto[]> {
    return [...this.saved];
  }
}
