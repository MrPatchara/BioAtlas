// Validates public/data/markersets.json: schema, set membership, bone mapping.
// Run: node scripts/validate-markers.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const data = JSON.parse(readFileSync(`${root}public/data/markersets.json`, 'utf8'));
const atlas = JSON.parse(readFileSync(`${root}public/models/atlas.json`, 'utf8'));

const fail = [];
const ids = new Set();
const byName = new Map(atlas.concepts.map((c) => [String(c.name).toLowerCase(), c]));
for (const m of data.markers) {
  if (!m.id || ids.has(m.id)) fail.push(`duplicate/missing id: ${m.id}`);
  ids.add(m.id);
  for (const f of ['label', 'side', 'segment', 'placement', 'instruction', 'rule', 'sourceUrl']) {
    if (!m[f] || (Array.isArray(m[f]) && !m[f].length)) fail.push(`${m.id}: missing ${f}`);
  }
  if (!['left', 'right', 'midline'].includes(m.side)) fail.push(`${m.id}: bad side`);
  if (!/^https?:\/\//.test(m.sourceUrl)) fail.push(`${m.id}: sourceUrl must be http(s)`);
  if (!m.sets?.length) fail.push(`${m.id}: no sets`);
  if (!m.thPlacement) fail.push(`${m.id}: missing Thai placement`);
  if (!m.thInstruction) fail.push(`${m.id}: missing Thai instruction`);
  if (!Array.isArray(m.snap) || m.snap.length !== 3 || !m.snap.every((v) => Number.isFinite(v))) fail.push(`${m.id}: missing skin-snapped pos (run bake)`);
}
const setIds = new Set(data.sets.map((s) => s.id));
for (const m of data.markers) for (const s of m.sets) {
  if (!setIds.has(s)) fail.push(`${m.id}: unknown set ${s}`);
}
// Bone resolution + per-set counts (mirror of lib/markers.ts).
let mapped = 0;
const unmapped = [];
for (const m of data.markers) {
  let ok = false;
  if (m.side !== 'midline') {
    for (const k of m.bone) {
      const hit = byName.get(`${m.side} ${k.toLowerCase()}`);
      if (hit?.elements.length) { ok = true; break; }
    }
  }
  if (!ok) for (const k of m.bone) {
    const hit = byName.get(k.toLowerCase());
    if (hit?.elements.length) { ok = true; break; }
  }
  if (ok) mapped++;
  else unmapped.push(m.id);
}
console.log(`Markers: ${data.markers.length}, sets: ${data.sets.map((s) => `${s.id}=${s.markerIds.length}`).join(', ')}, bone-mapped: ${mapped}`);
if (unmapped.length) console.log(`Unmapped (dot hidden, still listed): ${unmapped.join(', ')}`);
for (const s of data.sets) {
  for (const mid of s.markerIds) {
    if (!ids.has(mid)) fail.push(`set ${s.id}: unknown marker ${mid}`);
  }
  if (!s.descriptionTh) fail.push(`set ${s.id}: missing Thai description`);
}
if (fail.length) {
  console.error('FAIL:');
  for (const f of fail) console.error(` - ${f}`);
  process.exit(1);
}
if (mapped < data.markers.length * 0.8) {
  console.error(`FAIL: bone coverage ${(mapped / data.markers.length * 100).toFixed(1)}% below 80%.`);
  process.exit(1);
}
console.log('Marker-set validation passed.');
