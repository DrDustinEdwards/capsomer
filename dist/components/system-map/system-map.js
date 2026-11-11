// The system map: a network of systems as cards, and one system with its users, its parts and
// what it uses (capsid/rulings/system-explorer-2026-10-10.md, answer 9: one component for
// dustinedwards.info /systems and the Capsid explorer; the card design replaced the capsid drawing
// on 2026-11-03).
//
// `systemMapHtml` renders the whole contract as a string, so a server or a static build delivers
// it, complete with no script. `enhance` adds what needs a script: on the network, hovering over or
// focusing a card lights what it uses and what uses it and dims the rest; on a system, Back and
// Next step a flow, lighting the parts each step touches. No framework, no storage.
import { enhance as enhanceTabs, select } from "../tabs/tabs.js";
import { stepText } from "./system-map-data.js";
import { wires } from "./system-map-wires.js";
export { modelMapData, networkLayout, tiePairs, tiesOf, flowsOver, ownerOf, placeOf, verbOf, count, stepText, VERB, STORE_KINDS, EXTERNAL, } from "./system-map-data.js";
export { systemMapHtml } from "./system-map-html.js";
export { hexLayout } from "./system-map-hex.js";
const READY = "data-cap-ready";
const ids = (v) => (v ?? "").split(" ").filter(Boolean);
/**
 * The network: a card under the pointer or with focus lights its ties. Each lit card says how it
 * is tied in a word line (the tint is never the only sign), the card itself gets a heavier edge,
 * and every other card dims.
 */
function network(root, signal) {
    const graph = root.querySelector(".cap-system-map-graph");
    const lines = graph
        ? wires(graph, () => [...graph.querySelectorAll(".cap-system-map-lane")], signal)
        : null;
    const cards = [...root.querySelectorAll(".cap-system-map-card[data-id]")];
    // The detail line: the lit system's words, which its small card keeps for screen readers alone.
    const detail = root.querySelector("[data-cap-part='detail']");
    const rest = "Point at a system, or tab to it, to see what it is and light its ties.";
    if (detail) {
        detail.hidden = false;
        detail.textContent = rest;
    }
    const shortName = (id) => byId.get(id)?.querySelector(".cap-system-map-card-name")?.textContent ?? id;
    const tell = (c) => {
        if (!detail)
            return;
        const about = c?.querySelector(".cap-system-map-card-about");
        if (!c || !about) {
            detail.textContent = rest;
            return;
        }
        // Which way each tie runs, in words: the lines' moving dashes show it too.
        const list = (v) => ids(v).map(shortName).join(", ");
        const ways = [
            c.dataset.uses ? `Uses ${list(c.dataset.uses)}.` : "",
            c.dataset.usedBy ? `Used by ${list(c.dataset.usedBy)}.` : "",
        ]
            .filter(Boolean)
            .join(" ");
        const span = document.createElement("span");
        span.className = "cap-system-map-detail-ways";
        span.textContent = ways;
        detail.replaceChildren(...[...about.childNodes].map((n) => n.cloneNode(true)), ...(ways ? [". ", span] : []));
    };
    const byId = new Map(cards.map((c) => [c.dataset.id, c]));
    // The hexagons: each system's cell, and the comb's lines, lit with the cards.
    const comb = root.querySelector(".cap-system-map-comb");
    const cells = new Map([...root.querySelectorAll(".cap-system-map-cell[data-id]")].map((c) => [
        c.getAttribute("data-id"),
        c,
    ]));
    const combLines = comb ? [...comb.querySelectorAll(".cap-system-map-wire")] : [];
    const lightComb = (id, ties) => {
        comb?.toggleAttribute("data-lit", !!id);
        for (const [cid, c] of cells) {
            const t = ties.get(cid);
            if (t)
                c.setAttribute("data-tie", t);
            else
                c.removeAttribute("data-tie");
        }
        // A lit line runs from the system that uses to the one it uses (its data-a to its data-b), so
        // its dashes move that way; a tie both ways stays still. The detail line says it in words.
        for (const l of combLines) {
            const on = !!id && (l.dataset.a === id || l.dataset.b === id);
            l.toggleAttribute("data-on", on);
            l.toggleAttribute("data-both", on && ties.get(l.dataset.a === id ? l.dataset.b : l.dataset.a) === "both");
            if (on)
                l.parentNode?.append(l);
        }
    };
    // The two views are tabs (components/tabs), the hexagons chosen first. Where the map is too
    // narrow for the hexagons' words, the plain map shows alone and the tab list goes (the CSS).
    const views = root.querySelector(".cap-system-map-views");
    const hexTab = views?.querySelector("[role='tab']");
    if (views && hexTab) {
        views.querySelector("[role='tablist']").hidden = false;
        const tabs = [...views.querySelectorAll("[role='tab']")];
        let chosen = hexTab;
        let narrow = false;
        // Narrow: the plain map is chosen for the reader (the hexagons and the tab list are hidden by
        // the CSS); wide again, their own choice comes back.
        const fit = () => {
            const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            narrow = root.getBoundingClientRect().width < 44 * rem;
            select(views, narrow ? tabs[tabs.length - 1] : chosen, { silent: true });
        };
        views.addEventListener("cap:tabs-change", (e) => {
            if (!narrow)
                chosen = e.detail.tab;
        }, { signal });
        const ro = new ResizeObserver(fit);
        ro.observe(root);
        signal.addEventListener("abort", () => ro.disconnect());
        fit();
        const undo = enhanceTabs(root);
        signal.addEventListener("abort", undo);
    }
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
        tell(from);
        if (!from) {
            delete root.dataset.lit;
            lines?.light(null);
            lightComb(null, new Map());
            return;
        }
        root.dataset.lit = id;
        lines?.light((a, b) => a === id || b === id);
        from.dataset.tie = "self";
        const name = nameOf(from);
        const uses = new Set(ids(from.dataset.uses));
        const usedBy = new Set(ids(from.dataset.usedBy));
        const ties = new Map([[id, "self"]]);
        for (const other of new Set([...uses, ...usedBy])) {
            const both = uses.has(other) && usedBy.has(other);
            ties.set(other, both ? "both" : uses.has(other) ? "used" : "user");
            const c = byId.get(other);
            if (!c)
                continue;
            c.dataset.tie = ties.get(other);
            const tie = c.querySelector(".cap-system-map-card-tie");
            if (tie)
                tie.textContent = both
                    ? `Uses and used by ${name}`
                    : uses.has(other)
                        ? `Used by ${name}`
                        : `Uses ${name}`;
        }
        lightComb(id, ties);
    };
    const cardOf = (t) => t instanceof Element
        ? t.closest(".cap-system-map-card[data-id], .cap-system-map-cell[data-id]")
        : null;
    root.addEventListener("pointerover", (ev) => {
        if (ev.pointerType !== "mouse")
            return;
        const c = cardOf(ev.target);
        if (c)
            light(c.getAttribute("data-id"));
    }, { signal });
    root.addEventListener("pointerleave", () => light(cardOf(document.activeElement)?.getAttribute("data-id") ?? null), { signal });
    root.addEventListener("focusin", (ev) => light(cardOf(ev.target)?.getAttribute("data-id") ?? null), { signal });
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
function flows(root, signal, lines) {
    const sections = new Map([...root.querySelectorAll(".cap-system-map-flow[data-flow]")].map((s) => [
        s.dataset.flow,
        s,
    ]));
    const parts = [...root.querySelectorAll(".cap-system-map-part[data-id]")];
    const send = (id, step) => root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id, step } }));
    const stepsOf = (s) => [
        ...s.querySelectorAll(".cap-system-map-steps > li"),
    ];
    const draw = (id, n) => {
        for (const p of parts) {
            p.removeAttribute("data-lit");
            p.removeAttribute("data-at");
        }
        for (const [fid, s] of sections) {
            const steps = stepsOf(s);
            steps.forEach((li, i) => fid === id && i + 1 === n
                ? li.setAttribute("aria-current", "step")
                : li.removeAttribute("aria-current"));
            const on = fid === id;
            const back = s.querySelector("[data-cap-part='back']");
            const next = s.querySelector("[data-cap-part='next']");
            back.disabled = !on || n <= 1;
            next.disabled = on && n >= steps.length;
            next.textContent = on ? "Next" : "Start";
            const status = s.querySelector(".cap-system-map-flow-status");
            status.textContent = on
                ? `${stepText(n, steps.length)}: ${steps[n - 1]?.textContent ?? ""}`
                : "";
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
        const lit = new Set(parts.filter((p) => p.hasAttribute("data-lit")).map((p) => p.dataset.id));
        lines?.light(lit.size ? (a, b) => lit.has(a) && lit.has(b) : null);
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
/**
 * A system's wires: its users, its parts (what runs, what stores, what is outside) and what it
 * uses stand in five lanes side by side where there is room. Pointing at a tie or a part, or
 * focusing a tie, lights its wires.
 */
function systemWires(root, signal) {
    const host = root.querySelector(".cap-system-map-columns");
    if (!host)
        return null;
    const lanes = () => [
        ...host.querySelectorAll(".cap-system-map-column[data-column='used-by'], .cap-system-map-place, .cap-system-map-column[data-column='uses']"),
    ].sort((x, y) => x.getBoundingClientRect().left - y.getBoundingClientRect().left);
    const lines = wires(host, lanes, signal);
    // The detail line: what a part held is for and its lines in words, which its small box keeps for
    // screen readers alone.
    const detail = root.querySelector("[data-cap-part='detail']");
    const rest = "Point at a part, or tab to it, to see what it does and light its wires.";
    if (detail) {
        detail.hidden = false;
        detail.textContent = rest;
    }
    let held = null;
    const nodeOf = (t) => t instanceof Element ? t.closest("[data-wire]") : null;
    const hold = (key) => {
        if (key === held)
            return;
        held = key;
        root.toggleAttribute("data-held", !!key);
        const about = key
            ? host.querySelector(`[data-wire="${CSS.escape(key)}"] .cap-system-map-part-about`)
            : null;
        if (detail) {
            if (about)
                detail.replaceChildren(...[...about.childNodes].map((n) => n.cloneNode(true)));
            else
                detail.textContent = rest;
        }
        if (key)
            lines.light((a, b) => a === key || b === key);
        // Letting go returns to the flow's step, when one is shown.
        else {
            const lit = new Set([...root.querySelectorAll(".cap-system-map-part[data-lit]")].map((p) => p.dataset.id));
            lines.light(lit.size ? (a, b) => lit.has(a) && lit.has(b) : null);
        }
    };
    host.addEventListener("pointerover", (ev) => {
        if (ev.pointerType === "mouse")
            hold(nodeOf(ev.target)?.dataset.wire ?? null);
    }, { signal });
    host.addEventListener("pointerleave", () => hold(nodeOf(document.activeElement)?.dataset.wire ?? null), { signal });
    host.addEventListener("focusin", (ev) => hold(nodeOf(ev.target)?.dataset.wire ?? null), {
        signal,
    });
    host.addEventListener("focusout", (ev) => {
        if (!host.contains(ev.relatedTarget))
            hold(null);
    }, { signal });
    return lines;
}
/** The map's behavior on one root; `enhance` calls it for every map on the page. */
export function controller(root) {
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
export function enhance(root = document) {
    const made = [
        ...root.querySelectorAll(`[data-cap="system-map"]:not([${READY}])`),
    ].map((el) => controller(el));
    return () => {
        for (const m of made)
            m.destroy();
    };
}
