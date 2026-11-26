// The publish gate: one region beside the publish button that says whether this can go out, and if not, why.
// Failing checks first (required apart from advisory), each naming its cause; passing ones fold away; one row
// per destination carries its own state and button. Every row renders from data attributes, so the server's
// markup and this module's redraw are the same. Transitions and intents are in publish-transition.ts.
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { fail, say } from "../message/message.js";
import { attachRowList } from "../row-list/row-list.js";
import { enhance as enhanceTime } from "../time/time.js";
import { WORD, advisoryHeading, appliesTo, checkState, countChecks, describeGate, holdText, passedHeading, requiredHeading, siteDetail, siteState, } from "./publish-gate-model.js";
import { h, part, readCheck, readSite, renderActions, renderCheck, stateStatus, } from "./publish-gate-rows.js";
import { FIRST_PUBLICATION_NOTE, PUBLISH_CONFIRMED_INTENT } from "./publish-transition.js";
export { checkState, sortChecks, gateState, appliesTo, siteState, worstState, countChecks, requiredHeading, advisoryHeading, passedHeading, holdText, nameList, stateWord, describeGate, siteDetail, } from "./publish-gate-model.js";
export { FIRST_PUBLICATION_NOTE };
export { TONE, readCheck, readSite, stateStatus } from "./publish-gate-rows.js";
const READY = "data-cap-ready";
const hooksFor = new WeakMap();
export function attachPublishGate(region, hooks = {}) {
    hooksFor.set(region, hooks);
    const summary = part(region, "summary");
    const summaryId = summary?.id ?? "";
    const list = region.querySelector(".cap-gate-all");
    const detachRows = list ? attachRowList(list) : () => { };
    const busy = new Set();
    let previous = "";
    const sectionRows = (name) => region.querySelector(`.cap-gate-section[data-section='${name}'] .cap-gate-section-rows`);
    const checkRows = () => Array.from(region.querySelectorAll("li.cap-check"));
    const siteRows = () => Array.from(region.querySelectorAll("li.cap-gate-site"));
    // The containers that hold a destination's buttons: inside its row, or anywhere on the page
    // that names this gate and site (the editor bar's own publish button).
    const containers = (siteId) => {
        const all = Array.from(document.querySelectorAll("[data-cap-actions]")).filter((c) => c.dataset.site === siteId && (c.dataset.gate === region.id || region.contains(c)));
        return all;
    };
    const refresh = () => {
        const checks = checkRows();
        const sites = siteRows();
        const order = new Map(checks.map((li, i) => [li, Number(li.dataset.order ?? i)]));
        for (const li of checks) {
            if (!li.dataset.order)
                li.dataset.order = String(order.get(li));
            renderCheck(li, sites);
        }
        const targets = {
            failing: sectionRows("required"),
            advisory: sectionRows("advisory"),
            passed: sectionRows("passed"),
        };
        const bucket = { failing: [], advisory: [], passed: [] };
        for (const li of checks)
            bucket[checkState(readCheck(li))].push(li);
        for (const k of ["failing", "advisory", "passed"]) {
            const ul = targets[k];
            if (!ul)
                continue;
            const rows = bucket[k].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
            rows.forEach((li, i) => {
                if (ul.children[i] !== li)
                    ul.insertBefore(li, ul.children[i] ?? null);
            });
        }
        const data = checks.map(readCheck);
        const counts = countChecks(data);
        const setSection = (name, heading, shown) => {
            const sec = region.querySelector(`.cap-gate-section[data-section='${name}']`);
            if (!sec)
                return;
            sec.hidden = !shown;
            const t = sec.querySelector(".cap-gate-group-title");
            if (t && t.textContent !== heading)
                t.textContent = heading;
        };
        setSection("required", requiredHeading(counts.requiredFailing), counts.requiredFailing > 0);
        setSection("advisory", advisoryHeading(counts.advisoryFailing), counts.advisoryFailing > 0);
        const passedSec = region.querySelector(".cap-gate-section[data-section='passed']");
        if (passedSec) {
            passedSec.hidden = counts.passed === 0;
            const sum = passedSec.querySelector("summary");
            if (sum && sum.textContent !== passedHeading(counts.passed))
                sum.textContent = passedHeading(counts.passed);
        }
        const clear = part(region, "clear");
        if (clear)
            clear.hidden = counts.requiredFailing + counts.advisoryFailing > 0;
        const model = sites.map(readSite);
        for (const [i, li] of sites.entries()) {
            const site = model[i];
            const mine = data.filter((c) => appliesTo(c, site.id));
            const state = siteState(site, data);
            li.dataset.state = state;
            if (state === "blocked")
                li.dataset.tone = "crit";
            else
                delete li.dataset.tone;
            li.querySelector(".cap-row-status")?.replaceChildren(stateStatus(state));
            const detail = li.querySelector(".cap-row-detail");
            if (detail) {
                const failing = mine.filter((c) => c.required && !c.ok);
                const adv = mine.filter((c) => !c.required && !c.ok).length;
                detail.textContent = siteDetail(state, failing, adv, site);
            }
            const meta = li.querySelector(".cap-row-meta");
            if (meta) {
                meta.replaceChildren();
                if (state === "published" && site.published) {
                    const t = h("time", "cap-time");
                    t.dataset.cap = "time";
                    t.dataset.format = "exact";
                    t.dateTime = site.published.at;
                    t.textContent = site.published.at;
                    meta.append(t);
                    enhanceTime(meta);
                }
            }
            renderActions(containers(site.id), site, state, busy.has(site.id), summaryId);
        }
        const reading = describeGate(model, data);
        region.dataset.state = reading.state;
        if (summary) {
            // Only a changed sentence is written, so a polite region does not repeat itself.
            const words = `${WORD[reading.state]}${reading.rest}`;
            if (summary.textContent !== words)
                summary.replaceChildren(stateStatus(reading.state), reading.rest);
        }
        if (previous && previous !== reading.state)
            region.dispatchEvent(new CustomEvent("cap:gate-state", {
                bubbles: true,
                detail: {
                    state: reading.state,
                    sites: Object.fromEntries(sites.map((li) => [li.dataset.site, li.dataset.state])),
                },
            }));
        previous = reading.state;
    };
    // The page's message region says results, with Undo; the summary is itself polite and live.
    const announce = (text, undo, undone) => {
        if (!document.querySelector("[data-cap='message']"))
            return;
        say(text, undo ? { undo, undone } : {});
    };
    const problem = (text) => {
        if (document.querySelector("[data-cap='message']"))
            fail(text);
    };
    const setBusy = (id, on) => {
        if (on)
            busy.add(id);
        else
            busy.delete(id);
        refresh();
    };
    const siteRow = (id) => siteRows().find((r) => r.dataset.site === id);
    const setPublished = (id, p) => {
        const li = siteRow(id);
        if (!li)
            return;
        if (p) {
            li.dataset.publishedAt = p.at;
            li.dataset.publishedUrl = p.url;
            delete li.dataset.first;
        }
        else {
            delete li.dataset.publishedAt;
            delete li.dataset.publishedUrl;
        }
        refresh();
    };
    const setHold = (id, hold) => {
        const li = siteRow(id);
        if (!li)
            return;
        if (hold) {
            li.dataset.holdText = holdText(hold);
            if (hold.note)
                li.dataset.holdNote = hold.note;
            else
                delete li.dataset.holdNote;
        }
        else {
            delete li.dataset.holdText;
            delete li.dataset.holdNote;
        }
        refresh();
    };
    const setCheck = (id, patch) => {
        const li = checkRows().find((r) => r.dataset.check === id);
        if (!li)
            return;
        li.dataset.ok = String(patch.ok);
        if (patch.cause !== undefined)
            li.dataset.cause = patch.cause;
        refresh();
    };
    const run = async (site, button) => {
        const hk = hooksFor.get(region) ?? {};
        const form = button?.form;
        if (!hk.publish && form && button instanceof HTMLButtonElement) {
            // No script hook: the form posts as it would without JavaScript, with the confirmed intent.
            button.value = site.first ? PUBLISH_CONFIRMED_INTENT : "publish";
            form.requestSubmit(button);
            return;
        }
        setBusy(site.id, true);
        try {
            await hk.publish?.([site.id]);
        }
        catch (err) {
            setBusy(site.id, false);
            problem(`Could not publish to ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
            (button?.isConnected
                ? button
                : containers(site.id)[0]?.querySelector("button"))?.focus();
            return;
        }
        busy.delete(site.id);
        setPublished(site.id, {
            at: new Date().toISOString(),
            url: siteRow(site.id)?.dataset.liveUrl ?? "#",
        });
        announce(`Published to ${site.name}.`);
        containers(site.id)[0]?.querySelector("a, button")?.focus();
    };
    const publish = async (id, button) => {
        const li = siteRow(id);
        if (!li || busy.has(id))
            return;
        const site = readSite(li);
        if (site.first) {
            // One-way for a first publication: previewed, with the destination listed, focus on Cancel.
            await confirm({
                title: `Publish to ${site.name}?`,
                body: [`${site.name}: ${FIRST_PUBLICATION_NOTE}`],
                action: `Publish to ${site.name}`,
                returnTo: button,
                perform: async () => {
                    await run(site, button);
                },
            });
            return;
        }
        await run(site, button);
    };
    const unpublish = async (id) => {
        const li = siteRow(id);
        if (!li || busy.has(id))
            return;
        const site = readSite(li);
        const hk = hooksFor.get(region) ?? {};
        const was = site.published;
        busy.add(id);
        try {
            await hk.unpublish?.([id]);
        }
        catch (err) {
            return problem(`Could not unpublish from ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            busy.delete(id);
        }
        setPublished(id, null);
        containers(id)[0]?.querySelector("button")?.focus();
        announce(`Unpublished from ${site.name}.`, async () => {
            await hk.publish?.([id]);
            if (was)
                setPublished(id, was);
        }, `Published to ${site.name} again.`);
    };
    const onClick = (e) => {
        const btn = e.target.closest("[data-cap-part='publish'], [data-cap-part='unpublish']");
        if (!btn)
            return;
        const box = btn.closest("[data-cap-actions]");
        if (!box || !(box.dataset.gate === region.id || region.contains(box)))
            return;
        const id = box.dataset.site ?? "";
        if (btn.dataset.capPart === "unpublish")
            return void unpublish(id);
        // A blocked or held button is focusable so its reason can be heard; pressing it does nothing.
        if (btn.getAttribute("aria-disabled") === "true") {
            e.preventDefault();
            return;
        }
        const li = siteRow(id);
        const hk = hooksFor.get(region) ?? {};
        // With no hook and a form, a republication posts natively; a first one is previewed first.
        if (!hk.publish &&
            btn instanceof HTMLButtonElement &&
            btn.form &&
            li &&
            !li.hasAttribute("data-first"))
            return;
        e.preventDefault();
        void publish(id, btn);
    };
    document.addEventListener("click", onClick);
    // Any change to a check, a hold or a publication redraws; an app only flips the data.
    const mo = new MutationObserver(() => refresh());
    mo.observe(region, {
        subtree: true,
        attributes: true,
        attributeFilter: [
            "data-ok",
            "data-cause",
            "data-hold-text",
            "data-hold-note",
            "data-published-at",
            "data-published-url",
        ],
    });
    refresh();
    return {
        refresh,
        setCheck,
        setHold,
        setPublished,
        detach() {
            document.removeEventListener("click", onClick);
            mo.disconnect();
            detachRows();
            hooksFor.delete(region);
            region.removeAttribute(READY);
        },
    };
}
// Attaches to every [data-cap="publish-gate"] under root. Hooks say what publish and unpublish do; without them
// a publish button inside a form posts the form, and a first publication is previewed first.
export function enhance(root = document, hooks) {
    const handles = [];
    for (const el of root.querySelectorAll("[data-cap='publish-gate']:not([data-cap-ready])")) {
        el.setAttribute(READY, "");
        handles.push(attachPublishGate(el, hooks));
    }
    return () => handles.forEach((hd) => hd.detach());
}
