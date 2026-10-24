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

export { R, ringCells, layoutMap, spatialNext, linksOf, connectionText, modelMapData } from "./system-map-data.ts";
export type { ModelSystem, SystemModel, MapRing, MapSystem, MapLink, MapContainer, MapFlowStep, MapFlow, SystemMapData, SystemMapOptions, Cell, Layout, Direction } from "./system-map-data.ts";
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
  // Goes inside: the core's, or with circles, any system's that has one (the chosen one's by default).
  enter(id?: string): void;
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
  const tiles = [...root.querySelectorAll<SVGGElement>(".cap-system-map-tile[data-id]")];
  const systems = systemsFrom(root);
  const points = tiles.map((t) => ({ id: t.dataset.id!, x: Number(t.dataset.x), y: Number(t.dataset.y) }));
  const coreTile = tiles.find((t) => t.hasAttribute("data-core"));
  const tileOf = (id: string) => tiles.find((t) => t.dataset.id === id);
  const flows = flowsFrom(root);
  const flowList = root.querySelector<HTMLDetailsElement>("[data-cap-part='flows']");
  // With circles every system has an inside layer of its own, by id, and flows play on the
  // core's; without, the one inside layer is the core's.
  const circles = root.hasAttribute("data-circles");
  const out = root.querySelector<HTMLButtonElement>("[data-cap-part='out']");
  const layers = new Map<string, SVGSVGElement>();
  let inside: SVGSVGElement | null = null;
  let token: SVGCircleElement | null = null;
  const findLayers = () => {
    for (const l of stage.querySelectorAll<SVGSVGElement>("[data-layer='inside'][data-system]")) layers.set(l.dataset.system!, l);
    inside = circles ? (layers.get(coreTile?.dataset.id ?? "") ?? null) : stage.querySelector<SVGSVGElement>("[data-layer='inside']");
    token = inside?.querySelector<SVGCircleElement>(".cap-system-map-token") ?? null;
  };
  findLayers();
  let selected: string | null = null;
  let playing: { id: string; n: number } | null = null;
  // With circles: the system zoomed into, and the one last asked for while its circle was on its way.
  let zoomed: string | null = null;
  let waiting: string | null = null;

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

  const enterable = (id: string) => (circles ? layers.has(id) : !!inside && tileOf(id)?.hasAttribute("data-core") === true);

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
    const id = circles ? zoomed : coreTile?.dataset.id;
    const layer = id ? (circles ? layers.get(id) : inside) : null;
    if (!id || !layer) return;
    const name = systems.get(id)?.name ?? id;
    const own = layer.querySelectorAll(".cap-system-map-box:not([data-external])").length;
    const outside = layer.querySelectorAll(".cap-system-map-box[data-external]").length;
    const rims = layer.querySelectorAll(".cap-system-map-rim").length;
    const plays = layer === inside ? [...flows].map(([f, flow]) => `<button type="button" class="cap-btn" data-cap-part="play" data-flow="${escapeHtml(f)}">Play: ${escapeHtml(flow.name)}</button>`).join("") : "";
    // With circles the way back is beside the views, so the detail line keeps the system's name.
    const href = systems.get(id)?.href;
    const open = circles && href ? `<a class="cap-btn" href="${escapeHtml(href)}">${escapeHtml(openLabel)}</a>` : "";
    const actions = `${plays}${circles ? open : `<button type="button" class="cap-btn" data-cap-part="leave">Step out</button>`}`;
    detail.innerHTML = `<strong class="cap-system-map-detail-name">${circles ? "" : "Inside "}${escapeHtml(name)}</strong><span class="cap-system-map-detail-text">${own} parts inside${outside ? `, ${outside} outside it` : ""}${rims ? `, connected to ${rims === 1 ? "1 other system" : `${rims} other systems`}` : ""}.</span>${actions ? `<span class="cap-system-map-detail-actions">${actions}</span>` : ""}`;
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
    if (circles ? zoomed !== coreTile?.dataset.id : !root.hasAttribute("data-entered")) enter(coreTile?.dataset.id, focus);
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

  const enter = (id?: string, focus = true) => {
    if (circles) {
      const to = id ?? selected ?? coreTile?.dataset.id;
      if (to) zoom(to, focus);
      return;
    }
    const layer = inside;
    if (!layer || !coreTile) return;
    root.setAttribute("data-entered", "");
    layer.removeAttribute("aria-hidden");
    layer.setAttribute("role", "img");
    const named = (sel: string) => [...layer.querySelectorAll(sel)].map((b) => b.querySelector(".cap-system-map-box-name")?.textContent).filter(Boolean).join(", ");
    const name = systems.get(coreTile.dataset.id!)?.name ?? "the core";
    const outside = named(".cap-system-map-box[data-external]");
    layer.setAttribute("aria-label", `Inside ${name}: ${named(".cap-system-map-box:not([data-external])")}.${outside ? ` Outside it: ${outside}.` : ""}`);
    insideDetail();
    if (focus) detail.querySelector<HTMLButtonElement>("[data-cap-part='leave']")?.focus();
    root.dispatchEvent(new CustomEvent("cap:system-map-enter", { bubbles: true, detail: { id: coreTile.dataset.id } }));
  };

  // With circles: the rest of the circles, fetched once the page has loaded and gone quiet, off
  // its first paint's path; a tap before then waits for them. A failed fetch adds nothing, and
  // those systems are then chosen with their lines, as without circles.
  let loading: Promise<void> | null = null;
  const load = () =>
    (loading ??= (async () => {
      const url = root.dataset.insides;
      if (!url) return;
      let all: Record<string, string> = {};
      try {
        const res = await fetch(url);
        if (res.ok) all = (await res.json()) as Record<string, string>;
      } catch {
        return;
      }
      for (const [id, svg] of Object.entries(all)) {
        if (layers.has(id)) continue;
        const t = document.createElement("template");
        t.innerHTML = svg;
        const layer = t.content.firstElementChild;
        if (layer) stage.appendChild(layer);
      }
      findLayers();
      root.setAttribute("data-insides-ready", "");
    })());

  /** What a circle holds, in words: its parts, what is outside it and the systems round its rim. */
  const describe = (id: string, layer: SVGSVGElement) => {
    const names = (sel: string) =>
      [...layer.querySelectorAll(sel)]
        .map((b) => [...b.querySelectorAll(".cap-system-map-box-name, .cap-system-map-rim-name")].map((t) => t.textContent).join(" ").replace(/- /g, "-"))
        .filter(Boolean);
    const series = (items: string[]) => (items.length < 2 ? items.join("") : items.length === 2 ? `${items[0]} and ${items[1]}` : `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`);
    const parts = names(".cap-system-map-box:not([data-external])");
    const outside = names(".cap-system-map-box[data-external]");
    const rims = names(".cap-system-map-rim");
    return `${systems.get(id)?.name ?? id}: ${parts.length ? `${series(parts)} inside.` : "no parts."}${outside.length ? ` Outside: ${series(outside)}.` : ""}${rims.length ? ` Connects to ${series(rims)}.` : ""}`;
  };

  /** With circles, one tap on a system zooms into its circle, which grows out of its capsomer. */
  const zoom = (id: string, focus: boolean) => {
    waiting = id;
    const layer = layers.get(id);
    if (!layer) {
      // Zoomed once its circle is in, unless the reader has chosen something else, or gone back, by then.
      if (root.dataset.insides && !root.hasAttribute("data-insides-ready")) {
        void load().then(() => {
          if (waiting === id && layers.has(id)) zoom(id, focus);
        });
      }
      return;
    }
    if (zoomed === id) return;
    stopFlow(true);
    zoomed = id;
    const tile = tileOf(id);
    const shell = root.querySelector<SVGSVGElement>("[data-layer='core']")?.viewBox.baseVal;
    if (tile && shell?.width) layer.style.setProperty("transform-origin", `${(((Number(tile.dataset.x) - shell.x) / shell.width) * 100).toFixed(1)}% ${(((Number(tile.dataset.y) - shell.y) / shell.height) * 100).toFixed(1)}%`);
    for (const [key, l] of layers) {
      l.toggleAttribute("data-shown", key === id);
      l.setAttribute("aria-hidden", "true");
      l.removeAttribute("role");
      l.removeAttribute("aria-label");
    }
    root.dataset.zoom = id;
    root.setAttribute("data-entered", "");
    if (out) out.hidden = false;
    layer.removeAttribute("aria-hidden");
    layer.setAttribute("role", "img");
    layer.setAttribute("aria-label", describe(id, layer));
    insideDetail();
    if (focus) {
      // In the next frame, as is the scroll: focus lays the page out, and the tap's own handler stays short.
      requestAnimationFrame(() => {
        if (zoomed !== id) return;
        out?.focus({ preventScroll: true });
        // The circle in view, with the detail line above it where they fit together.
        const top = Math.min(detail.getBoundingClientRect().top, stage.getBoundingClientRect().top);
        const bottom = Math.max(detail.getBoundingClientRect().bottom, stage.getBoundingClientRect().bottom);
        const by = bottom > innerHeight - 8 ? Math.min(top - 8, bottom - innerHeight + 8) : top < 0 ? top - 8 : 0;
        if (by) scrollBy({ top: by, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    }
    root.dispatchEvent(new CustomEvent("cap:system-map-enter", { bubbles: true, detail: { id } }));
  };

  const leave = () => {
    if (!root.hasAttribute("data-entered")) return;
    stopFlow(true);
    root.removeAttribute("data-entered");
    if (circles) {
      const was = zoomed;
      zoomed = null;
      waiting = null;
      delete root.dataset.zoom;
      if (out) out.hidden = true;
      for (const l of layers.values()) {
        l.removeAttribute("data-shown");
        l.setAttribute("aria-hidden", "true");
        l.removeAttribute("role");
        l.removeAttribute("aria-label");
      }
      select(null);
      if (was) focusTile(was);
      root.dispatchEvent(new CustomEvent("cap:system-map-leave", { bubbles: true, detail: { id: was } }));
      return;
    }
    inside?.setAttribute("aria-hidden", "true");
    inside?.removeAttribute("role");
    if (coreTile) {
      select(coreTile.dataset.id!);
      focusTile(coreTile.dataset.id!);
    }
    root.dispatchEvent(new CustomEvent("cap:system-map-leave", { bubbles: true, detail: { id: coreTile?.dataset.id } }));
  };

  const setView = (view: "shell" | "plain") => {
    if (view === "plain") leave();
    root.dataset.view = view;
    list.open = view === "plain";
    if (flowList) flowList.open = view === "plain";
    for (const b of views?.querySelectorAll<HTMLButtonElement>("button[data-view]") ?? []) b.setAttribute("aria-pressed", String(b.dataset.view === view));
  };

  const activate = (id: string) => {
    if (circles) {
      if (zoomed === id) return;
      select(id);
      zoom(id, true);
      return;
    }
    if (root.hasAttribute("data-entered")) leave();
    if (selected === id && enterable(id)) enter();
    else select(id);
  };

  const onClick = (e: Event) => {
    const target = e.target as Element;
    if (circles && zoomed) {
      if (target.closest("[data-cap-part='out']")) return leave();
      // Another system on the rim zooms there; a tap outside the circle goes back.
      const goto = target.closest<SVGGElement>(".cap-system-map-rim[data-goto]")?.dataset.goto;
      if (goto && tileOf(goto)) {
        for (const t of tiles) t.setAttribute("tabindex", t.dataset.id === goto ? "0" : "-1");
        return activate(goto);
      }
      const circle = layers.get(zoomed)?.querySelector<SVGCircleElement>(".cap-system-map-boundary");
      const m = circle?.getScreenCTM();
      if (circle && m && e instanceof MouseEvent && stage.contains(target) && !target.closest(".cap-system-map-box")) {
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
        if (Math.hypot(p.x - circle.cx.baseVal.value, p.y - circle.cy.baseVal.value) > circle.r.baseVal.value) return leave();
      }
    }
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

  // With circles, Escape goes back to the map from anywhere on the page; while a flow plays it stops the flow first.
  const onPageKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented || !zoomed || playing) return;
    e.preventDefault();
    leave();
  };
  const later = () => ("requestIdleCallback" in window ? requestIdleCallback(() => void load(), { timeout: 2000 }) : setTimeout(() => void load(), 200));
  if (circles) {
    document.addEventListener("keydown", onPageKey);
    if (root.dataset.insides) {
      if (document.readyState === "complete") later();
      else addEventListener("load", later, { once: true });
    }
    // Drawn zoomed into by the server (systemMapHtml's circles.chosen): the same state, with no movement.
    const asked = root.dataset.zoom;
    if (asked && tileOf(asked)) {
      for (const t of tiles) t.setAttribute("tabindex", t.dataset.id === asked ? "0" : "-1");
      select(asked);
      zoom(asked, false);
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  return {
    select,
    enter: (id?: string) => enter(id),
    leave,
    setView,
    playFlow: (id: string, n = 1) => playFlow(id, n, false),
    step: (n: number) => showStep(n, false),
    stopFlow: () => stopFlow(),
    destroy() {
      stopFlow(true);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onPageKey);
      removeEventListener("load", later);
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
