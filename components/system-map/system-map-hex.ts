// The network as hexagons (system-map.ts): the core in the middle of a honeycomb, the shared
// packages on a ring around it, and what people use on an outer ring in its groups, every other
// cell of the comb left empty and faded. Each tie is a line between two cells, bent around the
// cells it would otherwise cross. Pure: the whole drawing is an SVG string a server delivers, so
// the lines are there with no script; the script only lights a cell's lines.

import { escapeHtml as e } from "../email/email.ts";
import type { MapSystem, SystemMapData } from "./system-map-data.ts";
import { tiePairs } from "./system-map-data.ts";

// A cell's radius (center to corner) in the drawing's own units. The drawing scales to its box;
// the text sizes below are set so that at the narrowest map that shows it (44rem) no text is
// under 12 px.
const R = 58;
const SQRT3 = Math.sqrt(3);
const NAME_SIZE = 18;
const LABEL_SIZE = 16;

type Axial = [number, number];
const DIRS: Axial[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/** The cells of ring k around the center, in order around it. */
export function ringCells(k: number): Axial[] {
  if (k === 0) return [[0, 0]];
  const out: Axial[] = [];
  let q = DIRS[4]![0] * k;
  let r = DIRS[4]![1] * k;
  for (const [dq, dr] of DIRS) {
    for (let i = 0; i < k; i++) {
      out.push([q, r]);
      q += dq;
      r += dr;
    }
  }
  return out;
}

const xy = ([q, r]: Axial): [number, number] => [R * SQRT3 * (q + r / 2), R * 1.5 * r];
const angleOf = (c: Axial) => {
  const [x, y] = xy(c);
  return Math.atan2(y, x);
};
// Angles measured clockwise from the top, 0 to 2π, so rings read from twelve o'clock.
const fromTop = (a: number) => (a + Math.PI / 2 + 4 * Math.PI) % (2 * Math.PI);
const byAngle = (cells: Axial[]) => [...cells].sort((a, b) => fromTop(angleOf(a)) - fromTop(angleOf(b)));
const wrap = (a: number, around: number) => {
  let x = a;
  while (x < around - Math.PI) x += 2 * Math.PI;
  while (x > around + Math.PI) x -= 2 * Math.PI;
  return x;
};

export interface HexCell {
  id: string;
  at: Axial;
  x: number;
  y: number;
}

export interface HexLayout {
  cells: HexCell[];
  // The empty cells of the comb, drawn faded.
  comb: Axial[];
  groups: { name: string; x: number; y: number }[];
  lines: { a: string; b: string; d: string }[];
  box: [number, number, number, number];
}

/**
 * Where each system stands in the honeycomb, and each tie's line. The core takes the middle (more
 * than one core: the first ring). The shared packages take every other cell of the smallest ring
 * with room for that, so lines pass between them. What people use takes the ring two out, each
 * group a run of cells with empty cells between groups, in the groups' order from twelve o'clock.
 * Then, by the barycenter idea on a circle, each shared package moves toward the systems that use
 * it and each system within its group toward the packages it uses, so lines run short.
 */
export function hexLayout(data: SystemMapData, groupOf: (s: MapSystem) => string): HexLayout {
  const core = data.systems.filter((s) => s.ring === "core");
  const shared = data.systems.filter((s) => s.ring === "shared");
  const used = data.systems.filter((s) => s.ring === "used");
  const groupNames = [...new Set(used.map(groupOf))];
  const groups = groupNames.map((g) => used.filter((s) => groupOf(s) === g));
  const pairs = tiePairs(data);
  const neighbors = new Map(data.systems.map((s) => [s.id, [] as string[]]));
  for (const [a, b] of pairs) {
    neighbors.get(a)?.push(b);
    neighbors.get(b)?.push(a);
  }

  const place = new Map<string, Axial>();
  core.forEach((s, i) => place.set(s.id, i === 0 ? [0, 0] : byAngle(ringCells(1))[(i - 1) % 6]!));
  let sk = 2;
  while (6 * sk < 2 * shared.length) sk++;
  const sharedRing = byAngle(ringCells(sk));
  const sharedStep = Math.max(1, Math.floor(sharedRing.length / Math.max(1, shared.length)));
  let ok = sk + 2;
  while (6 * ok < used.length + groups.length) ok++;
  const outerRing = byAngle(ringCells(ok));

  // The outer ring: each group a run, the spare cells spread between groups.
  const spare = outerRing.length - used.length;
  const placeOuter = () => {
    let i = 0;
    groups.forEach((g, gi) => {
      for (const s of g) place.set(s.id, outerRing[i++ % outerRing.length]!);
      i += Math.floor(spare / groups.length) + (gi < spare % groups.length ? 1 : 0);
    });
  };
  const placeShared = (order: MapSystem[], start: number) => order.forEach((s, i) => place.set(s.id, sharedRing[(start + i * sharedStep) % sharedRing.length]!));
  placeOuter();
  placeShared(shared, 0);

  const mean = (id: string, among: (o: string) => boolean, around: number) => {
    const others = (neighbors.get(id) ?? []).filter(among);
    if (!others.length) return around;
    let x = 0;
    let y = 0;
    for (const o of others) {
      const a = angleOf(place.get(o)!);
      x += Math.cos(a);
      y += Math.sin(a);
    }
    return wrap(Math.atan2(y, x), around);
  };
  const isUsed = new Set(used.map((s) => s.id));
  const isShared = new Set(shared.map((s) => s.id));
  for (let sweep = 0; sweep < 6; sweep++) {
    // Shared packages in the order of where their users stand; the ring turned to fit the first.
    const want = new Map(shared.map((s) => [s.id, fromTop(mean(s.id, (o) => isUsed.has(o), angleOf(place.get(s.id)!)))]));
    const order = [...shared].sort((a, b) => want.get(a.id)! - want.get(b.id)!);
    let start = 0;
    let best = Infinity;
    for (let k = 0; k < sharedRing.length; k++) {
      let cost = 0;
      order.forEach((s, i) => {
        const at = fromTop(angleOf(sharedRing[(k + i * sharedStep) % sharedRing.length]!));
        const d = Math.abs(at - want.get(s.id)!);
        cost += Math.min(d, 2 * Math.PI - d);
      });
      if (cost < best) {
        best = cost;
        start = k;
      }
    }
    placeShared(order, start);
    for (const g of groups) {
      const mid = g.reduce((k, s) => k + fromTop(angleOf(place.get(s.id)!)), 0) / g.length;
      const at = new Map(g.map((s) => [s.id, fromTop(mean(s.id, (o) => isShared.has(o) || core.some((c) => c.id === o), angleOf(place.get(s.id)!)))]));
      const key = (s: MapSystem) => wrap(at.get(s.id)!, mid);
      g.sort((a, b) => key(a) - key(b));
    }
    placeOuter();
  }

  const cells: HexCell[] = data.systems.flatMap((s) => {
    const at = place.get(s.id);
    if (!at) return [];
    const [x, y] = xy(at);
    return [{ id: s.id, at, x, y }];
  });
  const taken = new Set(cells.map((c) => `${c.at[0]},${c.at[1]}`));
  const comb: Axial[] = [];
  for (let k = 0; k <= ok + 1; k++) for (const c of ringCells(k)) if (!taken.has(`${c[0]},${c[1]}`)) comb.push(c);

  // Each line: the straight one if it crosses no other system's cell, else the gentlest bend
  // (a quadratic curve, its middle pushed sideways) that crosses fewest.
  const at = new Map(cells.map((c) => [c.id, c]));
  const clear = R * 0.92;
  const lines = pairs.flatMap(([a, b]) => {
    const p = at.get(a);
    const q = at.get(b);
    if (!p || !q) return [];
    const mx = (p.x + q.x) / 2;
    const my = (p.y + q.y) / 2;
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const nx = -(q.y - p.y) / len;
    const ny = (q.x - p.x) / len;
    let best = { hits: Infinity, off: 0 };
    for (const off of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.6, -2.6, 3.2, -3.2].map((k) => k * R)) {
      const cx = mx + nx * off * 2;
      const cy = my + ny * off * 2;
      let hits = 0;
      for (const c of cells) {
        if (c === p || c === q) continue;
        for (let i = 1; i < 24; i++) {
          const t = i / 24;
          const x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * cx + t * t * q.x;
          const y = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * cy + t * t * q.y;
          if (Math.hypot(x - c.x, y - c.y) < clear) {
            hits++;
            break;
          }
        }
      }
      if (hits < best.hits) best = { hits, off };
      if (hits === 0) break;
    }
    const f = (n: number) => Math.round(n * 10) / 10;
    const d = best.off === 0 ? `M${f(p.x)} ${f(p.y)} L${f(q.x)} ${f(q.y)}` : `M${f(p.x)} ${f(p.y)} Q${f(mx + nx * best.off * 2)} ${f(my + ny * best.off * 2)} ${f(q.x)} ${f(q.y)}`;
    return [{ a, b, d }];
  });

  // Each group's name just outside its run of cells.
  const outR = R * 1.5 * ok + R * 1.2;
  const labels = groups.map((g, i) => {
    const ang = Math.atan2(
      g.reduce((k, s) => k + Math.sin(angleOf(place.get(s.id)!)), 0),
      g.reduce((k, s) => k + Math.cos(angleOf(place.get(s.id)!)), 0),
    );
    return { name: groupNames[i]!, x: Math.cos(ang) * outR * 1.08, y: Math.sin(ang) * outR * 1.08 };
  });
  const extent = R * SQRT3 * (ok + 1.5) + R;
  return { cells, comb, groups: labels, lines, box: [-extent, -extent * 0.95, extent * 2, extent * 1.9] };
}

const hexPoints = (x: number, y: number, r = R * 0.94) =>
  Array.from({ length: 6 }, (_, i) => {
    const t = Math.PI / 6 + (i * Math.PI) / 3;
    return `${Math.round((x + r * Math.cos(t)) * 10) / 10},${Math.round((y + r * Math.sin(t)) * 10) / 10}`;
  }).join(" ");

/** A name in a cell: one line, or two split at a space when it is long. */
function nameText(name: string, x: number, y: number): string {
  const words = name.split(" ");
  if (name.length <= 9 || words.length < 2) return `<text class="cap-system-map-cell-name" x="${x}" y="${y}" dy="0.35em">${e(name)}</text>`;
  let best = 1;
  for (let i = 1; i < words.length; i++) if (Math.abs(words.slice(0, i).join(" ").length - name.length / 2) < Math.abs(words.slice(0, best).join(" ").length - name.length / 2)) best = i;
  return `<text class="cap-system-map-cell-name" x="${x}" y="${y}"><tspan x="${x}" dy="-0.2em">${e(words.slice(0, best).join(" "))}</tspan><tspan x="${x}" dy="1.15em">${e(words.slice(best).join(" "))}</tspan></text>`;
}

/**
 * The honeycomb as an SVG string. Each system is a link (its full name as the link's name, its
 * short name as the text) carrying `data-id`, `data-ring` and, when private, `data-private`; each
 * line carries `data-a` and `data-b`. The comb, the lines and the group names are hidden from
 * assistive technology: the cells' links and the plain map hold the same ties as words.
 */
export function hexSvg(data: SystemMapData, layout: HexLayout, labelId: string): string {
  const byId = new Map(data.systems.map((s) => [s.id, s]));
  const [bx, by, bw, bh] = layout.box.map((n) => Math.round(n));
  const comb = layout.comb.map((c) => `<polygon points="${hexPoints(...xy(c))}"/>`).join("");
  const lines = layout.lines.map((l) => `<path class="cap-system-map-wire" data-a="${e(l.a)}" data-b="${e(l.b)}" d="${l.d}"/>`).join("");
  const groups = layout.groups.map((g) => `<text class="cap-system-map-comb-group" x="${Math.round(g.x)}" y="${Math.round(g.y)}" dy="0.35em">${e(g.name)}</text>`).join("");
  const cells = layout.cells
    .map((c) => {
      const s = byId.get(c.id)!;
      const x = Math.round(c.x * 10) / 10;
      const y = Math.round(c.y * 10) / 10;
      const inner = `<polygon points="${hexPoints(c.x, c.y, s.ring === "core" ? R * 0.98 : R * 0.94)}"/>${nameText(s.short ?? s.name, x, y)}`;
      const attrs = `class="cap-system-map-cell" data-id="${e(s.id)}" data-ring="${s.ring}"${s.private ? " data-private" : ""}`;
      return s.href ? `<a ${attrs} href="${e(s.href)}" aria-label="${e(s.name)}">${inner}</a>` : `<g ${attrs} role="img" aria-label="${e(s.name)}">${inner}</g>`;
    })
    .join("");
  return `<svg class="cap-system-map-comb" viewBox="${bx} ${by} ${bw} ${bh}" role="group" aria-labelledby="${e(labelId)}" style="--cap-name-size: ${NAME_SIZE}px; --cap-label-size: ${LABEL_SIZE}px"><g class="cap-system-map-comb-cells" aria-hidden="true">${comb}</g><g class="cap-system-map-comb-lines" aria-hidden="true">${lines}</g><g aria-hidden="true">${groups}</g>${cells}</svg>`;
}
