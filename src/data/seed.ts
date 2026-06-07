import type { EventMember, OurEvent, Photo, Quest } from '@/types';
import { EVENT_WORLDS } from './eventWorlds';
import { decorImage } from '@/utils/images';

/**
 * Rich seed data for DEMO MODE — when no Firebase config is present the app
 * boots into a fully populated wedding so every screen can be explored.
 */

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

export const DEMO_UID = 'demo-user';

export const demoMembers: EventMember[] = [
  { uid: DEMO_UID, displayName: 'You', role: 'guest', joinedAt: now - 2 * DAY, avatarColor: '#C9A227' },
  { uid: 'u_anna', displayName: 'Anna', role: 'host', joinedAt: now - 5 * DAY, avatarColor: '#FF6B9D' },
  { uid: 'u_jonas', displayName: 'Jonas', role: 'host', joinedAt: now - 5 * DAY, avatarColor: '#6C7BD6' },
  { uid: 'u_mia', displayName: 'Mia', role: 'guest', joinedAt: now - 3 * DAY, avatarColor: '#5BB8C4' },
  { uid: 'u_lars', displayName: 'Lars', role: 'guest', joinedAt: now - 2 * DAY, avatarColor: '#9B6BFF' },
  { uid: 'u_sofie', displayName: 'Sofie', role: 'guest', joinedAt: now - 1 * DAY, avatarColor: '#34C759' },
];

const world = EVENT_WORLDS.marriage;

export const DEMO_EVENT_ID = 'demo-event';

export const demoEvent: OurEvent = {
  id: DEMO_EVENT_ID,
  type: 'marriage',
  title: 'Anna & Jonas',
  subtitle: 'Skagen · Midsummer',
  hostUid: 'u_anna',
  hostName: 'Anna',
  code: 'SUNSET-2026',
  coverImage: world.coverImage,
  status: 'live',
  createdAt: now - 2 * DAY,
  startsAt: now - 1 * DAY,
  expiresAt: now - 2 * DAY + 30 * DAY,
  memberCount: demoMembers.length,
  photoCount: 0, // set below
};

export const demoQuests: Quest[] = world.defaultQuests.map((quest, i) => ({
  ...quest,
  completedBy: i % 3 === 0 ? ['u_anna', 'u_mia'] : i % 3 === 1 ? [DEMO_UID] : [],
}));

const uploaders = demoMembers.map((m) => ({ uid: m.uid, name: m.displayName }));

export const demoPhotos: Photo[] = Array.from({ length: 24 }).map((_, i) => {
  const uploader = uploaders[i % uploaders.length]!;
  const quest = i < demoQuests.length ? demoQuests[i] : undefined;
  return {
    id: `p_${i + 1}`,
    eventId: DEMO_EVENT_ID,
    uploaderUid: uploader.uid,
    uploaderName: uploader.name,
    storagePath: `events/${DEMO_EVENT_ID}/photos/p_${i + 1}.jpg`,
    url: decorImage(`ourmoment-photo-${i + 1}`, 1000, 1400),
    width: 1000,
    height: 1400,
    createdAt: now - (24 - i) * 60 * 60 * 1000,
    questId: quest?.id ?? null,
    caption: quest?.title,
  };
});

demoEvent.photoCount = demoPhotos.length;
