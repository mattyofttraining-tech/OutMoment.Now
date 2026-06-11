/**
 * Restore the Ad Mariage event to seeded photos only: delete every photo whose
 * uploader is NOT one of the fake seed members (ad_guest_* / ad-host-pending).
 * Catches anything uploaded through the app/PWA by a real user, regardless of
 * which anonymous uid the browser session got.
 *
 * For each real-user photo it removes the Storage file and Firestore doc,
 * decrements photoCount, strips those uids from every quest's completedBy,
 * and resets the cover image if it pointed at a deleted photo.
 *
 * Dry run (lists what would be deleted, changes nothing):
 *   node functions/scripts/deleteHostPhotos.js
 *
 * Actually delete:
 *   node functions/scripts/deleteHostPhotos.js --delete
 *
 * Auth: same as seedAdEvent.js (serviceAccount.json or ADC).
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const PROJECT_ID = 'ourmoment-prod';
const BUCKET = 'ourmoment-prod.firebasestorage.app';
const EVENT_ID = 'ad-mariage';
const DELETE = process.argv.includes('--delete');

// Fake uids written by seedAdEvent.js — photos from these stay.
const SEED_UIDS = new Set([
  'ad-host-pending',
  'ad_guest_noah',
  'ad_guest_mia',
  'ad_guest_lars',
  'ad_guest_sofie',
]);

function initAdmin() {
  const keyPath = path.join(__dirname, 'serviceAccount.json');
  const opts = { projectId: PROJECT_ID, storageBucket: BUCKET };
  if (fs.existsSync(keyPath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(keyPath)), ...opts });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault(), ...opts });
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const eventRef = db.collection('events').doc(EVENT_ID);

  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) throw new Error(`Event ${EVENT_ID} not found.`);
  const event = eventSnap.data();

  const all = await eventRef.collection('photos').get();
  const docs = all.docs.filter((d) => !SEED_UIDS.has(d.data().uploaderUid));
  console.log(`Photos in event: ${all.size} total, ${docs.length} from real users.`);

  if (docs.length === 0) {
    console.log('Gallery is already seeded-only — nothing to do.');
    process.exit(0);
  }

  console.log(`\n${DELETE ? 'Deleting' : 'Would delete'} ${docs.length} photo(s):`);
  for (const doc of docs) {
    const p = doc.data();
    console.log(
      `  • ${doc.id}  by=${p.uploaderName} (${p.uploaderUid})  quest=${p.questId || '-'}  ${new Date(p.createdAt).toISOString()}\n    ${p.storagePath || p.url}`,
    );
  }

  if (!DELETE) {
    console.log('\nDry run — re-run with --delete to remove them.');
    process.exit(0);
  }

  // 1. Storage files (tolerate already-missing files).
  for (const doc of docs) {
    const p = doc.data();
    if (p.storagePath) {
      await bucket
        .file(p.storagePath)
        .delete()
        .then(() => console.log(`  ✓ storage ${p.storagePath}`))
        .catch((e) => console.warn(`  ! storage ${p.storagePath}: ${e.message}`));
    }
  }

  // 2. Firestore docs + counters + quest completion in one batch.
  const deletedUrls = new Set(docs.map((d) => d.data().url));
  const deletedUids = [...new Set(docs.map((d) => d.data().uploaderUid))];
  const batch = db.batch();
  docs.forEach((d) => batch.delete(d.ref));
  batch.update(eventRef, {
    photoCount: admin.firestore.FieldValue.increment(-docs.length),
  });

  const quests = await eventRef.collection('quests').get();
  quests.docs.forEach((q) => {
    const completedBy = q.data().completedBy || [];
    if (deletedUids.some((uid) => completedBy.includes(uid))) {
      batch.update(q.ref, {
        completedBy: admin.firestore.FieldValue.arrayRemove(...deletedUids),
      });
    }
  });

  if (deletedUrls.has(event.coverImage)) {
    const keep = all.docs.find((d) => SEED_UIDS.has(d.data().uploaderUid));
    batch.update(eventRef, { coverImage: keep ? keep.data().url : null });
    console.log('  ✓ cover image reset (it was one of the deleted photos)');
  }

  await batch.commit();
  console.log(`\n✅ Removed ${docs.length} real-user photo(s) — ${EVENT_ID} is seeded-only again.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ deleteHostPhotos failed:', err.message || err);
  process.exit(1);
});
