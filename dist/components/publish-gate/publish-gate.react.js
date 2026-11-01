import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { fail as plainFail, say as plainSay } from "../message/message.js";
import { attachRowList } from "../row-list/row-list.js";
import { Glyph } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { FIRST_PUBLICATION_NOTE, appliesTo, checkState, countChecks, advisoryHeading, describeGate, holdText, passedHeading, requiredHeading, siteDetail, siteState, stateWord } from "./publish-gate.js";
const TONE = { blocked: "crit", held: "info", ready: "ok", published: "ok" };
function StateStatus({ state }) {
    return (_jsxs("span", { className: "cap-status", "data-tone": TONE[state], children: [_jsx(Glyph, { name: TONE[state] }), stateWord(state)] }));
}
// The paired publish control for one destination: Publish, Publishing..., Publish blocked,
// Publish held, or, once published, View and Unpublish.
export function PublishButton({ gateId, site, state, busy = false, summaryId, named = false, size = "sm", onPublish, onUnpublish }) {
    const suffix = named ? `, ${site.name}` : undefined;
    const sz = size === "sm" ? "sm" : undefined;
    if (state === "published" && site.published) {
        return (_jsxs("div", { "data-cap-actions": "", "data-gate": gateId, "data-site": site.id, "data-site-label": named ? site.name : undefined, "data-btn-size": size === "default" ? "default" : undefined, children: [_jsx("a", { className: "cap-btn", "data-cap-part": "view", "data-size": sz, "aria-label": suffix ? `View live page${suffix}` : undefined, href: site.published.url, children: "View" }), _jsx("button", { type: "button", className: "cap-btn", "data-cap-part": "unpublish", "data-size": sz, "data-variant": "quiet", "data-site": site.id, "aria-label": suffix ? `Unpublish${suffix}` : undefined, onClick: onUnpublish, children: "Unpublish" })] }));
    }
    const ready = state === "ready" && !busy;
    const label = busy ? "Publishing..." : state === "blocked" ? "Publish blocked" : state === "held" ? "Publish held" : "Publish";
    return (_jsx("div", { "data-cap-actions": "", "data-gate": gateId, "data-site": site.id, "data-site-label": named ? site.name : undefined, "data-btn-size": size === "default" ? "default" : undefined, children: _jsx("button", { type: "submit", name: "intent", value: "publish", className: "cap-btn", "data-cap-part": "publish", "data-size": sz, "data-site": site.id, "data-variant": ready || busy ? "primary" : "secondary", "aria-disabled": ready ? undefined : true, "aria-busy": busy ? true : undefined, "aria-describedby": ready ? undefined : summaryId, "aria-label": suffix ? `${label}${suffix}` : undefined, onClick: (e) => {
                // A blocked or held button stays focusable so its reason is heard; pressing it does nothing.
                if (!ready)
                    return e.preventDefault();
                e.preventDefault();
                onPublish();
            }, children: label }) }));
}
// A first publication is one-way, so it is previewed in the shared confirm dialog, the destination
// listed and focus on Cancel; anything already public is published at once. For a page that
// places its own <PublishButton>.
export async function publishWithPreview(site, perform) {
    if (!site.first)
        return perform();
    await confirm({
        title: `Publish to ${site.name}?`,
        lead: "Publishing for the first time cannot be taken back quietly: it goes public at once.",
        body: [`${site.name}: ${FIRST_PUBLICATION_NOTE}`],
        action: `Publish to ${site.name}`,
        perform,
    });
}
// The gate as the doc page's markup describes it. Rendered from the checks and the destinations,
// so the summary cannot say Ready while a required check fails.
export function PublishGate({ label, sites, checks, publish, unpublish, actions = "rows", say = plainSay, fail = plainFail, primary = false, id, summaryId }) {
    const own = useId();
    const gateId = id ?? `${own}-gate`;
    const sumId = summaryId ?? `${gateId}-sum`;
    const [busy, setBusy] = useState([]);
    const rows = useRef(null);
    useEffect(() => (rows.current ? attachRowList(rows.current) : undefined), []);
    const reading = describeGate(sites, checks);
    const counts = countChecks(checks);
    const failingReq = checks.filter((c) => c.required && !c.ok);
    const failingAdv = checks.filter((c) => !c.required && !c.ok);
    const passed = checks.filter((c) => c.ok);
    const announce = (text, opts) => {
        if (document.querySelector("[data-cap='message']"))
            say(text, opts);
    };
    const problem = (text) => {
        if (document.querySelector("[data-cap='message']"))
            fail(text);
    };
    const run = async (site) => {
        setBusy((b) => [...b, site.id]);
        try {
            await publish?.([site.id]);
        }
        catch (err) {
            setBusy((b) => b.filter((x) => x !== site.id));
            problem(`Could not publish to ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
            return;
        }
        setBusy((b) => b.filter((x) => x !== site.id));
        announce(`Published to ${site.name}.`);
    };
    const onPublish = async (site) => {
        if (busy.includes(site.id))
            return;
        await publishWithPreview(site, () => run(site));
    };
    const onUnpublish = async (site) => {
        try {
            await unpublish?.([site.id]);
        }
        catch (err) {
            return problem(`Could not unpublish from ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
        announce(`Unpublished from ${site.name}.`, {
            undo: async () => {
                await publish?.([site.id]);
            },
            undone: `Published to ${site.name} again.`,
        });
    };
    const checkRow = (c) => {
        const i = checks.indexOf(c);
        const st = checkState(c);
        const rid = `${gateId}-c-${c.id}`;
        const words = c.ok ? (c.pass ?? `${c.name}: passing`) : c.cause;
        const siteName = c.site ? sites.find((s) => s.id === c.site)?.name : undefined;
        return (_jsxs("li", { className: "cap-row cap-check", id: rid, "data-check": c.id, "data-name": c.name, "data-required": c.required ? "" : undefined, "data-ok": String(c.ok), "data-cause": c.cause, "data-pass": c.pass, "data-href": c.href, "data-fix": c.fix, "data-site": c.site, "data-order": String(i), "data-tone": st === "failing" ? "crit" : undefined, children: [_jsx("span", { className: "cap-row-status", id: `${rid}-s`, children: _jsxs("span", { className: "cap-status", "data-tone": st === "failing" ? "crit" : st === "advisory" ? "warn" : "ok", children: [_jsx(Glyph, { name: st === "failing" ? "crit" : st === "advisory" ? "warn" : "ok" }), st === "failing" ? "Failing" : st === "advisory" ? "Advisory" : "Passed"] }) }), _jsx("div", { className: "cap-row-title", children: c.href ? (_jsx("a", { href: c.href, "aria-describedby": `${rid}-s ${rid}-d`, children: words })) : (_jsx("span", { className: "cap-gate-title-text", children: words })) }), _jsxs("p", { className: "cap-row-detail", id: `${rid}-d`, children: [_jsx("span", { className: "cap-check-name", children: c.name }), !c.ok && c.fix ? (_jsxs(_Fragment, { children: [". ", _jsxs("span", { className: "cap-check-fix", children: ["Fix: ", c.fix] })] })) : null] }), _jsx("span", { className: "cap-row-meta", children: siteName ? `on ${siteName}` : null })] }, c.id));
    };
    const section = (name, headId, heading, list, shown) => (_jsxs("li", { className: "cap-gate-section", "data-section": name, hidden: !shown, children: [_jsx("h3", { className: "cap-gate-group-title", id: headId, children: heading }), _jsx("ul", { className: "cap-gate-section-rows", role: "list", "aria-labelledby": headId, children: list.map(checkRow) })] }));
    const headingId = `${gateId}-h`;
    return (_jsxs("section", { className: "cap-gate", id: gateId, "data-state": reading.state, "aria-labelledby": headingId, children: [_jsxs("header", { className: "cap-gate-head", children: [_jsx("h2", { className: "cap-gate-title", id: headingId, children: label }), _jsxs("p", { className: "cap-gate-summary", id: sumId, role: "status", "aria-live": "polite", "aria-atomic": "true", "data-cap-part": "summary", children: [_jsx(StateStatus, { state: reading.state }), reading.rest] })] }), _jsxs("ul", { ref: rows, className: "cap-rows cap-gate-all", "data-cap": "row-list", role: "list", "aria-labelledby": headingId, "data-cap-primary": primary ? "" : undefined, children: [_jsxs("li", { className: "cap-gate-section", "data-section": "sites", children: [_jsx("h3", { className: "cap-gate-group-title", id: `${gateId}-g-sites`, children: sites.length === 1 ? "Destination" : "Destinations" }), _jsx("ul", { className: "cap-gate-section-rows", role: "list", "aria-labelledby": `${gateId}-g-sites`, children: reading.sites.map(({ site, state, failing }) => {
                                    const adv = checks.filter((c) => appliesTo(c, site.id) && !c.required && !c.ok).length;
                                    const sid = `${gateId}-s-${site.id}`;
                                    return (_jsxs("li", { className: "cap-row cap-gate-site", id: sid, "data-site": site.id, "data-name": site.name, "data-state": state, "data-first": site.first ? "" : undefined, "data-hold-text": site.hold ? holdText(site.hold) : undefined, "data-hold-note": site.hold?.note, "data-published-at": site.published?.at, "data-published-url": site.published?.url, "data-tone": state === "blocked" ? "crit" : undefined, children: [_jsx("span", { className: "cap-row-status", id: `${sid}-s`, children: _jsx(StateStatus, { state: state }) }), _jsx("div", { className: "cap-row-title", children: _jsx("span", { className: "cap-gate-site-name", children: site.name }) }), _jsx("p", { className: "cap-row-detail", id: `${sid}-d`, children: siteDetail(state, failing, adv, site) }), _jsx("span", { className: "cap-row-meta", children: state === "published" && site.published ? _jsx(Time, { at: site.published.at, format: "exact" }) : null }), actions === "rows" ? _jsx(PublishButton, { gateId: gateId, site: site, state: state, busy: busy.includes(site.id), summaryId: sumId, named: sites.length > 1, onPublish: () => void onPublish(site), onUnpublish: () => void onUnpublish(site) }) : null] }, site.id));
                                }) })] }), section("required", `${gateId}-g-req`, requiredHeading(counts.requiredFailing), failingReq, failingReq.length > 0), section("advisory", `${gateId}-g-adv`, advisoryHeading(counts.advisoryFailing), failingAdv, failingAdv.length > 0), _jsx("li", { className: "cap-gate-section", "data-section": "passed", hidden: passed.length === 0, children: _jsxs("details", { className: "cap-disclosure", children: [_jsx("summary", { children: passedHeading(counts.passed) }), _jsx("div", { className: "cap-disclosure-body", children: _jsx("ul", { className: "cap-gate-section-rows", role: "list", "aria-label": "Passing checks", children: passed.map(checkRow) }) })] }) })] }), _jsx("p", { className: "cap-gate-clear", "data-cap-part": "clear", hidden: failingReq.length + failingAdv.length > 0, children: "No checks are failing." })] }));
}
// The overall and per-destination states, for a page that places its own <PublishButton>.
export function gateStates(sites, checks) {
    const overall = describeGate(sites, checks).state;
    return { overall, sites: Object.fromEntries(sites.map((s) => [s.id, siteState(s, checks)])) };
}
