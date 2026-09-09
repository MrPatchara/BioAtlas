import type { Atlas } from '../app/anatomy';

export type MarkerSide = 'left' | 'right' | 'midline';

export interface MarkerDef {
  id: string;
  label: string;
  side: MarkerSide;
  segment: string;
  landmarks: string[];
  placement: string;
  instruction: string;
  /** Atlas bone concept names to anchor to (exact, side handled separately). */
  bone: string[];
  /** Bounds-corner rule id (see RULES). */
  rule: string;
  /** Extra outward push from the bone surface in metres (skin offset). */
  outwardMm?: number;
  /** 0..1 fraction overrides used by wand rules. */
  frac?: number;
  sets: string[];
  sourceUrl: string;
  /** Position is an approximation (no exact bone in atlas). */
  approx?: boolean;
  /** Static-calibration only (removed for dynamic trials). */
  calibrationOnly?: boolean;
  /** Offline skin-snapped position (preferred when present). */
  snap?: [number, number, number];
  snapGapMm?: number;
  /** Thai translations of placement/instruction. */
  thPlacement?: string;
  thInstruction?: string;
}

export interface MarkerSetDef {
  id: string;
  name: string;
  description: string;
  descriptionTh?: string;
  markerIds: string[];
  citation: string;
  sourceUrl: string;
}

export interface MarkerFile {
  project: string;
  notice: string;
  source: string;
  accessed: string;
  markers: MarkerDef[];
  sets: MarkerSetDef[];
}

export interface MarkerAnchor {
  key: string;
  markerId: string;
  label: string;
  side: MarkerSide;
  segment: string;
  setIds: string[];
  partIds: string[];
  conceptName: string | null;
  pos: [number, number, number] | null;
}

const norm = (s: string) => s.toLowerCase().trim();

// Bounds are [min,max] per axis. Anatomical convention of this dataset:
// -x = right side of body, +x = left, +z = front, +y = up.
type B = { mn: number[]; mx: number[] };
const lat = (b: B, side: MarkerSide) => (side === 'right' ? b.mn[0] : b.mx[0]);
const med = (b: B, side: MarkerSide) => (side === 'right' ? b.mx[0] : b.mn[0]);
const midX = (b: B) => (b.mn[0] + b.mx[0]) / 2;
const H = (b: B, f: number) => b.mn[1] + (b.mx[1] - b.mn[1]) * f;

const RULES: Record<string, (b: B, side: MarkerSide, p: { frac: number; outward: number }) => [number, number, number]> = {
  // Pelvis / sacrum
  asis: (b, side) => [lat(b, side), H(b, 0.88), b.mx[2]],
  psis: (b, side) => {
    const mid = side === 'right' ? b.mx[0] : b.mn[0];
    const la = lat(b, side);
    return [mid + (la - mid) * 0.18, H(b, 0.92), b.mn[2]];
  },
  sacr: (b) => [midX(b), H(b, 0.8), b.mn[2] - 0.005],
  // Lower limb
  thighWand: (b, side, p) => [lat(b, side) + (side === 'right' ? -p.outward : p.outward), H(b, p.frac), (b.mn[2] + b.mx[2]) / 2],
  knee: (b, side) => [lat(b, side), H(b, 0.12), (b.mn[2] + b.mx[2]) / 2],
  shankWand: (b, side, p) => [lat(b, side) + (side === 'right' ? -p.outward : p.outward), H(b, p.frac), (b.mn[2] + b.mx[2]) / 2],
  ankle: (b, side) => [lat(b, side), b.mn[1] + 0.005, (b.mn[2] + b.mx[2]) / 2],
  heel: (b) => [midX(b), b.mn[1] + 0.025, b.mn[2] - 0.004],
  toe: (b) => [midX(b), b.mn[1] + 0.02, b.mx[2] + 0.004],
  // Spine / torso
  spineProc: (b) => [midX(b), (b.mn[1] + b.mx[1]) / 2, b.mn[2] - 0.004],
  sternumTop: (b) => [midX(b), b.mx[1], b.mx[2] + 0.004],
  sternumBottom: (b) => [midX(b), b.mn[1], b.mx[2] + 0.004],
  scapulaMid: (b) => [midX(b), (b.mn[1] + b.mx[1]) / 2, b.mn[2] - 0.008],
  // Upper limb
  acromion: (b, side) => [lat(b, side), b.mx[1], (b.mn[2] + b.mx[2]) / 2],
  armWand: (b, side, p) => [lat(b, side) + (side === 'right' ? -p.outward : p.outward), H(b, p.frac), (b.mn[2] + b.mx[2]) / 2],
  elbow: (b, side) => [lat(b, side), b.mn[1] + 0.005, (b.mn[2] + b.mx[2]) / 2],
  forearmWand: (b, side, p) => [lat(b, side) + (side === 'right' ? -p.outward : p.outward), H(b, p.frac), b.mn[2] - 0.004],
  wristA: (b, side) => [side === 'left' ? b.mx[0] : b.mn[0], b.mn[1], b.mn[2] - 0.004],
  wristB: (b, side) => [side === 'left' ? b.mn[0] : b.mx[0], b.mn[1], b.mn[2] - 0.004],
  finger: (b) => [midX(b), (b.mn[1] + b.mx[1]) / 2, b.mx[2] + 0.012],
  // Head
  headFront: (b, side) => {
    const cx = midX(b);
    const w = b.mx[0] - b.mn[0];
    return [cx + (side === 'left' ? w * 0.22 : -w * 0.22), H(b, 0.72), b.mx[2] + 0.002];
  },
  headBack: (b, side) => {
    const cx = midX(b);
    const w = b.mx[0] - b.mn[0];
    return [cx + (side === 'left' ? w * 0.22 : -w * 0.22), H(b, 0.62), b.mn[2] - 0.002];
  },
  // BTS Davis additions
  trochanter: (b, side) => [lat(b, side), H(b, 0.92), (b.mn[2] + b.mx[2]) / 2],
  fibularHead: (b, side) => [lat(b, side), H(b, 0.95), (b.mn[2] + b.mx[2]) / 2],
  // Rizzoli foot additions (thirds across the bone width)
  ankleMedial: (b, side) => [med(b, side), b.mn[1] + 0.005, (b.mn[2] + b.mx[2]) / 2],
  heelGround: (b) => [midX(b), b.mn[1], b.mn[2] + (b.mx[2] - b.mn[2]) * 0.3],
  calcPost: (b) => [midX(b), H(b, 0.7), b.mn[2] - 0.002],
  sustentaculum: (b, side) => [med(b, side), H(b, 0.3), (b.mn[2] + b.mx[2]) / 2],
  peronealTub: (b, side) => [lat(b, side), H(b, 0.4), (b.mn[2] + b.mx[2]) / 2],
  navicular: (b, side) => [med(b, side), (b.mn[1] + b.mx[1]) / 2, (b.mn[2] + b.mx[2]) / 2],
  metBase1: (b, side) => [med(b, side), b.mx[1], b.mn[2]],
  metBase2: (b) => [midX(b), b.mx[1], b.mn[2]],
  metBase5: (b, side) => [lat(b, side), b.mx[1], b.mn[2]],
  metHead1: (b, side) => [med(b, side), b.mx[1], b.mx[2]],
  metHead2: (b) => [midX(b), b.mx[1], b.mx[2]],
  metHead5: (b, side) => [lat(b, side), b.mx[1], b.mx[2]],
  hallux: (b, side) => [med(b, side), (b.mn[1] + b.mx[1]) / 2, b.mx[2] + 0.02],
  tibialTub: (b) => [midX(b), H(b, 0.9), b.mx[2] + 0.002],
  // Rab upper-extremity additions
  ear: (b, side) => {
    const w = b.mx[0] - b.mn[0];
    const x = side === 'left' ? b.mx[0] - w * 0.15 : b.mn[0] + w * 0.15;
    return [x, (b.mn[1] + b.mx[1]) / 2, (b.mn[2] + b.mx[2]) / 2];
  },
  headTop: (b) => [midX(b), b.mx[1], (b.mn[2] + b.mx[2]) / 2],
  olecranon: (b) => [midX(b), b.mn[1] + 0.005, b.mn[2] - 0.002],
  radialStyloid: (b, side) => [lat(b, side), b.mn[1], (b.mn[2] + b.mx[2]) / 2],
  ulnarStyloid: (b, side) => [med(b, side), b.mn[1], (b.mn[2] + b.mx[2]) / 2],
  mcpDorsal: (b) => [midX(b), b.mx[1], b.mx[2] + 0.004],
};

function resolveBone(names: string[], side: MarkerSide, atlas: Atlas): { conceptName: string | null; partIds: string[] } {
  const sorted = [...names].sort((a, b) => b.length - a.length);
  const byName = new Map(atlas.concepts.map((c) => [norm(c.name), c] as const));
  if (side !== 'midline') {
    const wanted = side === 'right' ? 'right' : 'left';
    for (const key of sorted) {
      const hit = byName.get(norm(`${wanted} ${key}`));
      if (hit) return { conceptName: hit.name, partIds: [...hit.elements] };
    }
  }
  for (const key of sorted) {
    const hit = byName.get(norm(key));
    if (!hit) continue;
    if (side === 'midline') return { conceptName: hit.name, partIds: [...hit.elements] };
    // Single mesh spanning the midline (e.g. frontal bone): use whole, rules
    // offset by side from its full bounds.
    if (hit.elements.length <= 1) return { conceptName: hit.name, partIds: [...hit.elements] };
    // Bilateral concept: split parts by geometry (-x = right).
    const partById = new Map(atlas.parts.map((p) => [p.id, p] as const));
    const mine: string[] = [];
    for (const pid of hit.elements) {
      const p = partById.get(pid);
      if (!p) continue;
      const cx = (p.bounds[0][0] + p.bounds[1][0]) / 2;
      const isRight = cx < 0;
      if ((side === 'right') === isRight) mine.push(pid);
    }
    if (mine.length) return { conceptName: hit.name, partIds: mine };
  }
  return { conceptName: null, partIds: [] };
}

export function buildMarkerAnchors(data: MarkerFile, atlas: Atlas): MarkerAnchor[] {
  const partById = new Map(atlas.parts.map((p) => [p.id, p] as const));
  return data.markers.map((m) => {
    const r = resolveBone(m.bone, m.side, atlas);
    // Prefer the offline skin-snapped position; fall back to rule computation.
    if (m.snap && m.snap.every((v) => isFinite(v))) {
      return {
        key: m.id,
        markerId: m.id,
        label: m.label,
        side: m.side,
        segment: m.segment,
        setIds: [...m.sets],
        partIds: r.partIds,
        conceptName: r.conceptName,
        pos: [...m.snap] as [number, number, number],
      };
    }
    let pos: [number, number, number] | null = null;
    if (r.partIds.length) {
      const mn = [Infinity, Infinity, Infinity];
      const mx = [-Infinity, -Infinity, -Infinity];
      for (const pid of r.partIds) {
        const p = partById.get(pid);
        if (!p) continue;
        for (let i = 0; i < 3; i++) {
          mn[i] = Math.min(mn[i], p.bounds[0][i]);
          mx[i] = Math.max(mx[i], p.bounds[1][i]);
        }
      }
      if (isFinite(mn[0])) {
        const fn = RULES[m.rule];
        if (fn) pos = fn({ mn, mx }, m.side, { frac: m.frac ?? 0.5, outward: (m.outwardMm ?? 30) / 1000 });
      }
    }
    return {
      key: m.id,
      markerId: m.id,
      label: m.label,
      side: m.side,
      segment: m.segment,
      setIds: [...m.sets],
      partIds: r.partIds,
      conceptName: r.conceptName,
      pos,
    };
  });
}

export async function loadMarkerSets(signal?: AbortSignal): Promise<MarkerFile> {
  const r = await fetch('/data/markersets.json', { signal });
  if (!r.ok) throw new Error('The marker-set catalogue could not be loaded.');
  return (await r.json()) as MarkerFile;
}
