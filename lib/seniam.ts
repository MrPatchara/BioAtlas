import type { Atlas } from '../app/anatomy';

export interface SeniamEntry {
  id: string;
  muscle: string;
  subdivision: string | null;
  region: string;
  matchNames: string[];
  landmarks: [string, string] | string[];
  placement: string;
  orientation: string;
  iedMm: number;
  reference: string;
  posture: string;
  test: string;
  sourceUrl: string;
  standard: 'SENIAM' | 'extended';
  citation?: string;
  /** SENIAM-hosted illustration (link-out only; never bundled). */
  imageUrl?: string;
  /** Extra atlas concept names (exact) whose parts belong to the same muscle
   * (sibling subdivisions/zones), unioned into this entry's anchors. */
  alsoInclude?: string[];
  /** Thai translation of the five descriptive fields. */
  th?: { placement: string; orientation: string; reference: string; posture: string; test: string };
  /** Verified origin / insertion / function (SENIAM pages + standard anatomy). */
  origin?: { en: string; th: string };
  insertion?: { en: string; th: string };
  function?: { en: string; th: string };
}

export interface SeniamFile {
  project: string;
  notice: string;
  source: string;
  accessed: string;
  entries: SeniamEntry[];
}

export type SeniamSide = 'left' | 'right' | 'midline';

export interface SeniamAnchor {
  key: string;
  entry: SeniamEntry;
  side: SeniamSide;
  conceptId: string | null;
  conceptName: string | null;
  partIds: string[];
  /** Centroid in atlas local coords (pre-offset), computed from part bounds. */
  centroid: [number, number, number] | null;
  /** Outward surface offset added in the scene so the dot sits on skin, not inside muscle. */
  surface: [number, number, number];
}

const norm = (s: string) => s.toLowerCase().trim();

/** Anatomical side from an atlas concept name ("right X" / "X of right Y" style). */
export function sideFromConceptName(name: string): SeniamSide | null {
  const n = norm(name);
  const hasRight = /(^|\s)right(\s|$)/.test(n);
  const hasLeft = /(^|\s)left(\s|$)/.test(n);
  if (hasRight && !hasLeft) return 'right';
  if (hasLeft && !hasRight) return 'left';
  return null;
}

function findConcept(names: { id: string; name: string }[], want: string) {
  const k = norm(want);
  return names.find((c) => norm(c.name) === k) ?? null;
}

/** Collect part ids for a concept id from the atlas concept list. */
function elementsOf(atlas: Atlas, conceptId: string | null): string[] {
  if (!conceptId) return [];
  const c = atlas.concepts.find((x) => x.id === conceptId);
  return c ? [...c.elements] : [];
}

/**
 * Resolve an entry to left/right concept matches. Prefers side-specific
 * concepts ("left X" / "right X"); falls back to splitting a bilateral
 * generic concept by the sign of each part's centroid x.
 */
export function matchSeniamToAtlas(
  entry: SeniamEntry,
  atlas: Atlas,
): { left: { conceptId: string | null; conceptName: string | null }; right: { conceptId: string | null; conceptName: string | null }; generic: { conceptId: string | null; conceptName: string | null } } {
  const sorted = [...entry.matchNames].sort((a, b) => b.length - a.length);
  let left = { conceptId: null as string | null, conceptName: null as string | null };
  let right = { conceptId: null as string | null, conceptName: null as string | null };
  let generic = { conceptId: null as string | null, conceptName: null as string | null };
  for (const key of sorted) {
    const l = findConcept(atlas.concepts, `left ${key}`);
    const r = findConcept(atlas.concepts, `right ${key}`);
    const g = findConcept(atlas.concepts, key);
    if (l && !left.conceptId) left = { conceptId: l.id, conceptName: l.name };
    if (r && !right.conceptId) right = { conceptId: r.id, conceptName: r.name };
    if (g && !generic.conceptId) generic = { conceptId: g.id, conceptName: g.name };
    if (left.conceptId && right.conceptId) break;
  }
  // Substring fallback only when nothing exact matched.
  if (!left.conceptId && !right.conceptId && !generic.conceptId) {
    for (const key of sorted) {
      const k = norm(key);
      if (k.length < 6) continue;
      const hit = atlas.concepts.find((c) => norm(c.name).includes(k));
      if (hit) {
        generic = { conceptId: hit.id, conceptName: hit.name };
        break;
      }
    }
  }
  return { left, right, generic };
}

function centroidOf(partIds: string[], partById: Map<string, { bounds: [number[], number[]] }>): [number, number, number] | null {
  const acc = [0, 0, 0];
  let n = 0;
  for (const pid of partIds) {
    const p = partById.get(pid);
    if (!p) continue;
    acc[0] += (p.bounds[0][0] + p.bounds[1][0]) / 2;
    acc[1] += (p.bounds[0][1] + p.bounds[1][1]) / 2;
    acc[2] += (p.bounds[0][2] + p.bounds[1][2]) / 2;
    n++;
  }
  if (!n) return null;
  return [acc[0] / n, acc[1] / n, acc[2] / n];
}

const ANTERIOR = new Set([
  'tibialis-anterior', 'rectus-femoris', 'vastus-medialis', 'vastus-lateralis',
  'deltoideus-anterior', 'biceps-brachii', 'tensor-fasciae-latae',
  'sternocleidomastoid', 'pectoralis-major', 'brachioradialis',
  'flexor-carpi-radialis', 'flexor-carpi-ulnaris', 'extensor-carpi-radialis',
  'extensor-carpi-ulnaris', 'extensor-digitorum-hand', 'rectus-abdominis',
  'sartorius', 'extensor-digitorum-longus',
]);
const POSTERIOR = new Set([
  'soleus', 'gastrocnemius-medialis', 'gastrocnemius-lateralis', 'biceps-femoris',
  'semitendinosus', 'gluteus-maximus', 'trapezius-descendens', 'trapezius-transversalis',
  'trapezius-ascendens', 'erector-spinae-longissimus', 'erector-spinae-iliocostalis',
  'multifidus', 'triceps-brachii-long', 'triceps-brachii-lateral', 'deltoideus-posterior',
  'rhomboid-major', 'infraspinatus', 'supraspinatus', 'erector-spinae-thoracic', 'teres-major',
]);

/**
 * Push the marker from the muscle centroid out to the skin surface.
 * Radial component moves away from the body axis; anterior/posterior
 * entries get an extra forward/backward nudge so front/back muscles
 * do not sink inside the limb.
 */
export function emgSurfaceOffset(entry: SeniamEntry, centroid: [number, number, number] | null): [number, number, number] {
  if (!centroid) return [0, 0.015, 0.02];
  const [cx, , cz] = centroid;
  const radialLen = Math.hypot(cx, cz) || 1;
  const limb = Math.abs(cx) > 0.09 || centroid[1] < 0.55;
  const push = limb ? 0.022 : 0.034;
  let ox = (cx / radialLen) * push;
  let oz = (cz / radialLen) * push;
  if (ANTERIOR.has(entry.id)) oz += 0.016;
  if (POSTERIOR.has(entry.id)) oz -= 0.016;
  // Lateral shoulder/hip/lower-leg bellies sit wide: nudge further out sideways.
  if (entry.id === 'deltoideus-medius' || entry.id === 'gluteus-medius' || entry.id === 'peroneus-longus' || entry.id === 'peroneus-brevis') {
    ox += Math.sign(cx || 1) * 0.012;
  }
  return [ox, 0.008, oz];
}

export function buildSeniamAnchors(data: SeniamFile, atlas: Atlas): SeniamAnchor[] {
  const partById = new Map(atlas.parts.map((p) => [p.id, p as unknown as { bounds: [number[], number[]] }]));
  const out: SeniamAnchor[] = [];
  const pushAnchor = (entry: SeniamEntry, side: SeniamSide, conceptId: string | null, conceptName: string | null, partIds: string[]) => {
    const centroid = centroidOf(partIds, partById);
    out.push({
      key: `${entry.id}-${side}`,
      entry,
      side,
      conceptId,
      conceptName,
      partIds,
      centroid,
      surface: emgSurfaceOffset(entry, centroid),
    });
  };

  const conceptNameById = new Map(atlas.concepts.map((c) => [c.id, c.name] as const));
  const partByIdFull = new Map(atlas.parts.map((p) => [p.id, p] as const));
  // Anatomical side of one part: explicit side concepts first, then geometry
  // (verified on this dataset that -x = anatomical right).
  const sideOfPart = (pid: string): SeniamSide | null => {
    const part = partByIdFull.get(pid);
    const s = sideFromConceptName(conceptNameById.get(part?.conceptId ?? '') ?? '');
    if (s) return s;
    const p = partById.get(pid);
    if (!p) return null;
    const cx = (p.bounds[0][0] + p.bounds[1][0]) / 2;
    return cx < 0 ? 'right' : 'left';
  };

  for (const entry of data.entries) {
    const m = matchSeniamToAtlas(entry, atlas);
    const leftIds = new Set(elementsOf(atlas, m.left.conceptId));
    const rightIds = new Set(elementsOf(atlas, m.right.conceptId));
    const pool = new Set<string>([
      ...elementsOf(atlas, m.generic.conceptId),
      ...leftIds,
      ...rightIds,
    ]);
    // Sibling subdivisions/zones of the same muscle (exact concept names).
    for (const extra of entry.alsoInclude ?? []) {
      const hit = atlas.concepts.find((c) => norm(c.name) === norm(extra));
      if (hit) for (const pid of hit.elements) pool.add(pid);
    }
    if (!pool.size) {
      pushAnchor(entry, 'midline', m.generic.conceptId, m.generic.conceptName, []);
      continue;
    }
    const leftParts: string[] = [];
    const rightParts: string[] = [];
    for (const pid of pool) {
      if (leftIds.has(pid) && !rightIds.has(pid)) { leftParts.push(pid); continue; }
      if (rightIds.has(pid) && !leftIds.has(pid)) { rightParts.push(pid); continue; }
      const s = sideOfPart(pid);
      if (s === 'left') leftParts.push(pid);
      else rightParts.push(pid);
    }
    const primaryConcept = m.left.conceptId ?? m.generic.conceptId;
    if (leftParts.length) pushAnchor(entry, 'left', m.left.conceptId ?? primaryConcept, m.left.conceptName ?? m.generic.conceptName, leftParts);
    if (rightParts.length) pushAnchor(entry, 'right', m.right.conceptId ?? primaryConcept, m.right.conceptName ?? m.generic.conceptName, rightParts);
    if (!leftParts.length && !rightParts.length) {
      pushAnchor(entry, 'midline', m.generic.conceptId, m.generic.conceptName, []);
    }
  }
  return out;
}

export async function loadSeniam(signal?: AbortSignal): Promise<SeniamFile> {
  const r = await fetch('/data/seniam.json', { signal });
  if (!r.ok) throw new Error('The SENIAM reference could not be loaded.');
  return (await r.json()) as SeniamFile;
}
