// The system map's wires: a line for every tie, drawn between the cards where the page's own
// layout put them (system-map.ts). The markup says which nodes are tied (`data-wire`, the node's
// key, and `data-wires`, the keys it is tied to); this draws them as one SVG under the cards and
// redraws when the map changes size. The lanes are side by side, so most wires run from one lane
// to the next. One that skips a lane passes it through a gap between that lane's cards, never
// over one, and a wire inside a lane bows out to the lane's outer side. Where each wire meets a
// card is sorted by where it goes, so wires leaving one card never cross each other there.
//
// The SVG is hidden from assistive technology: every wire is also words (a card's counts and its
// system's page, a part's lines), so the drawing repeats what the text already says.

const SVG = "http://www.w3.org/2000/svg";
const ids = (v: string | undefined) => (v ?? "").split(" ").filter(Boolean);

interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
}

interface Node {
  key: string;
  el: HTMLElement;
  box: Box;
  // The lane the node stands in, or -1 for a node as wide as several lanes (a system's own heading).
  lane: number;
}

interface Port {
  x: number;
  y: number;
}

export type WireTest = (a: string, b: string) => boolean;

export interface Wires {
  // Light the wires the test passes, dim the rest; null lights none and dims none.
  light(test: WireTest | null): void;
  draw(): void;
  destroy(): void;
}

const mid = (b: Box) => (b.t + b.b) / 2;
const curve = (x0: number, y0: number, x1: number, y1: number) => {
  const dx = (x1 - x0) / 2;
  return `C ${x0 + dx} ${y0} ${x1 - dx} ${y1} ${x1} ${y1}`;
};

/**
 * The open spaces of a lane, top to bottom, between what stands in it (its cards and headings),
 * from just above the map's highest node to just below its lowest.
 */
function gapsOf(obstacles: Box[], top: number, bottom: number): [number, number][] {
  const sorted = [...obstacles].sort((x, y) => x.t - y.t);
  const out: [number, number][] = [];
  let y = top;
  for (const o of sorted) {
    if (o.t > y) out.push([y, o.t]);
    y = Math.max(y, o.b);
  }
  if (bottom > y) out.push([y, bottom]);
  return out.filter(([a, b]) => b - a >= 8);
}

/**
 * Wires for the map under `host`, whose lanes are `lanes` (left to right as drawn). `selfSide`
 * picks the side a wire inside a lane bows out to.
 */
export function wires(host: HTMLElement, lanes: () => HTMLElement[], signal: AbortSignal): Wires {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "cap-system-map-wires");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  host.prepend(svg);
  let test: WireTest | null = null;

  const paint = () => {
    for (const p of svg.querySelectorAll<SVGElement>("[data-a]")) {
      const on = test ? test(p.dataset.a!, p.dataset.b!) : false;
      p.toggleAttribute("data-on", on);
      // Lit wires on top, so the ones lit are never under the ones dimmed.
      if (on) svg.append(p);
    }
    svg.toggleAttribute("data-lit", !!test);
  };

  const draw = () => {
    svg.replaceChildren();
    const H = host.getBoundingClientRect();
    const rel = (r: DOMRect): Box => ({ l: r.left - H.left, r: r.right - H.left, t: r.top - H.top, b: r.bottom - H.top });
    const laneEls = lanes();
    const laneBoxes = laneEls.map((l) => rel(l.getBoundingClientRect()));
    // Stacked (a narrow map): the lanes overlap side to side, and the words carry the ties alone.
    const sideBySide = laneBoxes.length > 1 && laneBoxes.every((b, i) => i === 0 || b.l >= laneBoxes[i - 1]!.r - 1);
    svg.toggleAttribute("hidden", !sideBySide);
    if (!sideBySide) return;

    const nodes = new Map<string, Node>();
    for (const el of host.querySelectorAll<HTMLElement>("[data-wire]")) {
      if (!el.getClientRects().length) continue;
      const lane = laneEls.findIndex((l) => l.contains(el));
      nodes.set(el.dataset.wire!, { key: el.dataset.wire!, el, box: rel(el.getBoundingClientRect()), lane });
    }
    const edges: [Node, Node][] = [];
    const seen = new Set<string>();
    for (const n of nodes.values()) {
      for (const k of ids(n.el.dataset.wires)) {
        const o = nodes.get(k);
        if (!o || o === n) continue;
        const pair = n.key < k ? `${n.key}\n${k}` : `${k}\n${n.key}`;
        if (seen.has(pair)) continue;
        seen.add(pair);
        // A wide node always stands second; otherwise the wire runs left to right.
        edges.push(n.lane === -1 || (o.lane !== -1 && o.lane < n.lane) ? [o, n] : [n, o]);
      }
    }

    const all = [...nodes.values()];
    const top = Math.min(...all.map((n) => n.box.t)) - 20;
    const bottom = Math.max(...all.map((n) => n.box.b)) + 20;
    const headings = [...host.querySelectorAll<HTMLElement>("h2, h3, h4, h5, h6")].map((h) => rel(h.getBoundingClientRect()));
    const gaps = laneBoxes.map((lb) => gapsOf([...all.map((n) => n.box), ...headings].filter((o) => o.r > lb.l + 1 && o.l < lb.r - 1), top, bottom));
    const gutter = (lane: number, side: "l" | "r") => {
      const next = side === "r" ? laneBoxes[lane + 1] : laneBoxes[lane - 1];
      const here = laneBoxes[lane]!;
      return next ? (side === "r" ? next.l - here.r : here.l - next.r) : 48;
    };

    // Each wire's route: its two ends' sides, and its waypoints through the lanes it skips.
    interface Route {
      a: Node;
      b: Node;
      sa: "l" | "r";
      sb: "l" | "r";
      via: { lane: number; y: number; target: number; gap: number }[];
      pa?: Port;
      pb?: Port;
    }
    const routes: Route[] = edges.map(([a, b]) => {
      // To a wide node, straight across to its near edge: the node is a heading over the lanes.
      if (b.lane === -1) return { a, b, sa: a.box.r <= b.box.l + 1 ? "r" : "l", sb: a.box.r <= b.box.l + 1 ? "l" : "r", via: [] };
      if (a.lane === b.lane) {
        const s = a.lane === 0 && laneBoxes.length > 1 ? "l" : "r";
        return { a, b, sa: s, sb: s, via: [] };
      }
      const xa = a.box.r;
      const xb = b.box.l;
      const via = [];
      for (let lane = a.lane + 1; lane < b.lane; lane++) {
        const lx = (laneBoxes[lane]!.l + laneBoxes[lane]!.r) / 2;
        const target = mid(a.box) + ((mid(b.box) - mid(a.box)) * (lx - xa)) / Math.max(1, xb - xa);
        const gs = gaps[lane]!;
        let gap = 0;
        let bestD = Infinity;
        gs.forEach(([g0, g1], i) => {
          const d = target < g0 + 6 ? g0 + 6 - target : target > g1 - 6 ? target - (g1 - 6) : 0;
          if (d < bestD) {
            bestD = d;
            gap = i;
          }
        });
        via.push({ lane, y: target, target, gap });
      }
      return { a, b, sa: "r", sb: "l", via };
    });

    // Wires through one gap keep their order and stay 5 px apart, inside the gap.
    const byGap = new Map<string, Route["via"]>();
    for (const r of routes) for (const v of r.via) byGap.set(`${v.lane} ${v.gap}`, [...(byGap.get(`${v.lane} ${v.gap}`) ?? []), v]);
    for (const [key, list] of byGap) {
      const [lane, gi] = key.split(" ").map(Number);
      const [g0, g1] = gaps[lane!]![gi!] ?? [top, bottom];
      list.sort((x, y) => x.target - y.target);
      const lo = g0 + 6;
      const hi = g1 - 6;
      const step = Math.min(5, (hi - lo) / Math.max(1, list.length));
      let y = -Infinity;
      for (const v of list) {
        y = Math.max(Math.min(Math.max(v.target, lo), hi), y + step);
        v.y = y;
      }
      const over = y - hi;
      if (over > 0) for (const v of list) v.y -= over;
    }

    // Ports: each card's wires on one side, spread down that side in the order of where they go.
    const ports = new Map<string, { r: Route; end: "a" | "b"; key: number }[]>();
    const toward = (r: Route, end: "a" | "b") => (end === "a" ? (r.via[0]?.y ?? mid(r.b.box)) : (r.via[r.via.length - 1]?.y ?? mid(r.a.box)));
    for (const r of routes) {
      for (const end of ["a", "b"] as const) {
        const n = r[end];
        const side = end === "a" ? r.sa : r.sb;
        const k = `${n.key}\n${side}`;
        ports.set(k, [...(ports.get(k) ?? []), { r, end, key: toward(r, end) }]);
      }
    }
    for (const [k, list] of ports) {
      const side = k.endsWith("\nr") ? "r" : "l";
      list.sort((x, y) => x.key - y.key);
      list.forEach((p, i) => {
        const box = p.r[p.end].box;
        // A wide node (a heading) takes its wires at its middle; a card spreads them down its side.
        const y = p.r[p.end].lane === -1 ? mid(box) : box.t + (box.b - box.t) * (0.2 + (0.6 * (i + 0.5)) / list.length);
        p.r[p.end === "a" ? "pa" : "pb"] = { x: side === "r" ? box.r : box.l, y };
      });
    }

    const frag = document.createDocumentFragment();
    for (const r of routes) {
      const pa = r.pa!;
      const pb = r.pb!;
      let d = `M ${pa.x} ${pa.y} `;
      if (r.b.lane === -1) {
        d += curve(pa.x, pa.y, pb.x, pb.y);
      } else if (r.a.lane === r.b.lane) {
        const out = r.sa === "r" ? 1 : -1;
        const bow = Math.min(gutter(r.a.lane, r.sa) * 0.45, 14 + Math.abs(pb.y - pa.y) * 0.12) * out;
        d += `C ${pa.x + bow} ${pa.y} ${pb.x + bow} ${pb.y} ${pb.x} ${pb.y}`;
      } else {
        let x = pa.x;
        let y = pa.y;
        for (const v of r.via) {
          const lb = laneBoxes[v.lane]!;
          d += `${curve(x, y, lb.l, v.y)} L ${lb.r} ${v.y} `;
          x = lb.r;
          y = v.y;
        }
        d += curve(x, y, pb.x, pb.y);
      }
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("class", "cap-system-map-wire");
      path.setAttribute("d", d);
      path.dataset.a = r.a.key;
      path.dataset.b = r.b.key;
      frag.append(path);
    }
    for (const r of routes) {
      for (const [p, n] of [[r.pa!, r.a], [r.pb!, r.b]] as const) {
        const dot = document.createElementNS(SVG, "circle");
        dot.setAttribute("class", "cap-system-map-port");
        dot.setAttribute("cx", String(p.x));
        dot.setAttribute("cy", String(p.y));
        dot.setAttribute("r", "2.5");
        dot.dataset.a = r.a.key;
        dot.dataset.b = r.b.key;
        dot.dataset.at = n.key;
        frag.append(dot);
      }
    }
    svg.append(frag);
    paint();
  };

  let frame = 0;
  const later = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  };
  const ro = new ResizeObserver(later);
  ro.observe(host);
  signal.addEventListener("abort", () => {
    ro.disconnect();
    cancelAnimationFrame(frame);
    svg.remove();
  });
  // Web fonts change the cards' heights once they load.
  void document.fonts?.ready.then(() => !signal.aborted && later());
  draw();

  return {
    light(t) {
      test = t;
      paint();
    },
    draw,
    destroy() {
      ro.disconnect();
      svg.remove();
    },
  };
}
