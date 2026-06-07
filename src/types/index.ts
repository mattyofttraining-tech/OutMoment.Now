/**
 * Core domain model for OurMoment.
 * These types are the contract shared between the app, the seed data and the
 * Firebase layer (Firestore document shapes mirror these closely).
 */

/** The five event worlds. `special` is the AI-powered, all-purpose world. */
export type EventType =
  | 'marriage'
  | 'confirmation'
  | 'baptism'
  | 'birthday'
  | 'special';

export type MemberRole = 'host' | 'guest';

export interface EventMember {
  uid: string;
  displayName: string;
  role: MemberRole;
  joinedAt: number; // epoch ms
  avatarColor?: string;
}

/** A single photo contributed to the shared event pool. */
export interface Photo {
  id: string;
  eventId: string;
  uploaderUid: string;
  uploaderName: string;
  storagePath: string; // path in Firebase Storage
  url: string; // resolved download URL (or a remote seed URL)
  width: number;
  height: number;
  createdAt: number; // epoch ms
  questId?: string | null; // the quest this photo fulfils, if any
  caption?: string;
}

/** A photo prompt that gamifies capturing the moment. */
export interface Quest {
  id: string;
  title: string;
  prompt: string;
  /** Emoji or icon key used as the quest glyph. */
  icon: string;
  /** Lower sorts first. */
  order: number;
  /** UIDs who have completed (uploaded a photo for) this quest. */
  completedBy: string[];
  /** True when the quest was produced by the AI for a `special` event. */
  aiGenerated?: boolean;
}

export type EventStatus = 'upcoming' | 'live' | 'archived' | 'expired';

export interface OurEvent {
  id: string;
  type: EventType;
  title: string;
  /** Short host-facing description (e.g. "Anna & Jonas · Skagen"). */
  subtitle?: string;
  hostUid: string;
  hostName: string;
  /** The human-friendly join code guests type in, e.g. "SUNSET-2026". */
  code: string;
  coverImage: string;
  status: EventStatus;
  createdAt: number; // epoch ms
  startsAt: number; // when the event happens
  /** Hard self-destruct time = createdAt + 30 days. */
  expiresAt: number;
  memberCount: number;
  photoCount: number;
  /** Free-text the host gave the AI (special events only). */
  aiBrief?: string;
}

/** A photo the current user chose to keep — survives the purge. */
export interface SavedPhoto {
  photoId: string;
  eventId: string;
  url: string;
  savedAt: number;
  /** True once written to the device camera roll. */
  exportedToDevice: boolean;
}

/** Static configuration for each event world (copy, palette, default quests). */
export interface EventWorld {
  type: EventType;
  name: string;
  tagline: string;
  description: string;
  glyph: string; // emoji
  accent: string; // hex
  gradient: [string, string];
  coverImage: string;
  /** Whether the host describes the party and AI builds the quests. */
  aiPowered: boolean;
  /** Indicative price shown in the in-app store, in the host's currency. */
  priceLabel: string;
  defaultQuests: Omit<Quest, 'completedBy'>[];
}

/** Result of a swipe session decision. */
export type SwipeDecision = 'keep' | 'pass';
