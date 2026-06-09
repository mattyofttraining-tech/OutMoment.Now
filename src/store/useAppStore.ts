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
import { deviceLocale, isSupportedLocale, setI18nLocale, type LocaleCode } from '@/i18n';

const ONBOARDED_KEY = 'ourmoment.onboarded.v1';
const LOCALE_KEY = 'ourmoment.locale.v1';

interface AppState {
  ready: boolean;
  isDemo: boolean;
  uid: string | null;
  displayName: string;
  hasOnboarded: boolean;
  locale: LocaleCode;

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
  deleteEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
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
  setLocale: (code: LocaleCode) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  isDemo: getDataService().isDemo,
  uid: null,
  displayName: 'You',
  hasOnboarded: false,
  locale: 'en',

  myEvents: [],
  activeEventId: null,

  membersByEvent: {},
  questsByEvent: {},
  photosByEvent: {},

  saved: [],
  savedIds: new Set(),

  async bootstrap() {
    const svc = getDataService();
    try {
      const [user, onboardedRaw, localeRaw] = await Promise.all([
        svc.ensureAuth(),
        AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null),
        AsyncStorage.getItem(LOCALE_KEY).catch(() => null),
      ]);
      // Persisted choice wins; otherwise match the device language (fallback en).
      const locale = isSupportedLocale(localeRaw) ? localeRaw : deviceLocale();
      setI18nLocale(locale);
      // Data fetches are non-fatal: a backend hiccup (e.g. a still-building
      // index) must never block app launch. Come up empty and refresh later.
      const [events, saved] = await Promise.all([
        svc.getMyEvents().catch((e) => {
          console.warn('bootstrap: getMyEvents failed', e);
          return [] as OurEvent[];
        }),
        svc.getSavedPhotos().catch((e) => {
          console.warn('bootstrap: getSavedPhotos failed', e);
          return [] as SavedPhoto[];
        }),
      ]);
      set({
        ready: true,
        uid: user.uid,
        displayName: user.displayName ?? get().displayName,
        hasOnboarded: onboardedRaw === 'true',
        locale,
        myEvents: events,
        activeEventId: events[0]?.id ?? get().activeEventId,
        saved,
        savedIds: new Set(saved.map((s) => s.photoId)),
      });
    } catch (e) {
      // Even auth/storage failure must not strand the splash screen forever.
      console.warn('bootstrap: auth/storage failed', e);
      set({ ready: true });
    }
  },

  async completeOnboarding() {
    set({ hasOnboarded: true });
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
  },

  setLocale(code) {
    setI18nLocale(code);
    set({ locale: code });
    AsyncStorage.setItem(LOCALE_KEY, code).catch(() => {});
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

  async deleteEvent(eventId) {
    await getDataService().deleteEvent(eventId);
    set((s) => {
      const myEvents = s.myEvents.filter((e) => e.id !== eventId);
      const photosByEvent = { ...s.photosByEvent };
      const questsByEvent = { ...s.questsByEvent };
      const membersByEvent = { ...s.membersByEvent };
      delete photosByEvent[eventId];
      delete questsByEvent[eventId];
      delete membersByEvent[eventId];
      return {
        myEvents,
        photosByEvent,
        questsByEvent,
        membersByEvent,
        activeEventId:
          s.activeEventId === eventId ? (myEvents[0]?.id ?? null) : s.activeEventId,
      };
    });
  },

  async leaveEvent(eventId) {
    await getDataService().leaveEvent(eventId);
    set((s) => {
      const myEvents = s.myEvents.filter((e) => e.id !== eventId);
      const photosByEvent = { ...s.photosByEvent };
      const questsByEvent = { ...s.questsByEvent };
      const membersByEvent = { ...s.membersByEvent };
      delete photosByEvent[eventId];
      delete questsByEvent[eventId];
      delete membersByEvent[eventId];
      return {
        myEvents,
        photosByEvent,
        questsByEvent,
        membersByEvent,
        activeEventId:
          s.activeEventId === eventId ? (myEvents[0]?.id ?? null) : s.activeEventId,
      };
    });
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
