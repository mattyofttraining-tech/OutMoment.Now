/**
 * Set up the Stripe webhook endpoint for stripeWebhook (Cloud Functions).
 *
 * Reads STRIPE_SECRET_KEY from Google Secret Manager via Application Default
 * Credentials, ensures a webhook endpoint exists on the Stripe account for
 * `checkout.session.completed`, and writes the endpoint's signing secret to
 * a local temp file (.webhook-secret.tmp) so it can be piped into
 * `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --data-file …`
 * without the secret ever appearing on screen.
 *
 * If an endpoint for our URL already exists, it is deleted and recreated,
 * because Stripe only reveals the signing secret at creation time.
 *
 * Run:  cd functions && node scripts/setupStripeWebhook.js
 */

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = 'ourmoment-prod';
const WEBHOOK_URL =
  'https://europe-west1-ourmoment-prod.cloudfunctions.net/stripeWebhook';
const EVENTS = ['checkout.session.completed'];
const OUT_FILE = path.join(__dirname, '.webhook-secret.tmp');

async function getStripeKey() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const res = await client.request({
    url: `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/STRIPE_SECRET_KEY/versions/latest:access`,
  });
  return Buffer.from(res.data.payload.data, 'base64').toString('utf8').trim();
}

async function stripeRequest(key, method, endpoint, params) {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe ${method} ${endpoint} → ${res.status}: ${json.error?.message}`);
  }
  return json;
}

async function main() {
  const key = await getStripeKey();
  const mode = key.startsWith('sk_test_') ? 'TEST (sandbox)' : 'LIVE';
  console.log(`Stripe key loaded from Secret Manager (${mode} mode).`);

  const existing = await stripeRequest(key, 'GET', 'webhook_endpoints?limit=100');
  for (const ep of existing.data) {
    if (ep.url === WEBHOOK_URL) {
      console.log(`Existing endpoint ${ep.id} for our URL — deleting to get a fresh signing secret.`);
      await stripeRequest(key, 'DELETE', `webhook_endpoints/${ep.id}`);
    }
  }

  const params = { url: WEBHOOK_URL, description: 'OurMoment checkout completion (audit/reconciliation)' };
  EVENTS.forEach((e, i) => (params[`enabled_events[${i}]`] = e));
  const ep = await stripeRequest(key, 'POST', 'webhook_endpoints', params);

  fs.writeFileSync(OUT_FILE, ep.secret, { encoding: 'utf8' });
  console.log(`✅ Webhook endpoint created: ${ep.id}`);
  console.log(`   URL    : ${ep.url}`);
  console.log(`   Events : ${ep.enabled_events.join(', ')}`);
  console.log(`   Status : ${ep.status}`);
  console.log(`   Signing secret (${ep.secret.slice(0, 6)}…, ${ep.secret.length} chars) written to ${OUT_FILE}`);
  console.log('\nNext: npx firebase-tools functions:secrets:set STRIPE_WEBHOOK_SECRET --data-file functions/scripts/.webhook-secret.tmp --project ourmoment-prod');
}

main().catch((err) => {
  console.error('❌ Failed:', err.message || err);
  process.exit(1);
});
