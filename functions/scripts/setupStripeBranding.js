/**
 * Apply OurMoment branding to the Stripe account behind STRIPE_SECRET_KEY,
 * so Checkout stops looking like FitSync (green) and matches the logo.
 *
 * Sets (Dashboard → Settings → Branding equivalents):
 *   • icon            — brand-kit full-bleed squircle (shown in Checkout header)
 *   • logo            — transparent lockup (used in emails/receipts)
 *   • primary_color   — #EC8D65 (peach, gradient bottom) — "brand color"
 *   • secondary_color — #A3564A (copper, the emblem)     — "accent color" (pay button)
 *   • business_profile.name — "OurMoment"
 *
 * SAFETY: refuses to run if the account's name mentions FitSync, so the old
 * shared account can never be rebranded by accident. Run this only AFTER
 * STRIPE_SECRET_KEY has been rotated to the new OurMoment account.
 *
 * Run:  node functions/scripts/setupStripeBranding.js
 */

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require(path.join(__dirname, '..', 'node_modules', 'google-auth-library'));

const PROJECT_ID = 'ourmoment-prod';
const BRAND_DIR = 'C:/Users/Matty/Desktop/OurMoment-Brand';
const ICON_PNG = path.join(BRAND_DIR, 'ourmoment-icon-fullbleed-1024.png');
const LOGO_PNG = path.join(BRAND_DIR, 'ourmoment-lockup-transparent.png');
const PRIMARY_COLOR = '#EC8D65'; // brand color (page background tint)
const SECONDARY_COLOR = '#A3564A'; // accent color (pay button)

async function getStripeKey() {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const res = await client.request({
    url: `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/STRIPE_SECRET_KEY/versions/latest:access`,
  });
  return Buffer.from(res.data.payload.data, 'base64').toString('utf8').trim();
}

async function api(key, method, url, body, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${key}`, ...headers },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}: ${json.error?.message}`);
  return json;
}

async function uploadFile(key, filePath) {
  const form = new FormData();
  form.append('purpose', 'business_logo');
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: 'image/png' }), path.basename(filePath));
  const file = await api(key, 'POST', 'https://files.stripe.com/v1/files', form);
  console.log(`  ✓ uploaded ${path.basename(filePath)} → ${file.id}`);
  return file.id;
}

async function main() {
  const key = await getStripeKey();
  const mode = key.startsWith('sk_test_') ? 'TEST (sandbox)' : 'LIVE';

  const account = await api(key, 'GET', 'https://api.stripe.com/v1/account');
  const name =
    account.business_profile?.name || account.settings?.dashboard?.display_name || '(unnamed)';
  console.log(`Account: ${name} (${account.id}) — ${mode} mode.`);

  if (/fitsync/i.test(name)) {
    console.error(
      '❌ This key belongs to the FitSync account — refusing to rebrand it.\n' +
        '   Create the OurMoment Stripe account, rotate STRIPE_SECRET_KEY to its key, then rerun.',
    );
    process.exit(1);
  }

  console.log('Uploading brand assets …');
  const iconId = await uploadFile(key, ICON_PNG);
  const logoId = await uploadFile(key, LOGO_PNG);

  const params = new URLSearchParams({
    'settings[branding][icon]': iconId,
    'settings[branding][logo]': logoId,
    'settings[branding][primary_color]': PRIMARY_COLOR,
    'settings[branding][secondary_color]': SECONDARY_COLOR,
    'business_profile[name]': 'OurMoment',
  });
  await api(key, 'POST', 'https://api.stripe.com/v1/account', params, {
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  console.log('\n✅ Branding applied:');
  console.log(`   brand color  : ${PRIMARY_COLOR} (peach)`);
  console.log(`   accent/button: ${SECONDARY_COLOR} (copper)`);
  console.log('   icon + logo  : from Desktop/OurMoment-Brand');
  console.log('\nFine-tune anytime with live preview: Dashboard → Settings → Branding.');
}

main().catch((err) => {
  console.error('❌ Failed:', err.message || err);
  process.exit(1);
});
