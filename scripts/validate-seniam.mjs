// Validates public/data/seniam.json: schema, unique ids, source links, atlas mapping coverage.
// Run: node scripts/validate-seniam.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const seniam = JSON.parse(readFileSync(`${root}public/data/seniam.json`, 'utf8'));
const atlas = JSON.parse(readFileSync(`${root}public/models/atlas.json`, 'utf8'));

const fail = [];
const ids = new Set();
for (const e of seniam.entries) {
  if (!e.id || ids.has(e.id)) fail.push(`duplicate/missing id: ${e.id}`);
  ids.add(e.id);
  for (const f of ['muscle', 'region', 'placement', 'orientation', 'posture', 'test', 'sourceUrl']) {
    if (!e[f] || (Array.isArray(e[f]) && !e[f].length)) fail.push(`${e.id}: missing ${f}`);
  }
  if (!/^https?:\/\/.*seniam\.org\//.test(e.sourceUrl)) fail.push(`${e.id}: sourceUrl must point at seniam.org`);
  if (e.standard !== 'SENIAM' && e.standard !== 'extended') fail.push(`${e.id}: standard must be SENIAM or extended`);
  if (e.standard === 'extended' && !e.citation) fail.push(`${e.id}: extended entries must carry a citation`);
  if (e.standard === 'SENIAM' && !/^\/images\/seniam\/[A-Za-z0-9_-]+\.gif$/.test(e.imageUrl ?? '')) fail.push(`${e.id}: SENIAM entries must bundle a local illustration in public/images/seniam/`);
  if (e.imageUrl && !existsSync(`${root}public${e.imageUrl}`)) fail.push(`${e.id}: illustration file missing: public${e.imageUrl}`);
  if (typeof e.iedMm !== 'number' || !(e.iedMm > 0)) fail.push(`${e.id}: iedMm must be a positive number (20 standard, 7.5 for small hand muscles)`);
  for (const f of ['placement', 'orientation', 'reference', 'posture', 'test']) {
    if (!e.th?.[f]) fail.push(`${e.id}: missing Thai ${f}`);
  }
}

// Coverage: every entry should match >=1 atlas concept by substring.
const names = atlas.concepts.map((c) => String(c.name).toLowerCase());
for (const e of seniam.entries) {
  for (const extra of e.alsoInclude ?? []) {
    if (!names.includes(extra.toLowerCase())) console.log(`Note: ${e.id} alsoInclude "${extra}" has no exact atlas concept (ignored).`);
  }
}
let mapped = 0;
const unmapped = [];
for (const e of seniam.entries) {
  const keys = [...e.matchNames].sort((a, b) => b.length - a.length).map((s) => s.toLowerCase());
  const hit = keys.some((k) => names.some((n) => n === k || (k.length >= 5 && n.includes(k))));
  if (hit) mapped++;
  else unmapped.push(e.id);
}

console.log(`EMG entries: ${seniam.entries.length} (SENIAM ${seniam.entries.filter(e=>e.standard==='SENIAM').length}, extended ${seniam.entries.filter(e=>e.standard==='extended').length}), mapped to atlas: ${mapped}`);
if (unmapped.length) console.log(`Unmapped (will hide marker, still listed): ${unmapped.join(', ')}`);
if (fail.length) {
  console.error('FAIL:');
  for (const f of fail) console.error(` - ${f}`);
  process.exit(1);
}
if (mapped < seniam.entries.length * 0.8) {
  console.error(`FAIL: mapping coverage ${(mapped / seniam.entries.length * 100).toFixed(1)}% below 80% threshold.`);
  process.exit(1);
}
console.log('SENIAM validation passed.');
