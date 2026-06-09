import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { logger } from 'firebase-functions';
import { QUEST_PACKS, makeJoinCode, coverFor } from './questPacks';
import { generateQuestsWithAI } from './quests';
import { priceCents, type GuestTierId } from './pricing';

initializeApp();
const db = getFirestore();

// All functions deploy to the EU to match Firestore (eur3) / Storage residency.
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

/** Origins allowed to receive the Checkout redirect on web. */
const WEB_ORIGINS = [
  'https://ourmoment-prod.web.app',
  'https://ourmoment.store',
  'https://www.ourmoment.store',
];

async function getStripe(key: string) {
  // Lazy-import so functions only pull Stripe when actually configured.
  const Stripe = (await import('stripe')).default;
  return new Stripe(key);
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_EVENT_AGE_DAYS = 30;

interface CreateEventData {
  type: string;
  title: string;
  subtitle?: string;
  hostName: string;
  startsAt: number;
  aiBrief?: string;
  guestTier?: GuestTierId;
  /** Stripe Checkout session that paid for this booking. */
  checkoutSessionId?: string;
}

const VALID_TYPES = ['marriage', 'confirmation', 'baptism', 'birthday', 'special'];

/** Create an event, generate a unique code + quest pack, return the event. */
export const createEvent = onCall(
  { secrets: [ANTHROPIC_API_KEY, STRIPE_SECRET_KEY] },
  async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to host an event.');

  const data = request.data as CreateEventData;
  if (!data?.title || data.title.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Event needs a name.');
  }
  const type = VALID_TYPES.includes(data.type) ? data.type : 'special';
  const now = Date.now();

  // Payment gate: when Stripe is configured, an event can only be created
  // from a paid, unconsumed Checkout session for this exact uid/type/tier.
  // The browser redirect is never trusted (see stripeWebhook docs above).
  if (STRIPE_SECRET_KEY.value()) {
    await verifyAndConsumePayment(uid, data.checkoutSessionId, type, data.guestTier || 'intimate');
  }

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
    guestTier: data.guestTier || 'intimate',
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

  // Close the audit loop: link the payment to the event it bought.
  if (data.checkoutSessionId) {
    await db
      .collection('payments')
      .doc(data.checkoutSessionId)
      .set({ eventId: eventRef.id }, { merge: true })
      .catch((err) => logger.warn('Could not link payment to event.', err));
  }

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
  guestTier?: GuestTierId;
  /** 'web' redirects back to the PWA origin; anything else uses the app scheme. */
  platform?: 'web' | 'native';
  /** The PWA's origin (validated against WEB_ORIGINS). */
  webOrigin?: string;
}

/**
 * Create a Stripe Checkout session for a booking. Price scales with the chosen
 * guest-capacity tier. Booking is a real-world service (generally IAP-exempt) —
 * confirm against App Store guidelines.
 *
 * Payment is verified server-side in createEvent (session retrieval + single
 * use); the redirect back to the app is purely UX.
 */
export const createCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { eventType, title, guestTier, platform, webOrigin } = request.data as CheckoutData;

  const key = STRIPE_SECRET_KEY.value();
  if (!key) {
    throw new HttpsError('unimplemented', 'Stripe is not configured yet. Set STRIPE_SECRET_KEY.');
  }

  const tier: GuestTierId = guestTier || 'intimate';
  const amount = priceCents(eventType, tier);

  // Where Checkout sends the user afterwards. {CHECKOUT_SESSION_ID} is
  // substituted by Stripe so the app can verify the exact session it paid for.
  let returnBase = 'ourmoment://checkout-complete';
  if (platform === 'web') {
    if (!webOrigin || !WEB_ORIGINS.includes(webOrigin)) {
      throw new HttpsError('invalid-argument', 'Unrecognized web origin.');
    }
    returnBase = `${webOrigin}/checkout-complete`;
  }

  const stripe = await getStripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${returnBase}?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnBase}?status=cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: amount,
          product_data: { name: `OurMoment — ${title || 'Event'} (${tier})` },
        },
      },
    ],
    payment_intent_data: { statement_descriptor: 'OURMOMENT' },
    metadata: { uid: request.auth.uid, eventType, guestTier: tier },
  });

  return { url: session.url, sessionId: session.id };
});

/**
 * Stripe webhook — the durable record of what was actually paid.
 * Signature-verified; writes payments/{sessionId} so payments remain auditable
 * and reconcilable even if the client dies right after paying. createEvent
 * independently verifies the session against the Stripe API before creating
 * anything, so a forged client cannot skip payment either way.
 *
 * Setup: add an endpoint for this function's URL in the Stripe dashboard
 * (event: checkout.session.completed) and store its signing secret as the
 * STRIPE_WEBHOOK_SECRET function secret.
 */
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const key = STRIPE_SECRET_KEY.value();
    const whSecret = STRIPE_WEBHOOK_SECRET.value();
    const signature = req.headers['stripe-signature'];
    if (!key || !whSecret || !signature) {
      res.status(400).send('Webhook not configured.');
      return;
    }

    const stripe = await getStripe(key);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, whSecret);
    } catch (err) {
      logger.warn('Webhook signature verification failed.', err);
      res.status(400).send('Invalid signature.');
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await db.collection('payments').doc(session.id).set(
        {
          status: session.payment_status,
          uid: session.metadata?.uid ?? null,
          eventType: session.metadata?.eventType ?? null,
          guestTier: session.metadata?.guestTier ?? null,
          amountTotal: session.amount_total,
          currency: session.currency,
          paidAt: Date.now(),
        },
        { merge: true },
      );
      logger.info(`Payment recorded for session ${session.id}.`);
    }

    res.status(200).send('ok');
  },
);

/**
 * Verify a Checkout session is genuinely paid, belongs to this user, matches
 * what they're trying to create, and has never been used before. Marks it
 * consumed atomically so one payment buys exactly one event.
 */
async function verifyAndConsumePayment(
  uid: string,
  sessionId: string | undefined,
  eventType: string,
  tier: GuestTierId,
): Promise<void> {
  if (!sessionId) {
    throw new HttpsError('failed-precondition', 'Payment required before creating an event.');
  }

  const stripe = await getStripe(STRIPE_SECRET_KEY.value());
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new HttpsError('failed-precondition', 'This booking has not been paid.');
  }
  if (session.metadata?.uid !== uid) {
    throw new HttpsError('permission-denied', 'This payment belongs to a different user.');
  }
  if (session.metadata?.eventType !== eventType || session.metadata?.guestTier !== tier) {
    throw new HttpsError(
      'failed-precondition',
      'This payment was for a different event type or guest tier.',
    );
  }

  // Single use: atomically flip consumed on payments/{sessionId}.
  const ref = db.collection('payments').doc(sessionId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists && snap.data()?.consumed) {
      throw new HttpsError('already-exists', 'This payment was already used for an event.');
    }
    tx.set(ref, { consumed: true, consumedAt: Date.now(), uid }, { merge: true });
  });
}

/** Host-only hard delete of an event and all its photos / quests / members. */
export const deleteEvent = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { eventId } = request.data as { eventId?: string };
  if (!eventId) throw new HttpsError('invalid-argument', 'Missing eventId.');

  const ref = db.collection('events').doc(eventId);
  const snap = await ref.get();
  if (!snap.exists) return { deleted: true }; // already gone — idempotent
  if (snap.data()?.hostUid !== uid) {
    throw new HttpsError('permission-denied', 'Only the host can delete this event.');
  }

  // Same hard delete as the scheduled purge: Storage objects, then Firestore tree.
  await getStorage().bucket().deleteFiles({ prefix: `events/${eventId}/` });
  await db.recursiveDelete(ref);
  logger.info(`Host ${uid} deleted event ${eventId}.`);
  return { deleted: true };
});

/** A guest removes themselves from an event. Hosts must delete instead. */
export const leaveEvent = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { eventId } = request.data as { eventId?: string };
  if (!eventId) throw new HttpsError('invalid-argument', 'Missing eventId.');

  const ref = db.collection('events').doc(eventId);
  const snap = await ref.get();
  if (!snap.exists) return { left: true }; // already gone — idempotent
  if (snap.data()?.hostUid === uid) {
    throw new HttpsError('failed-precondition', 'The host cannot leave — delete the event instead.');
  }
  await ref.update({
    memberUids: FieldValue.arrayRemove(uid),
    memberCount: FieldValue.increment(-1),
  });
  await ref.collection('members').doc(uid).delete().catch(() => {});
  logger.info(`Guest ${uid} left event ${eventId}.`);
  return { left: true };
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
