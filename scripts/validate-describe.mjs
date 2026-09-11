// Validates lib/describe.ts: every atlas concept gets a non-empty EN+TH
// description, region coverage, and curated spot-checks.
// Run: node scripts/validate-describe.mjs
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'describe-'));
try {
  writeFileSync(join(tmp, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      baseUrl: root,
      paths: { '@/*': ['./*'] },
      outDir: join(tmp, 'out'),
      module: 'commonjs',
      target: 'es2020',
      skipLibCheck: true,
      esModuleInterop: true,
    },
    include: [join(root, 'lib/describe.ts'), join(root, 'app/anatomy.ts'), join(root, 'lib/i18n.ts')],
  }));
  execSync(`npx tsc -p ${join(tmp, 'tsconfig.json')}`, { cwd: root, stdio: 'pipe' });
  const { describeConcept } = await import(pathToFileURL(join(tmp, 'out', 'lib', 'describe.js')).href);
  const atlas = JSON.parse(readFileSync(join(root, 'public/models/atlas.json'), 'utf8'));

  const fail = [];
  let withRegion = 0;
  const seenEn = new Map();
  for (const c of atlas.concepts) {
    // Concepts reference a system via their parts; use the first part's system.
    const part = atlas.parts.find((p) => c.elements.includes(p.id));
    const d = describeConcept(c, part?.system ?? 'connective');
    if (!d.en || !d.th) fail.push(`${c.name}: empty description`);
    if (/\([^)]+\)\./.test(d.en)) withRegion++;
    const key = d.en;
    if (!seenEn.has(key)) seenEn.set(key, []);
    seenEn.get(key).push(c.name);
  }
  // Distinct concepts must not share identical text (sides/subdivisions differ).
  const dupes = [...seenEn.entries()].filter(([, v]) => v.length > 1);
  for (const [, v] of dupes.slice(0, 10)) fail.push(`duplicate text for: ${v.slice(0, 4).join(' | ')}`);

  // Curated spot-checks (verified functions).
  const byName = new Map(atlas.concepts.map((c) => [c.name.toLowerCase(), c]));
  const sysOf = (n) => atlas.parts.find((p) => byName.get(n)?.elements.includes(p.id))?.system ?? 'connective';
  const check = (name, wantEn, wantTh) => {
    const c = byName.get(name);
    if (!c) { fail.push(`spot-check concept missing: ${name}`); return; }
    const d = describeConcept(c, sysOf(name));
    if (!d.en.toLowerCase().includes(wantEn.toLowerCase())) fail.push(`${name}: EN missing "${wantEn}" (got: ${d.en.slice(0, 90)}…)`);
    if (!d.th.includes(wantTh)) fail.push(`${name}: TH missing "${wantTh}" (got: ${d.th.slice(0, 90)}…)`);
  };
  check('heart', 'muscular pump', 'ปั๊มกล้ามเนื้อ');
  check('liver', 'bile', 'น้ำดี');
  // Muscles with EMG entries must render Origin/Insertion blocks.
  const seniam = JSON.parse(readFileSync(join(root, 'public/data/seniam.json'), 'utf8'));
  const strip = (s) => s.toLowerCase().replace(/(^|\s)(left|right)(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  const findEntry = (conceptName) => {
    const stripped = strip(conceptName);
    const cands = [];
    for (const e of seniam.entries) {
      for (const k of e.matchNames) {
        if (k.length >= 6 && stripped.includes(k.toLowerCase())) cands.push([k.length, e]);
      }
    }
    cands.sort((a, b) => b[0] - a[0]);
    return cands[0]?.[1] ?? null;
  };
  const checkOI = (name) => {
    const c = byName.get(name);
    if (!c) { fail.push(`spot-check concept missing: ${name}`); return; }
    const entry = findEntry(name);
    if (!entry) { fail.push(`${name}: no EMG entry resolved`); return; }
    const d = describeConcept(c, sysOf(name), entry);
    for (const want of ['Origin:', 'Insertion:', 'Function:']) {
      if (!d.en.includes(want)) fail.push(`${name}: EN missing "${want}"`);
    }
    for (const want of ['จุดเกาะต้น:', 'จุดเกาะปลาย:', 'หน้าที่:']) {
      if (!d.th.includes(want)) fail.push(`${name}: TH missing "${want}"`);
    }
  };
  for (const n of ['right vastus lateralis', 'right tibialis anterior', 'medial head of right gastrocnemius', 'left fibularis longus', 'descending part of right trapezius', 'long head of right biceps femoris']) checkOI(n);
  check('right femur', 'thigh', 'ต้นขา');
  check('sternocleidomastoid', 'neck', 'คอ');
  check('retinaculum', 'wrist', 'ข้อมือ');
  check('ulna', 'forearm', 'ปลายแขน');
  check('aorta', 'chest and abdomen', 'ช่องอกและช่องท้อง');
  check('duodenum', 'small intestine', 'ลำไส้เล็ก');
  check('vertebral artery', 'neck', 'คอ');
  check('pituitary gland', 'endocrine glands', 'ต่อมไร้ท่อ');
  check('corpus cavernosum of penis', 'external genitalia', 'อวัยวะเพศภายนอก');
  check('corpus cavernosum of penis', 'erection', 'การแข็งตัว');
  check('gallbladder', 'abdomen', 'ช่องท้อง');
  check('ureter', 'expels urine', 'ขับปัสสาวะ');
  check('aorta', 'chest and abdomen', 'ช่องอกและช่องท้อง');
  check('anterior papillary muscle of right ventricle', 'heart', 'หัวใจ');

  console.log(`Concepts: ${atlas.concepts.length}, with region: ${withRegion} (${(withRegion / atlas.concepts.length * 100).toFixed(1)}%)`);
  if (fail.length) {
    console.error(`FAIL (${fail.length}):`);
    for (const f of fail.slice(0, 30)) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log('Describe validation passed.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
