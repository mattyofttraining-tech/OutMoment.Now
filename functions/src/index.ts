import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { QUEST_PACKS, makeJoinCode, coverFor } from './questPacks';
import { generateQuestsWithAI } from './quests';

initializeApp();
const db = getFirestore();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_EVENT_AGE_DAYS = 30;

interface CreateEventData {
  type: string;
  title: string;
  subtitle?: string;
  hostName: string;
  startsAt: number;
  aiBrief?: string;
}

const VALID_TYPES = ['marriage', 'confirmation', 'baptism', 'birthday', 'special'];

/** Create an event, generate a unique code + quest pack, return the event. */
export const createEvent = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to host an event.');

  const data = request.data as CreateEventData;
  if (!data?.title || data.title.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Event needs a name.');
  }
  const type = VALID_TYPES.includes(data.type) ? data.type : 'special';
  const now = Date.now();

  // Generate a unique join code (retry on the rare collision).
  let code = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = makeJoinCode(type);
    const existing = await db.collection('events').where('code', '==', candidate).limit(1).get();
    if (existing.empty) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new HttpsError('internal', 'Could not allocate a code. Try again.');

  const eventRef = db.collection('events').doc();
  const event = {
    type,
    title: data.title.trim(),
    subtitle: data.subtitle?.trim() || null,
    hostUid: uid,
    hostName: data.hostName?.trim() || 'Host',
    code,
    coverImage: coverFor(type),
    status: 'upcoming',
    createdAt: now,
    startsAt: data.startsAt || now,
    expiresAt: now + THIRTY_DAYS_MS,
    memberCount: 1,
    photoCount: 0,
    memberUids: [uid],
    aiBrief: data.aiBrief?.trim() || null,
  };

  // Build the quest pack: AI for a provided brief, else the curated pack.
  let quests = QUEST_PACKS[type] ?? QUEST_PACKS.special;
  if (data.aiBrief && data.aiBrief.trim().length >= 8) {
    try {
      const ai = await generateQuestsWithAI(ANTHROPIC_API_KEY.value(), data.aiBrief.trim(), type);
      quests = ai;
    } catch (err) {
      logger.warn('AI quest generation failed; using curated pack.', err);
    }
  }

  const batch = db.batch();
  batch.set(eventRef, event);
  batch.set(eventRef.collection('members').doc(uid), {
    uid,
    displayName: event.hostName,
    role: 'host',
    joinedAt: now,
  });
  quests.forEach((q, i) => {
    batch.set(eventRef.collection('quests').doc(), {
      ...q,
      order: i + 1,
      completedBy: [],
      aiGenerated: Boolean(data.aiBrief),
    });
  });
  await batch.commit();

  return { event: { id: eventRef.id, ...event } };
});

interface JoinEventData {
  code: string;
  displayName: string;
}

/** Validate a join code and add the caller to that one closed event. */
export const joinEvent = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to join.');

  const { code, displayName } = request.data as JoinEventData;
  if (!code) throw new HttpsError('invalid-argument', 'Enter a code.');

  const normalized = code.trim().toUpperCase();
  const snap = await db.collection('events').where('code', '==', normalized).limit(1).get();
  if (snap.empty) throw new HttpsError('not-found', 'No event found for that code.');

  const eventDoc = snap.docs[0];
  const event = eventDoc.data();
  if ((event.expiresAt ?? 0) < Date.now()) {
    throw new HttpsError('failed-precondition', 'This event has expired.');
  }

  await eventDoc.ref.update({
    memberUids: FieldValue.arrayUnion(uid),
    memberCount: FieldValue.increment(1),
  });
  await eventDoc.ref.collection('members').doc(uid).set(
    {
      uid,
      displayName: (displayName || 'Guest').trim(),
      role: 'guest',
      joinedAt: Date.now(),
    },
    { merge: true },
  );

  return { eventId: eventDoc.id };
});

interface GenerateQuestsData {
  brief: string;
  eventType: string;
}

/** Standalone AI quest preview (used to boost any event type). */
export const generateQuests = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { brief, eventType } = request.data as GenerateQuestsData;
  if (!brief || brief.trim().length < 8) {
    throw new HttpsError('invalid-argument', 'Tell us a bit more about your event.');
  }
  const quests = await generateQuestsWithAI(
    ANTHROPIC_API_KEY.value(),
    brief.trim(),
    VALID_TYPES.includes(eventType) ? eventType : 'special',
  );
  return {
    quests: quests.map((q, i) => ({
      id: `aiq_${i}`,
      ...q,
      order: i + 1,
      completedBy: [],
      aiGenerated: true,
    })),
  };
});

interface CheckoutData {
  eventType: string;
  title: string;
}

const PRICES: Record<string, number> = {
  marriage: 14900,
  confirmation: 8900,
  baptism: 8900,
  birthday: 6900,
  special: 9900,
};

/**
 * Create a Stripe Checkout session for a booking. Booking is a real-world
 * service (generally IAP-exempt) — confirm against App Store guidelines.
 */
export const createCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { eventType, title } = request.data as CheckoutData;

  const key = STRIPE_SECRET_KEY.value();
  if (!key) {
    throw new HttpsError('unimplemented', 'Stripe is not configured yet. Set STRIPE_SECRET_KEY.');
  }

  // Lazy-import so the function only pulls Stripe when actually configured.
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: 'ourmoment://checkout-complete?status=success',
    cancel_url: 'ourmoment://checkout-complete?status=cancel',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: PRICES[eventType] ?? PRICES.special,
          product_data: { name: `OurMoment — ${title || 'Event'}` },
        },
      },
    ],
    metadata: { uid: request.auth.uid, eventType },
  });

  return { url: session.url };
});

/**
 * THE PRODUCT: a hard, irreversible delete of every event past its 30-day life.
 * Runs daily. Deletes Storage objects first, then the Firestore tree.
 * There is no soft-delete and no recovery — by design.
 */
export const purgeExpiredEvents = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'UTC', timeoutSeconds: 540, memory: '512MiB' },
  async () => {
    const now = Date.now();
    const expired = await db
      .collection('events')
      .where('expiresAt', '<=', now)
      .limit(200)
      .get();

    if (expired.empty) {
      logger.info('Purge: nothing expired.');
      return;
    }

    const bucket = getStorage().bucket();
    let deleted = 0;

    for (const doc of expired.docs) {
      const eventId = doc.id;
      try {
        // 1. Hard-delete all photos in object storage for this event.
        await bucket.deleteFiles({ prefix: `events/${eventId}/` });
        // 2. Recursively delete the Firestore document tree (photos/quests/members).
        await db.recursiveDelete(doc.ref);
        deleted++;
        logger.info(`Purged event ${eventId}.`);
      } catch (err) {
        logger.error(`Failed to purge event ${eventId}`, err);
      }
    }

    logger.info(`Purge complete. Removed ${deleted}/${expired.size} expired events.`);
  },
);

export { MAX_EVENT_AGE_DAYS };
