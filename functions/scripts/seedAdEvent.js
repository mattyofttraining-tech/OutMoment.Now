/**
 * Seed (or re-seed) the always-on "Ad Mariage" marketing event in production.
 *
 * This writes DIRECTLY via the Firebase Admin SDK, bypassing the createEvent
 * Cloud Function (which now requires a paid Stripe session). It is idempotent:
 * the event, its quests and its photos all use deterministic IDs, so running it
 * again overwrites in place instead of creating duplicates.
 *
 * What it creates:
 *   • events/ad-mariage          — a marriage event flagged neverPurge: true
 *   • events/ad-mariage/members  — a host placeholder + a few demo guests
 *   • events/ad-mariage/quests   — the curated marriage quest pack
 *   • events/ad-mariage/photos   — one doc per image in PHOTO_DIR
 *   • Storage events/ad-mariage/photos/<name>.jpg — the uploaded images
 *
 * Auth (pick one):
 *   • Put a service-account key at functions/scripts/serviceAccount.json, OR
 *   • `gcloud auth application-default login` (Application Default Credentials).
 *
 * Run:
 *   cd functions
 *   node scripts/seedAdEvent.js
 *
 * After seeding, join the event in your recording browser with display name
 * "AdHost", then run:  node scripts/promoteHost.js AdHost
 * to make that browser the host (so you can film the Host dashboard too).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

// ─── Config — tweak these freely ────────────────────────────────────────────
const PROJECT_ID = 'ourmoment-prod';
const BUCKET = 'ourmoment-prod.firebasestorage.app';
const EVENT_ID = 'ad-mariage';
const CODE = 'MARIAGE-AD'; // the permanent join code you type in the app
const TITLE = 'Emma & Noah';
const SUBTITLE = 'Skagen · Midsummer';
const HOST_NAME = 'Emma';
// Folder of images to seed. Defaults to your renamed Mariage photos.
const PHOTO_DIR =
  process.argv[2] || 'C:/Users/Matty/Desktop/OurMomemt/Mariage';
// ─────────────────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const HOST_UID = 'ad-host-pending'; // replaced by promoteHost.js once you join

// Curated marriage quest pack (mirrors functions/src/questPacks.ts).
const MARRIAGE_QUESTS = [
  { icon: '💍', title: 'The Rings', prompt: 'A close-up of the rings before they’re worn.' },
  { icon: '👰', title: 'First Look', prompt: 'The moment they see each other.' },
  { icon: '🥂', title: 'A Toast', prompt: 'Someone raising a glass.' },
  { icon: '💃', title: 'First Dance', prompt: 'The couple’s first dance together.' },
  { icon: '😭', title: 'Happy Tears', prompt: 'Catch someone crying with joy.' },
  { icon: '👠', title: 'The Details', prompt: 'Shoes, flowers, or the dress up close.' },
  { icon: '🎉', title: 'The Exit', prompt: 'Confetti, sparklers, or the getaway car.' },
  { icon: '👨‍👩‍👧', title: 'The Generations', prompt: 'Three generations of family in one frame.' },
  { icon: '😂', title: 'Caught Laughing', prompt: 'A genuine, unposed laugh.' },
  { icon: '🌅', title: 'Golden Hour', prompt: 'A portrait in the best light of the day.' },
];

// Demo members so the gallery, leaderboard and "who's here" look alive on camera.
const MEMBERS = [
  { uid: HOST_UID, displayName: HOST_NAME, role: 'host', avatarColor: '#FF6B9D' },
  { uid: 'ad_guest_noah', displayName: 'Noah', role: 'guest', avatarColor: '#6C7BD6' },
  { uid: 'ad_guest_mia', displayName: 'Mia', role: 'guest', avatarColor: '#5BB8C4' },
  { uid: 'ad_guest_lars', displayName: 'Lars', role: 'guest', avatarColor: '#9B6BFF' },
  { uid: 'ad_guest_sofie', displayName: 'Sofie', role: 'guest', avatarColor: '#34C759' },
];

function initAdmin() {
  const keyPath = path.join(__dirname, 'serviceAccount.json');
  if (fs.existsSync(keyPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(keyPath)),
      projectId: PROJECT_ID,
      storageBucket: BUCKET,
    });
    console.log('Auth: service account key.');
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
      storageBucket: BUCKET,
    });
    console.log('Auth: application default credentials.');
  }
}

async function uploadPhoto(bucket, localPath, destName) {
  const storagePath = `events/${EVENT_ID}/photos/${destName}`;
  const token = crypto.randomUUID();
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: 'image/jpeg',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
    storagePath,
  )}?alt=media&token=${token}`;
  return { storagePath, url };
}

async function main() {
  if (!fs.existsSync(PHOTO_DIR)) {
    throw new Error(`Photo folder not found: ${PHOTO_DIR}`);
  }
  const files = fs
    .readdirSync(PHOTO_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();
  if (files.length === 0) throw new Error(`No images in ${PHOTO_DIR}`);

  initAdmin();
  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const now = Date.now();
  const eventRef = db.collection('events').doc(EVENT_ID);

  // 1. Quests (deterministic IDs → idempotent).
  const quests = MARRIAGE_QUESTS.map((q, i) => ({
    id: `quest_${String(i + 1).padStart(2, '0')}`,
    ...q,
    order: i + 1,
  }));

  // 2. Upload images + build photo docs.
  console.log(`Uploading ${files.length} photo(s) from ${PHOTO_DIR} …`);
  const photos = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base = file.replace(/\.[^.]+$/, '');
    const { storagePath, url } = await uploadPhoto(
      bucket,
      path.join(PHOTO_DIR, file),
      `${base}.jpg`,
    );
    const uploader = MEMBERS[(i + 1) % MEMBERS.length]; // skip pure-host bias
    const quest = quests[i % quests.length];
    photos.push({
      id: base,
      eventId: EVENT_ID,
      uploaderUid: uploader.uid,
      uploaderName: uploader.displayName,
      storagePath,
      url,
      width: 1200,
      height: 1600,
      createdAt: now - (files.length - i) * 60 * 60 * 1000, // staggered
      questId: quest.id,
      caption: quest.title,
    });
    console.log(`  ✓ ${file}`);
  }

  // 3. Which quests look "completed" (drives the host dashboard progress ring).
  const completedBy = {};
  for (const p of photos) {
    completedBy[p.questId] = completedBy[p.questId] || [];
    if (!completedBy[p.questId].includes(p.uploaderUid)) {
      completedBy[p.questId].push(p.uploaderUid);
    }
  }

  // 4. The event doc — neverPurge keeps it alive forever.
  const event = {
    type: 'marriage',
    title: TITLE,
    subtitle: SUBTITLE,
    hostUid: HOST_UID,
    hostName: HOST_NAME,
    code: CODE,
    coverImage: photos[0].url, // a real wedding shot as the cover
    status: 'live',
    createdAt: now - 2 * DAY,
    startsAt: now - 1 * DAY,
    expiresAt: now + 26 * DAY, // refreshAdEvents keeps this topped up
    memberCount: MEMBERS.length,
    photoCount: photos.length,
    memberUids: MEMBERS.map((m) => m.uid),
    aiBrief: null,
    guestTier: 'unlimited',
    neverPurge: true,
  };

  // 5. Commit everything in one batch.
  const batch = db.batch();
  batch.set(eventRef, event);
  MEMBERS.forEach((m) =>
    batch.set(eventRef.collection('members').doc(m.uid), {
      ...m,
      joinedAt: now - 2 * DAY,
    }),
  );
  quests.forEach((q) =>
    batch.set(eventRef.collection('quests').doc(q.id), {
      icon: q.icon,
      title: q.title,
      prompt: q.prompt,
      order: q.order,
      completedBy: completedBy[q.id] || [],
      aiGenerated: false,
    }),
  );
  photos.forEach((p) => {
    const { id, ...rest } = p;
    batch.set(eventRef.collection('photos').doc(id), rest);
  });
  await batch.commit();

  console.log('\n✅ Seeded "Ad Mariage".');
  console.log(`   Event ID : ${EVENT_ID}`);
  console.log(`   Join code: ${CODE}`);
  console.log(`   Photos   : ${photos.length}`);
  console.log('\nNext: open the site, join with code ' + CODE + ' as "AdHost",');
  console.log('then run:  node scripts/promoteHost.js AdHost');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message || err);
  process.exit(1);
});
