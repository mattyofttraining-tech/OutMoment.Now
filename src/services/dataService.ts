import type {
  EventMember,
  EventType,
  GuestTierId,
  OurEvent,
  Photo,
  Quest,
  SavedPhoto,
} from '@/types';

export interface CreateEventInput {
  type: EventType;
  title: string;
  subtitle?: string;
  hostName: string;
  startsAt: number;
  /** Free-text brief for AI quest generation (special events). */
  aiBrief?: string;
  /** Guest-capacity tier chosen at booking (drives price). */
  guestTier?: GuestTierId;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
}

/**
 * The single contract the UI depends on. Two implementations exist:
 *  - DemoDataService   (in-memory seed data, no backend)
 *  - FirebaseDataService (Firestore + Storage + Cloud Functions)
 *
 * The active one is chosen at runtime in ./index based on whether Firebase is
 * configured, so screens never branch on backend availability themselves.
 */
export interface DataService {
  readonly isDemo: boolean;

  /** Sign the user in anonymously (idempotent). */
  ensureAuth(): Promise<AuthUser>;
  setDisplayName(name: string): Promise<void>;

  /** Validate a join code and add the user to the event. Throws if invalid. */
  joinEventByCode(code: string, displayName: string): Promise<OurEvent>;
  /** Host-side: create an event and receive its code (used by the store). */
  createEvent(input: CreateEventInput): Promise<OurEvent>;

  getMyEvents(): Promise<OurEvent[]>;
  getEvent(eventId: string): Promise<OurEvent | null>;
  getMembers(eventId: string): Promise<EventMember[]>;
  getQuests(eventId: string): Promise<Quest[]>;

  /** Live photo stream for the shared pool. Returns an unsubscribe fn. */
  subscribePhotos(eventId: string, cb: (photos: Photo[]) => void): () => void;

  /** Upload a captured photo to the shared pool. */
  uploadPhoto(eventId: string, localUri: string, questId?: string | null): Promise<Photo>;

  /** AI-generate a quest pack from a host's free-text brief. */
  generateQuests(brief: string, eventType: EventType): Promise<Quest[]>;

  /** Personal curation — keep a photo so it survives the 30-day purge. */
  savePhoto(photo: Photo, exportedToDevice: boolean): Promise<void>;
  unsavePhoto(photoId: string): Promise<void>;
  getSavedPhotos(): Promise<SavedPhoto[]>;
}
