// Inside any system: one circle per system, drawn at build time, so one tap on any capsomer zooms
// into its wiring (Dustin, 2026-10-18: "I thought it was a single page that you would click on
// something and it would show the wiring of it", and "it's not intuitive to click twice").
// `circleLayers` draws every circle as an inside layer in the map's classes; `systemMapHtml` takes
// them as `circles`, and the controller shows the chosen one (system-map.ts). It runs at build
// time: the search takes minutes over a large family, and a page should not.
//
// What a circle holds:
//   - the system's own parts inside it;
//   - around the rim, what it works with outside (its `external` parts) and every other system it
//     connects to;
//   - one wire for each pair a relationship joins, from the exact part that uses it. A line
//     between two systems as wholes (Capsid coordinates Foxing) runs from the circle's edge, and
//     is left out when a part of this system already wires to that system.
// A private system is drawn like any other: its parts inside, its links around the rim.
//
// The places are searched for, from fixed starts, so the same data always draws the same way:
// each part over a grid inside the circle, the rim's order around it, until no wire crosses
// another or runs under a box it does not end at, and then the shortest wires. The drawing is the
// shell's width, so a unit is the same size as on the map, and as tall as it needs.

import { EXTERNAL, LOOSE_KINDS, type MapSystem, STORE_KINDS, type SystemMapData, layoutMap } from "./system-map-data.ts";
import { escapeHtml as esc } from "./system-map-html.ts";
import { type Rect, hitsRect, playableFlows } from "./system-map-inside.ts";
import {
  ANNEAL_STEPS,
  BOX_PAD_X,
  CIRCLE,
  type CircleNode,
  type CircleWire,
  CROSSING,
  GRID,
  KIND_SIZE,
  LABEL_FOOT,
  LABEL_SIZE,
  LINE_H,
  MARGIN,
  MIN_BOX_W,
  NAME_SIZE,
  OVERLAP,
  RIM_H,
  RIM_PAD_X,
  RIM_SIZE,
  SEARCH_CODE,
  SEEDS,
  type WireShape,
  bendWires,
  coster,
  f1,
  firstOrder,
  firstPlaces,
  placeRim,
  radiusFor,
  random,
  rectOf,
  segmentsCross,
  slotsFor,
  textWidth,
  wrapName,
} from "./system-map-circles-search.ts";

export type { CircleNode, CircleWire, WireShape } from "./system-map-circles-search.ts";

/**
 * One circle laid out: its radius, the name at its foot, every box placed, every wire with its
 * shape, the drawing's top, foot and width, and what the search scored it.
 */
export interface CircleLayout {
  name: string;
  r: number;
  label: Rect | null;
  nodes: CircleNode[];
  wires: Array<CircleWire & WireShape>;
  top: number;
  bottom: number;
  width: number;
  faults: number;
  cost: number;
}

/** A circle already searched for, under the key of what drew it. */
export interface SavedCircle {
  key: string;
  layout: CircleLayout;
}

export interface CircleScene {
  system: MapSystem;
  nodes: CircleNode[];
  wires: CircleWire[];
}

function partNode(c: { id: string; name: string; kind: string }): CircleNode {
  const lines = wrapName(c.name);
  const w = Math.ceil(Math.max(MIN_BOX_W, ...lines.map((l) => textWidth(l, NAME_SIZE)), textWidth(c.kind, KIND_SIZE)) + 2 * BOX_PAD_X);
  return { id: c.id, role: "part", name: c.name, lines, sub: c.kind, w, h: 12 + lines.length * LINE_H + 11, store: STORE_KINDS.has(c.kind), x: 0, y: 0 };
}

function rimNode(id: string, name: string, role: "outside" | "system", priv = false): CircleNode {
  return { id, role, name, lines: [name], sub: "", w: Math.ceil(textWidth(name, RIM_SIZE) + 2 * RIM_PAD_X), h: RIM_H, private: priv, x: 0, y: 0 };
}

/** What one system's circle draws: its parts, what is around its rim, and its wires, before anything is placed. */
export function sceneOf(data: SystemMapData, id: string): CircleScene {
  const system = data.systems.find((s) => s.id === id);
  if (!system) throw new Error(`no system ${id}`);
  const containers = data.containers ?? [];
  const systems = new Map(data.systems.map((s) => [s.id, s]));
  const owner = new Map(containers.map((c) => [c.id, c.system]));
  const own = containers.filter((c) => c.system === id);
  const nodes: CircleNode[] = [...own.filter((c) => c.kind !== EXTERNAL).map(partNode), ...own.filter((c) => c.kind === EXTERNAL).map((c) => rimNode(c.id, c.name, "outside"))];
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  /** Another system, on the rim, added when a line first reaches it. */
  const systemAt = (other: string) => {
    const key = `system:${other}`;
    let i = index.get(key);
    if (i === undefined) {
      const s = systems.get(other);
      i = nodes.push(rimNode(key, s?.name ?? other, "system", s?.private)) - 1;
      index.set(key, i);
    }
    return i;
  };
  /** Where a relationship's end sits in this drawing: one of its own boxes, the circle, or another system. */
  const at = (end: string): number | null => {
    if (index.has(end) && !end.startsWith("system:")) return index.get(end)!;
    if (end === id) return CIRCLE;
    const other = owner.get(end) ?? end;
    return other === id ? null : systemAt(other);
  };
  const wires = new Map<string, CircleWire>();
  const stubs: CircleWire[] = [];
  // Only what touches this system: one of its parts, or the system itself.
  const touches = (e: string) => e === id || owner.get(e) === id;
  for (const r of data.relationships ?? []) {
    if (!touches(r.from) && !touches(r.to)) continue;
    const a = at(r.from);
    const b = at(r.to);
    if (a === null || b === null || a === b) continue;
    const loose = LOOSE_KINDS.has(r.kind);
    if (a === CIRCLE || b === CIRCLE) {
      const other = a === CIRCLE ? b : a;
      if (nodes[other]!.role !== "system") continue;
      const prior = stubs.find((s) => s.b === other);
      if (prior) prior.loose &&= loose;
      else stubs.push({ a: CIRCLE, b: other, from: id, to: nodes[other]!.id, loose });
      continue;
    }
    const key = a < b ? `${a} ${b}` : `${b} ${a}`;
    const prior = wires.get(key);
    if (prior) prior.loose &&= loose;
    else wires.set(key, { a, b, from: nodes[a]!.id, to: nodes[b]!.id, loose });
  }
  // A part's own wire to a system says more than the circle's: the circle's is drawn only where there is none.
  const wired = new Set([...wires.values()].flatMap((w) => [w.a, w.b]));
  // A system that some line reached only as a whole and lost it keeps its place: it is still connected.
  return { system, nodes, wires: [...wires.values(), ...stubs.filter((s) => !wired.has(s.b))] };
}

/** FNV-1a, 64 bits, in base 36: a key that is the same in every runtime, with no crypto module. */
function hash(s: string): string {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(36).padStart(13, "0");
}

/**
 * What one circle is drawn from, as a key: its name, boxes and wires, the width it is drawn at,
 * and the search's own code and numbers. A saved circle with the same key is the circle the search
 * would draw.
 */
export function layoutKey(scene: CircleScene, minWidth: number): string {
  return hash(`${JSON.stringify({ name: scene.system.name, nodes: scene.nodes, wires: scene.wires, minWidth })}\0${LAYOUT_CODE}`);
}

/**
 * Lays out one circle, at least `minWidth` wide: the shell's.
 *
 * At each size the search runs from up to SEEDS fixed seeds while a fault is left, and the drawing
 * kept is the one with the fewest faults once its wires are curved (a wire under a box counting ten
 * crossings), the smallest of those tied. A circle with any fault left is drawn larger, a twentieth
 * at a time up to half again: room lets a wire bow round the others, which is the only way past two
 * parts that share three boxes (Carrel's Worker and its fifteen-minute check each wire to the site,
 * Google and Email; straight, one pair must cross). A circle with no fault stops at the first size,
 * so only a circle that needs the room pays for it in width.
 */
export function layoutScene(scene: CircleScene, minWidth: number): CircleLayout {
  let best: { l: CircleLayout; score: number } | null = null;
  let width = 0;
  const scoreOf = (l: CircleLayout) => (l.cost >= OVERLAP ? 1e6 : 0) + faultsOf(l).reduce((n, f) => n + (f.includes(" crosses ") ? 1 : 10), 0);
  for (let grown = 1; grown <= 1.5; grown *= 1.05) {
    for (let seed = 0; seed < SEEDS; seed++) {
      const l = layoutAt(scene, minWidth, grown, seed);
      width ||= l.width;
      if (l.width > width && l.cost >= OVERLAP / 2) continue;
      const score = scoreOf(l);
      if (!best || score < best.score) best = { l, score };
      if (score === 0) return l;
    }
  }
  return best!.l;
}

interface Best {
  cost: number;
  at: number[][];
  seq: number[];
  top: number;
}

/** One circle at one size. */
function layoutAt(scene: CircleScene, minWidth: number, grown: number, seed: number): CircleLayout {
  const nodes = scene.nodes.map((n) => ({ ...n }));
  const node = (i: number) => nodes[i]!;
  const wires = scene.wires;
  const parts = nodes.map((n, i) => (n.role === "part" ? i : -1)).filter((i) => i >= 0);
  const rim = nodes.map((n, i) => (n.role !== "part" ? i : -1)).filter((i) => i >= 0);
  const r = f1(radiusFor(parts.map(node)) * grown);
  const width = Math.max(minWidth, Math.ceil(2 * (r + MARGIN)));
  const halfW = width / 2;
  const name = scene.system.name;
  // With parts inside, the name sits at the circle's foot, as the core's does; with none, in the middle.
  const labelW = Math.ceil(textWidth(name.toUpperCase(), LABEL_SIZE) * 1.1 + 6);
  const label = parts.length ? { x: -labelW / 2, y: r - LABEL_FOOT - 10, w: labelW, h: 13 } : null;
  const slots = parts.map((i) => slotsFor(node(i), r, label));
  // A part most of the wires run to (a Worker that every store and service hangs off) is the hub:
  // it stays near the middle, so its wires run out like spokes rather than across the circle.
  const degree = parts.map((i) => wires.filter((w) => w.a === i || w.b === i).length);
  const hub = degree.indexOf(Math.max(0, ...degree));
  if (hub >= 0 && degree[hub]! >= 5 && degree[hub]! >= 0.4 * wires.length) {
    const near = slots[hub]!.filter(([x, y]) => Math.hypot(x, y) <= 0.3 * r);
    if (near.length) slots[hub] = near;
  }
  const rand = random(nodes.length * 7919 + wires.length * 104729 + seed);

  const cost = coster(nodes, wires, r, label);
  const order = firstOrder(nodes, wires, rim);
  let seq = [...order];
  let top = Math.ceil(rim.length / 2);
  let current = 0;
  /** Each part over every place it may take, then the rim's order, until nothing improves. */
  const descend = (rounds: number, withRim: boolean) => {
    placeRim(nodes, seq, top, r, halfW);
    cost.refreshAll();
    current = cost.total();
    for (let round = 0; round < rounds; round++) {
      let improved = false;
      for (const [pi, i] of parts.entries()) {
        const n = node(i);
        const keep: [number, number] = [n.x, n.y];
        let pick = keep;
        const before = cost.partial(i);
        let bestDelta = -1e-6;
        // Every other place first, then every place near the best of those and near where it is.
        const around = (p: readonly number[], c: readonly number[]) => Math.abs(p[0]! - c[0]!) <= 2 * GRID && Math.abs(p[1]! - c[1]!) <= 2 * GRID;
        for (const pass of [0, 1]) {
          const centre = pick;
          for (const p of slots[pi]!) {
            const coarse = (p[0] / GRID) % 2 === 0 && (p[1] / GRID) % 2 === 0;
            if (pass === 0 ? !coarse : coarse || (!around(p, centre) && !around(p, keep))) continue;
            n.x = p[0];
            n.y = p[1];
            cost.refresh(i);
            const delta = cost.partial(i) - before;
            if (delta < bestDelta) {
              bestDelta = delta;
              pick = p;
            }
          }
        }
        n.x = pick[0];
        n.y = pick[1];
        cost.refresh(i);
        if (pick !== keep) {
          current += bestDelta;
          improved = true;
        }
      }
      if (withRim) {
        // Then the rim: any two swapped, or one more or fewer above the circle.
        const tryRim = (next: number[], nextTop: number) => {
          placeRim(nodes, next, nextTop, r, halfW);
          cost.refreshAll();
          const c = cost.total();
          if (c < current - 1e-6) {
            current = c;
            seq = next;
            top = nextTop;
            improved = true;
          }
        };
        // The order the parts ask for: each round the circle toward what it wires to (barycentric), its count above.
        const want = seq.map((i) => {
          let tx = 0;
          let ty = 0;
          for (const w of wires) {
            const o = w.a === i ? w.b : w.b === i ? w.a : null;
            if (o === null || o === CIRCLE) continue;
            tx += node(o).x - node(i).x * 0.25;
            ty += node(o).y - node(i).y * 0.25;
          }
          return { i, ang: tx || ty ? Math.atan2(ty, tx) : Math.atan2(node(i).y, node(i).x) };
        });
        want.sort((p, q) => p.ang - q.ang);
        tryRim(
          want.map((w) => w.i),
          Math.max(1, Math.min(seq.length - 1, want.filter((w) => w.ang < 0).length)),
        );
        for (let a = 0; a < seq.length; a++) {
          for (let b = a + 1; b < seq.length; b++) {
            const next = [...seq];
            [next[a], next[b]] = [next[b]!, next[a]!];
            tryRim(next, top);
          }
        }
        for (const t of [top - 1, top + 1]) if (t >= 0 && t <= seq.length) tryRim([...seq], t);
        placeRim(nodes, seq, top, r, halfW);
        cost.refreshAll();
        current = cost.total();
      }
      if (!improved) break;
    }
  };
  let best: Best | null = null;
  const keepBest = () => {
    if (!best || current < best.cost - 1e-6) best = { cost: current, at: nodes.map((n) => [n.x, n.y]), seq: [...seq], top };
  };
  const restore = (b: Best) => {
    nodes.forEach((n, i) => {
      n.x = b.at[i]![0]!;
      n.y = b.at[i]![1]!;
    });
  };
  /**
   * Annealing from where the search stands: a part moved, near or anywhere, or one of the rim
   * moved to another place in its order, each kept when it costs less, or sometimes when it costs
   * a little more while the temperature is high, so the search climbs out of a drawing no single
   * move improves (simulated annealing, from a fixed seed). The best drawing seen is kept.
   */
  const slotAt = slots.map((list) => new Map(list.map((p) => [`${p[0]} ${p[1]}`, p])));
  const anneal = () => {
    for (let step = 0; step < ANNEAL_STEPS; step++) {
      const temp = 3e4 * Math.pow(1e-4, step / ANNEAL_STEPS);
      if (seq.length > 1 && rand() < 0.12) {
        const from = Math.floor(rand() * seq.length);
        const to = Math.floor(rand() * seq.length);
        if (from === to) continue;
        const next = [...seq];
        if (rand() < 0.5) [next[from], next[to]] = [next[to]!, next[from]!];
        else next.splice(to, 0, ...next.splice(from, 1));
        const nextTop = rand() < 0.2 ? Math.max(0, Math.min(seq.length, top + (rand() < 0.5 ? -1 : 1))) : top;
        placeRim(nodes, next, nextTop, r, halfW);
        cost.refreshAll();
        const c2 = cost.total();
        if (c2 < current || rand() < Math.exp((current - c2) / temp)) {
          current = c2;
          seq = next;
          top = nextTop;
        } else {
          placeRim(nodes, seq, top, r, halfW);
          cost.refreshAll();
        }
      } else {
        const pi = Math.floor(rand() * parts.length);
        const i = parts[pi]!;
        const n = node(i);
        const list = slots[pi]!;
        const keep = [n.x, n.y] as const;
        const before = cost.partial(i);
        let p: [number, number] | undefined;
        if (rand() < 0.5) p = list[Math.floor(rand() * list.length)];
        else {
          p = slotAt[pi]!.get(`${keep[0] + GRID * (Math.floor(rand() * 7) - 3)} ${keep[1] + GRID * (Math.floor(rand() * 7) - 3)}`);
        }
        if (!p) continue;
        n.x = p[0];
        n.y = p[1];
        cost.refresh(i);
        const delta = cost.partial(i) - before;
        if (delta < 0 || rand() < Math.exp(-delta / temp)) current += delta;
        else {
          n.x = keep[0];
          n.y = keep[1];
          cost.refresh(i);
        }
      }
      keepBest();
    }
  };
  // From each start: the rim's first order turned round by a quarter at a time, the parts placed
  // toward it, settled; annealed while a fault is left; settled again.
  const turns = rim.length > 1 ? [0, 0.25, 0.5, 0.75].map((f) => Math.round(f * rim.length)).filter((t, i, a) => a.indexOf(t) === i) : [0];
  for (const turn of turns) {
    seq = [...order.slice(turn), ...order.slice(0, turn)];
    top = Math.ceil(rim.length / 2);
    placeRim(nodes, seq, top, r, halfW);
    firstPlaces(nodes, wires, parts, slots, r, rand);
    descend(8, true);
    keepBest();
    if (current < CROSSING) break;
    if (!parts.length) continue;
    anneal();
    const c = best as unknown as Best;
    restore(c);
    seq = [...c.seq];
    top = c.top;
    descend(8, true);
    keepBest();
    if ((best as unknown as Best).cost < CROSSING) break;
  }
  const done = best as unknown as Best;
  placeRim(nodes, done.seq, done.top, r, halfW);
  restore(done);
  cost.refreshAll();
  const routes = bendWires(nodes, wires, r, label);
  // The drawing: the shell's width, and as tall as the rim reaches.
  let above = -r - MARGIN;
  let below = r + MARGIN;
  for (const n of nodes) {
    above = Math.min(above, n.y - n.h / 2 - MARGIN);
    below = Math.max(below, n.y + n.h / 2 + MARGIN);
  }
  const faults = Math.floor(done.cost / CROSSING);
  return { name, r, label, nodes, wires: wires.map((w, k) => ({ ...w, ...routes[k]! })), top: f1(above), bottom: f1(below), width, faults, cost: done.cost };
}

/** What drew a circle, for its key: the search's own code and this file's. */
const LAYOUT_CODE = [SEARCH_CODE, partNode, rimNode, sceneOf, layoutScene, layoutAt].map(String).join("\0");

// ---------------------------------------------------------------------------------------
// The markup.

/** Text inside the circle of a system with no parts drawn: its summary, wrapped to the circle. */
function wrapText(text: string, r: number): string[] {
  const max = 1.5 * r;
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${w}` : w;
    if (line && textWidth(next, RIM_SIZE) > max) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
}

/**
 * One system's inside layer, in the map's classes, so its stylesheet draws it and, for the core,
 * the controller plays the flows over it: each part a `.cap-system-map-box`, what is outside it the
 * same with data-external, each wire a `.cap-system-map-wire` carrying the ids of its two ends and
 * its route. Another system on the rim is a `.cap-system-map-rim` carrying data-goto, a tap that
 * zooms there.
 */
function layerSvg(l: CircleLayout, o: { id: string; summary: string; token: boolean; viewBox: number[] }): string {
  const [vx, vy, vw, vh] = o.viewBox;
  const wires = l.wires
    .map((w) => {
      const route = w.pts.map(([x, y]) => `${x},${y}`).join(" ");
      return `<path class="cap-system-map-wire" data-from="${esc(w.from)}" data-to="${esc(w.to)}"${w.loose ? " data-loose" : ""}${w.a === CIRCLE ? " data-whole" : ""} data-route="${route}" d="${w.d}"/>`;
    })
    .join("");
  const boxes = l.nodes
    .map((n) => {
      const x = f1(n.x - n.w / 2);
      const y = f1(n.y - n.h / 2);
      if (n.role === "system") {
        const sys = n.id.slice("system:".length);
        return `<g class="cap-system-map-rim" data-goto="${esc(sys)}"${n.private ? " data-private" : ""}><rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.h / 2}"/><text class="cap-system-map-rim-name" x="${n.x}" y="${f1(n.y + 4)}">${esc(n.name)}</text></g>`;
      }
      if (n.role === "outside") {
        return `<g class="cap-system-map-box" data-id="${esc(n.id)}" data-x="${n.x}" data-y="${n.y}" data-external><rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="4"/><text class="cap-system-map-box-name" x="${n.x}" y="${f1(n.y + 4)}">${esc(n.name)}</text></g>`;
      }
      const names = n.lines.map((line, i) => `<text class="cap-system-map-box-name" x="${n.x}" y="${f1(y + 16 + i * LINE_H)}">${esc(line)}</text>`).join("");
      return `<g class="cap-system-map-box" data-id="${esc(n.id)}" data-x="${n.x}" data-y="${n.y}"${n.store ? " data-store" : ""}><rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.store ? 12 : 5}"/>${names}<text class="cap-system-map-box-kind" x="${n.x}" y="${f1(y + n.h - 8)}">${esc(n.sub)}</text></g>`;
    })
    .join("");
  let middle: string;
  if (l.nodes.some((n) => n.role === "part")) middle = `<text class="cap-system-map-inside-title" x="0" y="${f1(l.r - LABEL_FOOT)}">${esc(l.name)}</text>`;
  else {
    const lines = wrapText(o.summary, l.r);
    const top = -((lines.length - 1) * 14) / 2 + 8;
    middle = `<text class="cap-system-map-inside-name" x="0" y="${f1(top - 16)}">${esc(l.name)}</text>${lines.map((t, i) => `<text class="cap-system-map-inside-text" x="0" y="${f1(top + 4 + i * 14)}">${esc(t)}</text>`).join("")}`;
  }
  const token = o.token ? `<circle class="cap-system-map-token" r="6" cx="0" cy="0"/>` : "";
  return `<svg class="cap-system-map-layer" data-layer="inside" data-system="${esc(o.id)}" viewBox="${vx} ${vy} ${vw} ${vh}" aria-hidden="true" focusable="false"><circle class="cap-system-map-boundary" cx="0" cy="0" r="${l.r}"/>${middle}${wires}${boxes}${token}</svg>`;
}

/**
 * What a laid-out circle gets wrong, in words: boxes too close, a wire under a box it does not end
 * at or under the name, and two wires crossing.
 */
export function faultsOf(l: CircleLayout): string[] {
  const out: string[] = [];
  const { nodes, wires } = l;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + 2) out.push(`${a.id} touches ${b.id}`);
    }
  }
  const name = (w: CircleWire) => `${w.from}-${w.to}`;
  const segsOf = (w: { pts: number[][] }) => w.pts.slice(1).map((q, i) => [...w.pts[i]!, ...q] as [number, number, number, number]);
  for (const [k, w] of wires.entries()) {
    const mine = segsOf(w);
    for (const [m, n] of nodes.entries()) {
      if (m !== w.a && m !== w.b && mine.some(([px, py, qx, qy]) => hitsRect(px, py, qx, qy, rectOf(n)))) out.push(`${name(w)} runs under ${n.id}`);
    }
    if (l.label && mine.some(([px, py, qx, qy]) => hitsRect(px, py, qx, qy, l.label!))) out.push(`${name(w)} runs under the name`);
    for (const v of wires.slice(k + 1)) {
      const shared = w.a === v.a || w.a === v.b || w.b === v.a || w.b === v.b;
      if (!shared && mine.some((s) => segsOf(v).some((t) => segmentsCross(s, t)))) out.push(`${name(w)} crosses ${name(v)}`);
    }
  }
  return out;
}

export interface CircleOptions {
  /** What a circle with no parts says in its middle: the system's description by default. */
  summary?: (s: MapSystem) => string;
  /**
   * Circles already searched for, by system id with their key. One whose key still matches is
   * used as it is; the rest are searched for and put in it, so the caller can keep them (a file
   * beside the build). A system the data no longer has is dropped from it.
   */
  saved?: Record<string, SavedCircle>;
}

/**
 * Every system's inside layer, as markup, by id, for `systemMapHtml`'s `circles`: laid out at the
 * shell's width, each at least the shell's height for that width, so zooming into a small system
 * leaves the stage its size. The core's carries the token when it has flows to play.
 */
export function circleLayers(data: SystemMapData, options: CircleOptions = {}): Record<string, string> {
  const { summary = (s: MapSystem) => s.description ?? "", saved = {} } = options;
  const [, , shellW, shellH] = layoutMap(data.systems).viewBox;
  const core = data.systems.find((s) => s.ring === "core");
  const flows = playableFlows(data, core).length > 0;
  const out: Record<string, string> = {};
  for (const id of Object.keys(saved)) if (!data.systems.some((s) => s.id === id)) delete saved[id];
  for (const s of data.systems) {
    const scene = sceneOf(data, s.id);
    const key = layoutKey(scene, shellW);
    if (saved[s.id]?.key !== key) saved[s.id] = { key, layout: layoutScene(scene, shellW) };
    const l = saved[s.id]!.layout;
    // Never shorter, for its width, than the shell, so the stage does not shrink when a small system is chosen.
    const minH = (l.width * shellH) / shellW;
    const pad = Math.max(0, minH - (l.bottom - l.top)) / 2;
    const viewBox = [f1(-l.width / 2), f1(l.top - pad), l.width, f1(l.bottom - l.top + 2 * pad)];
    out[s.id] = layerSvg(l, { id: s.id, summary: summary(s), token: flows && s.id === core?.id, viewBox });
  }
  return out;
}
