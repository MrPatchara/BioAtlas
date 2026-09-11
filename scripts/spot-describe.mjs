// Spot-check printer: node scripts/spot-describe.mjs "name fragment" (repeatable)
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  const queries = process.argv.slice(2);
  const list = queries.length
    ? atlas.concepts.filter((c) => queries.some((q) => c.name.toLowerCase().includes(q.toLowerCase())))
    : atlas.concepts.filter((c) => ['heart', 'femur', 'tibialis', 'trapezius', 'soleus', 'liver', 'ulna', 'patella', 'masseter', 'radial artery', 'median nerve', 'diaphragm', 'calcaneus', 'sternum', 'retina', 'malleolus', 'meniscus', 'thyroid', 'hippocampus', 'intercostal', 'deltoid', 'biceps femoris', 'abductor pollicis', 'frontal bone', 'aorta', 'lymph node', 'pupil', 'stapes', 'duodenum'].some((q) => c.name.toLowerCase() === q || c.name.toLowerCase() === `right ${q}`));
  for (const c of list.slice(0, 40)) {
    const part = atlas.parts.find((p) => c.elements.includes(p.id));
    const d = describeConcept(c, part?.system ?? 'connective');
    console.log(`### ${c.name}`);
    console.log(`EN: ${d.en}`);
    console.log(`TH: ${d.th}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
