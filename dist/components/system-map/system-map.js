// The system map: a network of systems as cards, and one system with its users, its parts and
// what it uses (capsid/rulings/system-explorer-2026-10-10.md, answer 9: one component for
// dustinedwards.info /systems and the Capsid explorer; the card design replaced the capsid drawing
// on 2026-11-03).
//
// `systemMapHtml` renders the whole contract as a string, so a server or a static build delivers
// it, complete with no script. `enhance` adds what needs a script: on the network, hovering over or
// focusing a card lights what it uses and what uses it and dims the rest; on a system, Back and
// Next step a flow, lighting the parts each step touches. No framework, no storage.
import { stepText } from "./system-map-data.js";
export { modelMapData, tiesOf, flowsOver, ownerOf, placeOf, verbOf, count, stepText, VERB, STORE_KINDS, EXTERNAL } from "./system-map-data.js";
export { escapeHtml, systemMapHtml } from "./system-map-html.js";
const READY = "data-cap-ready";
const ids = (v) => (v ?? "").split(" ").filter(Boolean);
/**
 * The network: a card under the pointer or with focus lights its ties. Each lit card says how it
 * is tied in a word line (the tint is never the only sign), the card itself gets a heavier edge,
 * and every other card dims.
 */
function network(root, signal) {
    const cards = [...root.querySelectorAll(".cap-system-map-card[data-id]")];
    const byId = new Map(cards.map((c) => [c.dataset.id, c]));
    const nameOf = (c) => c.querySelector(".cap-system-map-card-name")?.textContent ?? c.dataset.id;
    const light = (id) => {
        const from = id ? byId.get(id) : undefined;
        if ((root.dataset.lit ?? null) === (from ? id : null))
            return;
        for (const c of cards) {
            c.removeAttribute("data-tie");
            const tie = c.querySelector(".cap-system-map-card-tie");
            if (tie)
                tie.textContent = "";
        }
        if (!from) {
            delete root.dataset.lit;
            return;
        }
        root.dataset.lit = id;
        from.dataset.tie = "self";
        const name = nameOf(from);
        const uses = new Set(ids(from.dataset.uses));
        const usedBy = new Set(ids(from.dataset.usedBy));
        for (const other of new Set([...uses, ...usedBy])) {
            const c = byId.get(other);
            if (!c)
                continue;
            const both = uses.has(other) && usedBy.has(other);
            c.dataset.tie = both ? "both" : uses.has(other) ? "used" : "user";
            const tie = c.querySelector(".cap-system-map-card-tie");
            if (tie)
                tie.textContent = both ? `Uses and used by ${name}` : uses.has(other) ? `Used by ${name}` : `Uses ${name}`;
        }
    };
    const cardOf = (t) => (t instanceof Element ? t.closest(".cap-system-map-card[data-id]") : null);
    root.addEventListener("pointerover", (ev) => {
        if (ev.pointerType !== "mouse")
            return;
        const c = cardOf(ev.target);
        if (c)
            light(c.dataset.id);
    }, { signal });
    root.addEventListener("pointerleave", () => light(cardOf(document.activeElement)?.dataset.id ?? null), { signal });
    root.addEventListener("focusin", (ev) => light(cardOf(ev.target)?.dataset.id ?? null), { signal });
    root.addEventListener("focusout", (ev) => {
        if (!root.contains(ev.relatedTarget))
            light(null);
    }, { signal });
    return { light, clear: () => light(null) };
}
/**
 * A system's flows: Back and Next step the flow, the step's parts are lit (`data-lit`, the part it
 * moves toward also `data-at`), the rest dim, and the step is `aria-current="step"`. The status
 * line says where it is. Escape stops.
 */
function flows(root, signal) {
    const sections = new Map([...root.querySelectorAll(".cap-system-map-flow[data-flow]")].map((s) => [s.dataset.flow, s]));
    const parts = [...root.querySelectorAll(".cap-system-map-part[data-id]")];
    const send = (id, step) => root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id, step } }));
    const stepsOf = (s) => [...s.querySelectorAll(".cap-system-map-steps > li")];
    const draw = (id, n) => {
        for (const p of parts) {
            p.removeAttribute("data-lit");
            p.removeAttribute("data-at");
        }
        for (const [fid, s] of sections) {
            const steps = stepsOf(s);
            steps.forEach((li, i) => (fid === id && i + 1 === n ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current")));
            const on = fid === id;
            const back = s.querySelector("[data-cap-part='back']");
            const next = s.querySelector("[data-cap-part='next']");
            back.disabled = !on || n <= 1;
            next.disabled = on && n >= steps.length;
            next.textContent = on ? "Next" : "Start";
            const status = s.querySelector(".cap-system-map-flow-status");
            status.textContent = on ? `${stepText(n, steps.length)}: ${steps[n - 1]?.textContent ?? ""}` : "";
            if (!on)
                continue;
            const li = steps[n - 1];
            const lights = new Set(ids(li?.dataset.lights));
            for (const p of parts) {
                if (!lights.has(p.dataset.id))
                    continue;
                p.setAttribute("data-lit", "");
                if (p.dataset.id === li?.dataset.toward)
                    p.setAttribute("data-at", "");
            }
        }
        if (id) {
            root.dataset.flow = id;
            root.dataset.step = String(n);
        }
        else {
            delete root.dataset.flow;
            delete root.dataset.step;
        }
    };
    const playFlow = (id, n = 1) => {
        const s = sections.get(id);
        if (!s)
            return;
        const k = Math.min(Math.max(1, Math.round(n)), stepsOf(s).length);
        if (root.dataset.flow === id && root.dataset.step === String(k))
            return;
        draw(id, k);
        send(id, k);
    };
    const stopFlow = () => {
        if (!root.dataset.flow)
            return;
        draw(null, 0);
        send(null, 0);
    };
    const step = (n) => {
        if (root.dataset.flow)
            playFlow(root.dataset.flow, n);
    };
    for (const [id, s] of sections) {
        s.querySelector("[data-cap-part='controls']").hidden = false;
        const back = s.querySelector("[data-cap-part='back']");
        const next = s.querySelector("[data-cap-part='next']");
        const current = () => (root.dataset.flow === id ? Number(root.dataset.step) : 0);
        back.addEventListener("click", () => playFlow(id, current() - 1), { signal });
        next.addEventListener("click", () => {
            playFlow(id, current() + 1);
            // At the last step Next is disabled, so focus stays in the controls, on Back.
            if (next.disabled)
                back.focus();
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
/** The map's behavior on one root; `enhance` calls it for every map on the page. */
export function controller(root) {
    const ac = new AbortController();
    root.setAttribute(READY, "");
    const net = root.dataset.level === "network" ? network(root, ac.signal) : null;
    const fl = root.dataset.level === "system" ? flows(root, ac.signal) : null;
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
export function enhance(root = document) {
    const made = [...root.querySelectorAll(`[data-cap="system-map"]:not([${READY}])`)].map((el) => controller(el));
    return () => {
        for (const m of made)
            m.destroy();
    };
}
