#!/usr/bin/env node
// Verifies every curated quest title (client pack, server pack, offline
// generator) has an entry in src/i18n/questTranslations.ts for every locale.
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

const titles = new Set();
for (const m of read('src/data/eventWorlds.ts').matchAll(/quest\('[^']*', '([^']+)'/g)) titles.add(m[1]);
for (const m of read('src/services/questGenerator.ts').matchAll(/title: '([^']+)'/g)) titles.add(m[1]);
for (const m of read('functions/src/questPacks.ts').matchAll(/title: '([^']+)'/g)) titles.add(m[1]);

const table = read('src/i18n/questTranslations.ts');
const locales = [...table.matchAll(/^const (\w+): QuestDict = \{/gm)].map((m) => m[1]);

let failed = false;
for (const loc of locales) {
  const start = table.indexOf(`const ${loc}: QuestDict`);
  const end = table.indexOf('\n};', start);
  const block = table.slice(start, end);
  const missing = [...titles].filter(
    (t) => !block.includes(`'${t}':`) && !new RegExp(`^  ${t}:`, 'm').test(block),
  );
  if (missing.length) {
    failed = true;
    console.log(`${loc}: MISSING ${missing.join(' | ')}`);
  } else {
    console.log(`${loc}: all ${titles.size} titles covered`);
  }
}
process.exit(failed ? 1 : 0);
