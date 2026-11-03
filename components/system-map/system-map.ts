// The system map: a network of systems as cards, and one system with its users, its parts and
// what it uses (capsid/rulings/system-explorer-2026-10-10.md, answer 9: one component for
// dustinedwards.info /systems and the Capsid explorer; the card design replaced the capsid drawing
// on 2026-11-03).
//
// `systemMapHtml` renders the whole contract as a string, so a server or a static build delivers
// it, complete with no script. `enhance` adds what needs a script: on the network, hovering over or
// focusing a card lights what it uses and what uses it and dims the rest; on a system, Back and
// Next step a flow, lighting the parts each step touches. No framework, no storage.

import { stepText } from "./system-map-data.ts";
import { type Wires, wires } from "./system-map-wires.ts";

export { modelMapData, networkLayout, tiePairs, tiesOf, flowsOver, ownerOf, placeOf, verbOf, count, stepText, VERB, STORE_KINDS, EXTERNAL } from "./system-map-data.ts";
export type { ModelSystem, SystemModel, MapRing, MapSystem, MapLink, MapContainer, MapFlowStep, MapFlow, SystemMapData, SystemMapOptions, Lane, NetworkBlock, NetworkLane, Tie, Ties, ShownFlow, ShownStep, PartPlace } from "./system-map-data.ts";
export { escapeHtml, systemMapHtml } from "./system-map-html.ts";

const READY = "data-cap-ready";
const ids = (v: string | undefined) => (v ?? "").split(" ").filter(Boolean);

export interface SystemMapController {
  // The system whose ties are lit on the network, or null to clear.
  light(id: string | null): void;
  // A flow at a step, counted from 1, on a system's page.
  playFlow(id: string, step?: number): void;
  step(n: number): void;
  stopFlow(): void;
  destroy(): void;
}

/**
 * The network: a card under the pointer or with focus lights its ties. Each lit card says how it
 * is tied in a word line (the tint is never the only sign), the card itself gets a heavier edge,
 * and every other card dims.
 */
function network(root: HTMLElement, signal: AbortSignal) {
  const graph = root.querySelector<HTMLElement>(".cap-system-map-graph");
  const lines = graph ? wires(graph, () => [...graph.querySelectorAll<HTMLElement>(".cap-system-map-lane")], signal) : null;
  const cards = [...root.querySelectorAll<HTMLElement>(".cap-system-map-card[data-id]")];
  const byId = new Map(cards.map((c) => [c.dataset.id!, c]));
  const nameOf = (c: HTMLElement) => c.querySelector(".cap-system-map-card-name")?.textContent ?? c.dataset.id!;
  const light = (id: string | null) => {
    const from = id ? byId.get(id) : undefined;
    if ((root.dataset.lit ?? null) === (from ? id : null)) return;
    for (const c of cards) {
      c.removeAttribute("data-tie");
      const tie = c.querySelector<HTMLElement>(".cap-system-map-card-tie");
      if (tie) tie.textContent = "";
    }
    if (!from) {
      delete root.dataset.lit;
      lines?.light(null);
      return;
    }
    root.dataset.lit = id!;
    lines?.light((a, b) => a === id || b === id);
    from.dataset.tie = "self";
    const name = nameOf(from);
    const uses = new Set(ids(from.dataset.uses));
    const usedBy = new Set(ids(from.dataset.usedBy));
    for (const other of new Set([...uses, ...usedBy])) {
      const c = byId.get(other);
      if (!c) continue;
      const both = uses.has(other) && usedBy.has(other);
      c.dataset.tie = both ? "both" : uses.has(other) ? "used" : "user";
      const tie = c.querySelector<HTMLElement>(".cap-system-map-card-tie");
      if (tie) tie.textContent = both ? `Uses and used by ${name}` : uses.has(other) ? `Used by ${name}` : `Uses ${name}`;
    }
  };
  const cardOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>(".cap-system-map-card[data-id]") : null);
  root.addEventListener("pointerover", (ev) => {
    if ((ev as PointerEvent).pointerType !== "mouse") return;
    const c = cardOf(ev.target);
    if (c) light(c.dataset.id!);
  }, { signal });
  root.addEventListener("pointerleave", () => light(cardOf(document.activeElement)?.dataset.id ?? null), { signal });
  root.addEventListener("focusin", (ev) => light(cardOf(ev.target)?.dataset.id ?? null), { signal });
  root.addEventListener("focusout", (ev) => {
    if (!root.contains((ev as FocusEvent).relatedTarget as Node | null)) light(null);
  }, { signal });
  return { light, clear: () => light(null) };
}

/**
 * A system's flows: Back and Next step the flow, the step's parts are lit (`data-lit`, the part it
 * moves toward also `data-at`), the rest dim, and the step is `aria-current="step"`. The status
 * line says where it is. Escape stops.
 */
function flows(root: HTMLElement, signal: AbortSignal, lines: Wires | null) {
  const sections = new Map([...root.querySelectorAll<HTMLElement>(".cap-system-map-flow[data-flow]")].map((s) => [s.dataset.flow!, s]));
  const parts = [...root.querySelectorAll<HTMLElement>(".cap-system-map-part[data-id]")];
  const send = (id: string | null, step: number) => root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id, step } }));
  const stepsOf = (s: HTMLElement) => [...s.querySelectorAll<HTMLElement>(".cap-system-map-steps > li")];
  const draw = (id: string | null, n: number) => {
    for (const p of parts) {
      p.removeAttribute("data-lit");
      p.removeAttribute("data-at");
    }
    for (const [fid, s] of sections) {
      const steps = stepsOf(s);
      steps.forEach((li, i) => (fid === id && i + 1 === n ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current")));
      const on = fid === id;
      const back = s.querySelector<HTMLButtonElement>("[data-cap-part='back']")!;
      const next = s.querySelector<HTMLButtonElement>("[data-cap-part='next']")!;
      back.disabled = !on || n <= 1;
      next.disabled = on && n >= steps.length;
      next.textContent = on ? "Next" : "Start";
      const status = s.querySelector<HTMLElement>(".cap-system-map-flow-status")!;
      status.textContent = on ? `${stepText(n, steps.length)}: ${steps[n - 1]?.textContent ?? ""}` : "";
      if (!on) continue;
      const li = steps[n - 1];
      const lights = new Set(ids(li?.dataset.lights));
      for (const p of parts) {
        if (!lights.has(p.dataset.id!)) continue;
        p.setAttribute("data-lit", "");
        if (p.dataset.id === li?.dataset.toward) p.setAttribute("data-at", "");
      }
    }
    const lit = new Set(parts.filter((p) => p.hasAttribute("data-lit")).map((p) => p.dataset.id!));
    lines?.light(lit.size ? (a, b) => lit.has(a) && lit.has(b) : null);
    if (id) {
      root.dataset.flow = id;
      root.dataset.step = String(n);
    } else {
      delete root.dataset.flow;
      delete root.dataset.step;
    }
  };
  const playFlow = (id: string, n = 1) => {
    const s = sections.get(id);
    if (!s) return;
    const k = Math.min(Math.max(1, Math.round(n)), stepsOf(s).length);
    if (root.dataset.flow === id && root.dataset.step === String(k)) return;
    draw(id, k);
    send(id, k);
  };
  const stopFlow = () => {
    if (!root.dataset.flow) return;
    draw(null, 0);
    send(null, 0);
  };
  const step = (n: number) => {
    if (root.dataset.flow) playFlow(root.dataset.flow, n);
  };
  for (const [id, s] of sections) {
    s.querySelector<HTMLElement>("[data-cap-part='controls']")!.hidden = false;
    const back = s.querySelector<HTMLButtonElement>("[data-cap-part='back']")!;
    const next = s.querySelector<HTMLButtonElement>("[data-cap-part='next']")!;
    const current = () => (root.dataset.flow === id ? Number(root.dataset.step) : 0);
    back.addEventListener("click", () => playFlow(id, current() - 1), { signal });
    next.addEventListener("click", () => {
      playFlow(id, current() + 1);
      // At the last step Next is disabled, so focus stays in the controls, on Back.
      if (next.disabled) back.focus();
    }, { signal });
    s.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && root.dataset.flow === id) {
        stopFlow();
        next.focus();
      }
    }, { signal });
  }
  // A page delivered at a step (systemMapHtml's `flow`) starts there.
  const given = root.dataset.flow;
  draw(given && sections.has(given) ? given : null, Number(root.dataset.step) || 0);
  return { playFlow, step, stopFlow };
}

/**
 * A system's wires: its users, its parts (what runs, what stores, what is outside) and what it
 * uses stand in five lanes side by side where there is room. Pointing at a tie or a part, or
 * focusing a tie, lights its wires.
 */
function systemWires(root: HTMLElement, signal: AbortSignal): Wires | null {
  const host = root.querySelector<HTMLElement>(".cap-system-map-columns");
  if (!host) return null;
  const lanes = () =>
    [...host.querySelectorAll<HTMLElement>(".cap-system-map-column[data-column='used-by'], .cap-system-map-place, .cap-system-map-column[data-column='uses']")].sort(
      (x, y) => x.getBoundingClientRect().left - y.getBoundingClientRect().left,
    );
  const lines = wires(host, lanes, signal);
  let held: string | null = null;
  const nodeOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-wire]") : null);
  const hold = (key: string | null) => {
    if (key === held) return;
    held = key;
    root.toggleAttribute("data-held", !!key);
    if (key) lines.light((a, b) => a === key || b === key);
    // Letting go returns to the flow's step, when one is shown.
    else {
      const lit = new Set([...root.querySelectorAll<HTMLElement>(".cap-system-map-part[data-lit]")].map((p) => p.dataset.id!));
      lines.light(lit.size ? (a, b) => lit.has(a) && lit.has(b) : null);
    }
  };
  host.addEventListener("pointerover", (ev) => {
    if ((ev as PointerEvent).pointerType === "mouse") hold(nodeOf(ev.target)?.dataset.wire ?? null);
  }, { signal });
  host.addEventListener("pointerleave", () => hold(nodeOf(document.activeElement)?.dataset.wire ?? null), { signal });
  host.addEventListener("focusin", (ev) => hold(nodeOf(ev.target)?.dataset.wire ?? null), { signal });
  host.addEventListener("focusout", (ev) => {
    if (!host.contains((ev as FocusEvent).relatedTarget as Node | null)) hold(null);
  }, { signal });
  return lines;
}

/** The map's behavior on one root; `enhance` calls it for every map on the page. */
export function controller(root: HTMLElement): SystemMapController {
  const ac = new AbortController();
  root.setAttribute(READY, "");
  const net = root.dataset.level === "network" ? network(root, ac.signal) : null;
  const fl = root.dataset.level === "system" ? flows(root, ac.signal, systemWires(root, ac.signal)) : null;
  return {
    light: (id) => net?.light(id),
    playFlow: (id, n) => fl?.playFlow(id, n),
    step: (n) => fl?.step(n),
    stopFlow: () => fl?.stopFlow(),
    destroy() {
      fl?.stopFlow();
      net?.clear();
      ac.abort();
      root.removeAttribute(READY);
    },
  };
}

/** Enhances every system map under `root` not yet enhanced; returns a function that detaches them. */
export function enhance(root: ParentNode = document): () => void {
  const made = [...root.querySelectorAll<HTMLElement>(`[data-cap="system-map"]:not([${READY}])`)].map((el) => controller(el));
  return () => {
    for (const m of made) m.destroy();
  };
}
