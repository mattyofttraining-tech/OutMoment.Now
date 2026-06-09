/**
 * Promote a joined member of the Ad Mariage event to be its host, so that
 * browser sees the Host dashboard (stats, leaderboard, invite-code card).
 *
 * Flow:
 *   1. Run seedAdEvent.js.
 *   2. In your recording browser, open the site → Join → code MARIAGE-AD,
 *      and set your display name to "AdHost" (or any name you pass below).
 *   3. Run:  cd functions && node scripts/promoteHost.js AdHost
 *
 * It finds the most recently-joined member with that display name, sets the
 * event's hostUid/hostName to them, and flips their member role to "host".
 *
 * Auth: same as seedAdEvent.js (serviceAccount.json or ADC).
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const PROJECT_ID = 'ourmoment-prod';
const BUCKET = 'ourmoment-prod.firebasestorage.app';
const EVENT_ID = 'ad-mariage';
const DISPLAY_NAME = process.argv[2] || 'AdHost';

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
  const eventRef = db.collection('events').doc(EVENT_ID);

  const members = await eventRef.collection('members').get();
  const matches = members.docs
    .map((d) => d.data())
    .filter((m) => (m.displayName || '').toLowerCase() === DISPLAY_NAME.toLowerCase())
    .sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));

  if (matches.length === 0) {
    throw new Error(
      `No member named "${DISPLAY_NAME}" found. Join the event with that exact display name first.`,
    );
  }
  const host = matches[0];

  await eventRef.update({ hostUid: host.uid, hostName: host.displayName });
  await eventRef.collection('members').doc(host.uid).set({ role: 'host' }, { merge: true });

  console.log(`✅ Promoted "${host.displayName}" (${host.uid}) to host of ${EVENT_ID}.`);
  console.log('Reload the app in that browser — you now see the Host dashboard.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ promoteHost failed:', err.message || err);
  process.exit(1);
});
