// The system map: a family of systems drawn as a capsid, the systems as its capsomers
// (capsid/rulings/system-explorer-2026-10-10.md; the design is
// capsid/research/design-system-explorer.md, section 3). The core system sits in the
// middle, shared parts in the ring around it, and what people use on the outside. At rest
// there are no lines; choosing a capsomer draws its connections, and choosing the core
// again goes inside it, where its containers sit within the shell's boundary.
//
// `systemMapHtml` renders the whole contract as a string, so a server or a static build
// delivers it (the list of the same data is readable with no script). `enhance` adds the
// roles, one tab stop with the arrow keys moving between neighbours, choosing, going in
// and out, and the plain view. No framework, no storage.

import { type Direction, type MapSystem, connectionText, spatialNext } from "./system-map-data.ts";
import { escapeHtml } from "./system-map-html.ts";

export { R, ringCells, layoutMap, spatialNext, linksOf, connectionText } from "./system-map-data.ts";
export type { MapRing, MapSystem, MapLink, MapContainer, MapFlowStep, MapFlow, SystemMapData, SystemMapOptions, Cell, Layout, Direction } from "./system-map-data.ts";
export { ROUTE_CLEAR, LINE_SEP, JUNCTION_END, SHORT_LINK, BEND_CLEAR, rectInset, rectOutset, segmentHitsRect, segmentHitsBox, pointSegDist, segmentCross, segDist, segAngle, sideBySide, segmentFaults, portsOf, insideScene, playableFlows } from "./system-map-inside.ts";
export type { Rect, InsideWire, Circle, InsideScene } from "./system-map-inside.ts";
export { escapeHtml, hexPoints, seamRoute, systemMapHtml } from "./system-map-html.ts";
export type { Box } from "./system-map-html.ts";

// ---------------------------------------------------------------------------------------
// Behaviour.

const READY = "data-cap-ready";

function detailHtml(s: MapSystem, links: number, enterable: boolean, openLabel: string): string {
  const bits = [`<strong class="cap-system-map-detail-name">${escapeHtml(s.name)}</strong>`];
  const facts: string[] = [];
  if (s.private) facts.push("Private: name and address only");
  if (s.description) facts.push(escapeHtml(s.description.replace(/\.$/, "")));
  if (s.domain) facts.push(escapeHtml(s.domain));
  facts.push(connectionText(links));
  bits.push(`<span class="cap-system-map-detail-text">${facts.join(" · ")}</span>`);
  const actions: string[] = [];
  if (enterable) actions.push(`<button type="button" class="cap-btn" data-cap-part="enter">Go inside</button>`);
  if (s.href) actions.push(`<a class="cap-btn" href="${escapeHtml(s.href)}">${escapeHtml(openLabel)}</a>`);
  if (actions.length) bits.push(`<span class="cap-system-map-detail-actions">${actions.join("")}</span>`);
  return bits.join("");
}

/** Reads the systems back out of the delivered list, so the script needs no second copy. */
function systemsFrom(root: HTMLElement): Map<string, MapSystem> {
  const out = new Map<string, MapSystem>();
  for (const li of root.querySelectorAll<HTMLElement>(".cap-system-map-list li[data-id]")) {
    const id = li.dataset.id!;
    const tile = root.querySelector<SVGGElement>(`.cap-system-map-tile[data-id="${CSS.escape(id)}"]`);
    out.set(id, {
      id,
      name: li.querySelector(".cap-system-map-item-name")?.textContent ?? id,
      ring: tile?.hasAttribute("data-core") ? "core" : "used",
      private: tile?.hasAttribute("data-private") ?? false,
      description: li.querySelector(".cap-system-map-item-text")?.textContent ?? undefined,
      domain: li.querySelector(".cap-system-map-item-domain")?.textContent ?? undefined,
      href: li.querySelector<HTMLAnchorElement>(".cap-system-map-item-link")?.getAttribute("href") ?? undefined,
    });
  }
  return out;
}

interface PlayFlow {
  name: string;
  steps: Array<{ from: string; to: string; toward: string; text: string; lights: string[] }>;
}

/** Reads the flows back out of the delivered step lists, as the systems are read from the list. */
function flowsFrom(root: HTMLElement): Map<string, PlayFlow> {
  const out = new Map<string, PlayFlow>();
  for (const sec of root.querySelectorAll<HTMLElement>(".cap-system-map-flow[data-flow]")) {
    out.set(sec.dataset.flow!, {
      name: sec.querySelector(".cap-system-map-flow-name")?.textContent ?? sec.dataset.flow!,
      steps: [...sec.querySelectorAll<HTMLElement>("ol > li")].map((li) => ({
        from: li.dataset.from!,
        to: li.dataset.to!,
        toward: li.dataset.toward!,
        text: li.textContent ?? "",
        lights: (li.dataset.lights ?? "").split(" ").filter(Boolean),
      })),
    });
  }
  return out;
}

/** The token's way along a drawn line: its corners from `start` toward `end`. A line starts and
 *  ends on its boxes' edges, so its two ends move `gap` along it, off the boxes. `forward` says
 *  the line was drawn from start to end. */
export function tokenRoute(route: string, forward: boolean, gap = 8): Array<[number, number]> {
  const pts = route
    .split(" ")
    .filter(Boolean)
    .map((p) => p.split(",").map(Number) as [number, number]);
  if (pts.length < 2) return pts;
  const way = forward ? pts : pts.reverse();
  const nudge = (p: [number, number], q: [number, number]): [number, number] => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const t = l ? Math.min(gap, l / 2) / l : 0;
    return [Math.round((p[0] + (q[0] - p[0]) * t) * 10) / 10, Math.round((p[1] + (q[1] - p[1]) * t) * 10) / 10];
  };
  const first = nudge(way[0]!, way[1]!);
  way[way.length - 1] = nudge(way[way.length - 1]!, way[way.length - 2]!);
  way[0] = first;
  return way;
}

/** Keyframes that move at one speed along a route. */
export function routeFrames(route: ReadonlyArray<[number, number]>): Array<{ transform: string; offset: number }> {
  const lengths = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i]![0], p[1] - route[i]![1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let run = 0;
  return route.map((p, i) => {
    if (i > 0) run += lengths[i - 1]!;
    return { transform: `translate(${p[0]}px, ${p[1]}px)`, offset: Math.round((run / total) * 1000) / 1000 };
  });
}

/** The words a flow's step shows: where it is in the flow, then what happens. */
export function stepText(n: number, total: number, text: string): string {
  return `Step ${n} of ${total}. ${text}`;
}

export interface SystemMapController {
  select(id: string | null): void;
  enter(): void;
  leave(): void;
  setView(view: "shell" | "plain"): void;
  // Inside the core: play a flow from a step (1 by default), move to a step, stop.
  playFlow(id: string, step?: number): void;
  step(n: number): void;
  stopFlow(): void;
  destroy(): void;
}

export function controller(root: HTMLElement, openLabel = "Open"): SystemMapController {
  const stage = root.querySelector<HTMLElement>("[data-cap-part='stage']")!;
  const detail = root.querySelector<HTMLElement>("[data-cap-part='detail']")!;
  const list = root.querySelector<HTMLDetailsElement>("[data-cap-part='list']")!;
  const views = root.querySelector<HTMLElement>("[data-cap-part='views']");
  const keys = root.querySelector<HTMLElement>(`#${CSS.escape(root.id)}-keys`);
  const inside = root.querySelector<SVGSVGElement>("[data-layer='inside']");
  const tiles = [...root.querySelectorAll<SVGGElement>(".cap-system-map-tile[data-id]")];
  const systems = systemsFrom(root);
  const points = tiles.map((t) => ({ id: t.dataset.id!, x: Number(t.dataset.x), y: Number(t.dataset.y) }));
  const coreTile = tiles.find((t) => t.hasAttribute("data-core"));
  const tileOf = (id: string) => tiles.find((t) => t.dataset.id === id);
  const flows = flowsFrom(root);
  const flowList = root.querySelector<HTMLDetailsElement>("[data-cap-part='flows']");
  const token = inside?.querySelector<SVGCircleElement>(".cap-system-map-token") ?? null;
  let selected: string | null = null;
  let playing: { id: string; n: number } | null = null;

  // The drawing becomes the control: the stage is a group of buttons, one tab stop.
  stage.setAttribute("role", "group");
  stage.removeAttribute("aria-label");
  stage.setAttribute("aria-labelledby", `${root.id}-title`);
  if (keys) stage.setAttribute("aria-describedby", keys.id);
  for (const svg of stage.querySelectorAll<SVGSVGElement>("[data-layer='core'], [data-layer='inner'], [data-layer='rim']")) svg.removeAttribute("aria-hidden");
  for (const t of tiles) {
    const s = systems.get(t.dataset.id!);
    const tag = t.querySelector(".cap-system-map-tag")?.textContent?.trim();
    t.setAttribute("role", "button");
    t.setAttribute("tabindex", "-1");
    t.setAttribute("aria-pressed", "false");
    // The name starts with the words the tile shows (WCAG 2.5.3); a short label adds the full name after.
    const shown = t.querySelector(".cap-system-map-name")?.textContent ?? s?.name ?? t.dataset.id;
    const full = s?.name && s.name !== shown ? ` (${s.name})` : "";
    t.setAttribute("aria-label", `${[shown, tag].filter(Boolean).join(", ")}${full}`);
  }
  const first = coreTile ?? tiles[0];
  first?.setAttribute("tabindex", "0");
  if (views) views.hidden = false;
  list.open = false;
  if (flowList) flowList.open = false;
  detail.hidden = false;
  detail.innerHTML = `<span class="cap-system-map-detail-text">Choose a system to see what it connects to.</span>`;

  const focusTile = (id: string) => {
    for (const t of tiles) t.setAttribute("tabindex", t.dataset.id === id ? "0" : "-1");
    tileOf(id)?.focus();
  };

  const enterable = (id: string) => !!inside && tileOf(id)?.hasAttribute("data-core") === true;

  const select = (id: string | null) => {
    stopFlow(true);
    selected = id;
    root.toggleAttribute("data-selected", id !== null);
    for (const t of tiles) t.setAttribute("aria-pressed", String(t.dataset.id === id));
    let n = 0;
    const linked = new Set<string>();
    for (const p of root.querySelectorAll<SVGPathElement>(".cap-system-map-edge")) {
      const on = id !== null && (p.dataset.from === id || p.dataset.to === id);
      p.toggleAttribute("data-on", on);
      if (on) {
        n++;
        linked.add(p.dataset.from === id ? p.dataset.to! : p.dataset.from!);
      }
    }
    // A seam touches three capsomers at every corner, so the far ends are marked too.
    for (const t of tiles) t.toggleAttribute("data-linked", linked.has(t.dataset.id!));
    const s = id ? systems.get(id) : undefined;
    detail.innerHTML = s ? detailHtml(s, n, enterable(s.id), openLabel) : `<span class="cap-system-map-detail-text">Choose a system to see what it connects to.</span>`;
    if (id) root.dispatchEvent(new CustomEvent("cap:system-map-select", { bubbles: true, detail: { id } }));
  };

  const insideDetail = () => {
    if (!inside || !coreTile) return;
    const name = systems.get(coreTile.dataset.id!)?.name ?? "the core";
    const own = inside.querySelectorAll(".cap-system-map-box:not([data-external])").length;
    const outside = inside.querySelectorAll(".cap-system-map-box[data-external]").length;
    const plays = [...flows].map(([id, f]) => `<button type="button" class="cap-btn" data-cap-part="play" data-flow="${escapeHtml(id)}">Play: ${escapeHtml(f.name)}</button>`).join("");
    detail.innerHTML = `<strong class="cap-system-map-detail-name">Inside ${escapeHtml(name)}</strong><span class="cap-system-map-detail-text">${own} parts inside${outside ? `, ${outside} outside it` : ""}.</span><span class="cap-system-map-detail-actions">${plays}<button type="button" class="cap-btn" data-cap-part="leave">Step out</button></span>`;
  };

  // `focus` is for a reader's own press; a host's call (playFlow, step) leaves focus alone.
  const showStep = (n: number, focus = true) => {
    const f = playing ? flows.get(playing.id) : undefined;
    if (!f || !inside) return;
    const k = Math.min(Math.max(1, Math.round(n)), f.steps.length);
    const st = f.steps[k - 1]!;
    playing = { id: playing!.id, n: k };
    root.dataset.step = String(k);
    for (const w of inside.querySelectorAll<SVGPathElement>(".cap-system-map-wire")) {
      w.toggleAttribute("data-on", (w.dataset.from === st.from && w.dataset.to === st.to) || (w.dataset.from === st.to && w.dataset.to === st.from));
    }
    for (const b of inside.querySelectorAll<SVGGElement>(".cap-system-map-box")) {
      const id = b.dataset.id!;
      b.toggleAttribute("data-lit", st.lights.includes(id));
      b.toggleAttribute("data-at", id === st.toward);
    }
    if (token) {
      // The token follows the step's line as drawn, bends and all, from just off one box to just
      // off the other, so it never sits on a part's name.
      const start = st.toward === st.to ? st.from : st.to;
      const wire = [...inside.querySelectorAll<SVGPathElement>(".cap-system-map-wire")].find((w) => (w.dataset.from === start && w.dataset.to === st.toward) || (w.dataset.from === st.toward && w.dataset.to === start));
      const route = tokenRoute(wire?.dataset.route ?? "", wire?.dataset.from === start);
      const frames = routeFrames(route);
      for (const a of token.getAnimations()) a.cancel();
      token.style.transform = frames.at(-1)!.transform;
      if (frames.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        token.animate(frames, { duration: 700, easing: "ease-in-out" });
      }
    }
    const was = (document.activeElement as HTMLElement | null)?.dataset?.capPart;
    detail.innerHTML = `<strong class="cap-system-map-detail-name">${escapeHtml(f.name)}</strong><span class="cap-system-map-detail-text">${escapeHtml(stepText(k, f.steps.length, st.text))}</span><span class="cap-system-map-detail-actions"><button type="button" class="cap-btn" data-cap-part="back"${k === 1 ? " disabled" : ""}>Back</button><button type="button" class="cap-btn" data-cap-part="next"${k === f.steps.length ? " disabled" : ""}>Next</button><button type="button" class="cap-btn" data-cap-part="stop">Stop</button></span>`;
    // Focus stays on the control that was pressed, unless it is now disabled.
    const again = was && detail.querySelector<HTMLButtonElement>(`[data-cap-part="${was}"]:not([disabled])`);
    if (focus) (again || detail.querySelector<HTMLButtonElement>("[data-cap-part='next']:not([disabled])") || detail.querySelector<HTMLButtonElement>("[data-cap-part='back']"))?.focus();
    root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id: playing!.id, step: k } }));
  };

  const playFlow = (id: string, n = 1, focus = true) => {
    if (!flows.has(id)) return;
    if (!root.hasAttribute("data-entered")) enter(focus);
    playing = { id, n };
    root.dataset.flow = id;
    showStep(n, focus);
  };

  const stopFlow = (quiet = false) => {
    if (!playing) return;
    const id = playing.id;
    playing = null;
    delete root.dataset.flow;
    delete root.dataset.step;
    for (const el of inside?.querySelectorAll("[data-on], [data-lit], [data-at]") ?? []) {
      el.removeAttribute("data-on");
      el.removeAttribute("data-lit");
      el.removeAttribute("data-at");
    }
    if (token) for (const a of token.getAnimations()) a.cancel();
    root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id: null, step: 0 } }));
    // Quiet when something else is taking over the detail line: leaving, choosing, tearing down.
    if (quiet) return;
    insideDetail();
    detail.querySelector<HTMLButtonElement>(`[data-cap-part="play"][data-flow="${CSS.escape(id)}"]`)?.focus();
  };

  const enter = (focus = true) => {
    if (!inside || !coreTile) return;
    root.setAttribute("data-entered", "");
    inside.removeAttribute("aria-hidden");
    inside.setAttribute("role", "img");
    const named = (sel: string) => [...inside.querySelectorAll(sel)].map((b) => b.querySelector(".cap-system-map-box-name")?.textContent).filter(Boolean).join(", ");
    const name = systems.get(coreTile.dataset.id!)?.name ?? "the core";
    const outside = named(".cap-system-map-box[data-external]");
    inside.setAttribute("aria-label", `Inside ${name}: ${named(".cap-system-map-box:not([data-external])")}.${outside ? ` Outside it: ${outside}.` : ""}`);
    insideDetail();
    if (focus) detail.querySelector<HTMLButtonElement>("[data-cap-part='leave']")?.focus();
    root.dispatchEvent(new CustomEvent("cap:system-map-enter", { bubbles: true, detail: { id: coreTile.dataset.id } }));
  };

  const leave = () => {
    if (!root.hasAttribute("data-entered")) return;
    stopFlow(true);
    root.removeAttribute("data-entered");
    inside?.setAttribute("aria-hidden", "true");
    inside?.removeAttribute("role");
    if (coreTile) {
      select(coreTile.dataset.id!);
      focusTile(coreTile.dataset.id!);
    }
  };

  const setView = (view: "shell" | "plain") => {
    if (view === "plain") leave();
    root.dataset.view = view;
    list.open = view === "plain";
    if (flowList) flowList.open = view === "plain";
    for (const b of views?.querySelectorAll<HTMLButtonElement>("button[data-view]") ?? []) b.setAttribute("aria-pressed", String(b.dataset.view === view));
  };

  const activate = (id: string) => {
    if (root.hasAttribute("data-entered")) leave();
    if (selected === id && enterable(id)) enter();
    else select(id);
  };

  const onClick = (e: Event) => {
    const target = e.target as Element;
    const tile = target.closest<SVGGElement>(".cap-system-map-tile[data-id]");
    if (tile && stage.contains(tile)) {
      focusTile(tile.dataset.id!);
      activate(tile.dataset.id!);
      return;
    }
    const part = target.closest<HTMLElement>("[data-cap-part]")?.dataset.capPart;
    if (part === "enter") enter();
    else if (part === "leave") leave();
    else if (part === "play") playFlow(target.closest<HTMLElement>("[data-flow]")?.dataset.flow ?? "");
    else if (part === "next" && playing) showStep(playing.n + 1);
    else if (part === "back" && playing) showStep(playing.n - 1);
    else if (part === "stop") stopFlow();
    const view = target.closest<HTMLButtonElement>(".cap-system-map-views button[data-view]")?.dataset.view;
    if (view === "shell" || view === "plain") setView(view);
  };

  const ARROWS: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  const onKey = (e: KeyboardEvent) => {
    if (playing && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
      const steps = flows.get(playing.id)!.steps.length;
      const digit = /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
      const to = e.key === "ArrowRight" ? playing.n + 1 : e.key === "ArrowLeft" ? playing.n - 1 : digit && digit <= steps ? digit : 0;
      if (to >= 1 && to <= steps) {
        e.preventDefault();
        showStep(to);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        stopFlow();
        return;
      }
    }
    if (e.key === "Escape" && root.hasAttribute("data-entered")) {
      e.preventDefault();
      leave();
      return;
    }
    const tile = (e.target as Element).closest?.<SVGGElement>(".cap-system-map-tile[data-id]");
    if (!tile) return;
    const id = tile.dataset.id!;
    const dir = ARROWS[e.key];
    let next: string | null = null;
    if (dir) next = spatialNext(points, id, dir);
    else if (e.key === "Home") next = points[0]?.id ?? null;
    else if (e.key === "End") next = points.at(-1)?.id ?? null;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(id);
      return;
    } else if (e.key === "Escape" && selected) {
      e.preventDefault();
      select(null);
      return;
    } else return;
    e.preventDefault();
    if (next) focusTile(next);
  };

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  return {
    select,
    enter,
    leave,
    setView,
    playFlow: (id: string, n = 1) => playFlow(id, n, false),
    step: (n: number) => showStep(n, false),
    stopFlow: () => stopFlow(),
    destroy() {
      stopFlow(true);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    },
  };
}

export function enhance(root: ParentNode = document): () => void {
  const made: SystemMapController[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='system-map']")) {
    if (el.hasAttribute(READY)) continue;
    el.setAttribute(READY, "");
    made.push(controller(el, el.dataset.openLabel ?? "Open"));
  }
  return () => {
    for (const c of made) c.destroy();
  };
}
