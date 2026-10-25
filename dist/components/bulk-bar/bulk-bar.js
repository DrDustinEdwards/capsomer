// The bulk action bar: what a selection can be done to, said where the selection is. It counts
// the selected items ("3 selected", a live status), offers the actions, and clears. A
// reversible action runs at once and offers Undo through the message region (`z` runs it); a
// destructive one previews every item in the shared confirm dialog and runs only when the
// person says so, with focus on Cancel. No framework; the React wrapper calls the same
// functions.
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { GLYPHS, fail, say } from "../message/message.js";
const READY = "data-cap-ready";
const SELECT = "input[type='checkbox'][data-cap-select]";
// "3 selected".
export function countText(n) {
    return `${n} selected`;
}
// "item" or "items" for a count; `noun` is the singular.
export function plural(n, noun, many) {
    return n === 1 ? noun : (many ?? `${noun}s`);
}
// Fills {n} and {s} in a template: "Bin {n} item{s}" gives "Bin 12 items" and "Bin 1 item".
export function fillCount(template, n) {
    return template.replace(/\{n\}/g, String(n)).replace(/\{s\}/g, n === 1 ? "" : "s");
}
// Every item of a destructive action, one line each, for the confirm dialog's list. The title
// carries the count; the list is not shortened, because a preview that hides items is not one.
export function previewItems(items) {
    return items.map((i) => i.label);
}
// The outcomes to list, refusals first: what needs the person comes before what is done.
export function orderOutcomes(outcomes) {
    return [...outcomes.filter((o) => !o.ok), ...outcomes.filter((o) => o.ok)];
}
// The outcome list's one line: "All 3 done.", "None done: 2 refused.", "2 done, 1 not done."
export function outcomeSummary(outcomes) {
    const done = outcomes.filter((o) => o.ok).length;
    const not = outcomes.length - done;
    if (not === 0)
        return done === 1 ? "Done." : `All ${done} done.`;
    if (done === 0)
        return not === 1 ? "Not done." : `None done: ${not} refused.`;
    return `${done} done, ${not} not done.`;
}
// Runs one bulk action the way the family does it. Resolves true when it ran, false when it was
// cancelled or failed. Reversible: at once, then a message with Undo. Destructive: a confirm
// dialog lists every item, "Bin 12 items" performs, focus starts on Cancel.
export async function performBulk(spec) {
    const n = spec.items.length;
    if (n === 0)
        return false;
    const verb = spec.action.charAt(0).toUpperCase() + spec.action.slice(1);
    if (spec.destructive) {
        const done = await confirm({
            title: fillCount(spec.confirmTitle ?? `${verb} {n} item{s}?`, n),
            lead: spec.confirmLead ? fillCount(spec.confirmLead, n) : undefined,
            body: previewItems(spec.items),
            action: fillCount(spec.confirmAction ?? `${verb} {n} item{s}`, n),
            returnTo: spec.returnTo,
            perform: async () => {
                await spec.run(spec.items, spec.value);
            },
        });
        if (done)
            say(fillCount(spec.said ?? `${verb}: {n} item{s}.`, n));
        return done;
    }
    try {
        await spec.run(spec.items, spec.value);
    }
    catch (err) {
        fail(fillCount(`Could not ${verb.toLowerCase()} {n} item{s}: ${err instanceof Error && err.message ? err.message : "nothing says why"}`, n));
        return false;
    }
    const undo = spec.undo;
    say(fillCount(spec.said ?? `${verb}: {n} item{s}.`, n), {
        undo: undo ? () => undo(spec.items, spec.value) : undefined,
        undone: spec.undone ? fillCount(spec.undone, n) : undefined,
        returnFocus: spec.returnTo ?? undefined,
    });
    return true;
}
const handlers = new WeakMap();
// Says what each action of a bar does. The keys are the buttons' data-cap-bulk-action values.
export function bindBulk(bar, actions) {
    handlers.set(bar, actions);
}
export function listOf(bar) {
    const id = bar.dataset.capList;
    return id ? document.getElementById(id) : null;
}
function visible(el) {
    return !el.closest("[hidden]") && el.getClientRects().length > 0;
}
// The selectable items of a list: its checkboxes marked data-cap-select.
export function boxesOf(list) {
    return Array.from(list.querySelectorAll(SELECT));
}
export function labelOf(box) {
    const named = box.dataset.label ?? box.closest("[data-label]")?.dataset.label;
    if (named)
        return named;
    const text = box.labels?.[0]?.textContent?.trim();
    return text || box.value;
}
// The items now selected, in document order. An item that is out of sight (a filter hid it) is
// not acted on, so an action never reaches what the person cannot see.
export function selectedItems(bar) {
    const list = listOf(bar);
    if (!list)
        return [];
    return boxesOf(list)
        .filter((b) => b.checked && !b.disabled && visible(b.closest("[data-label], li, tr, label") ?? b))
        .map((b) => ({ id: b.value, label: labelOf(b) }));
}
// The selectable items the person can see now (a search or a filter may hide some).
export function itemsInView(list) {
    return boxesOf(list).filter((b) => !b.disabled && visible(b.closest("[data-label], li, tr, label") ?? b));
}
function fire(box) {
    box.dispatchEvent(new Event("change", { bubbles: true }));
}
// Selects (or clears) every item in view. Real checkboxes change, so a form posts them.
export function setAllInView(list, on) {
    for (const box of on ? itemsInView(list) : boxesOf(list)) {
        if (box.checked === on)
            continue;
        box.checked = on;
        fire(box);
    }
}
const part = (bar, name) => bar.querySelector(`[data-cap-part='${name}']`);
// True while the bar lists outcomes: it stays in view with nothing selected, so the results of
// the action just run can be read.
function hasOutcomes(bar) {
    const list = part(bar, "results");
    return !!list && !list.hidden;
}
function svg(glyph) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("class", "cap-status-glyph");
    el.setAttribute("viewBox", "0 0 16 16");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("focusable", "false");
    el.innerHTML = glyph;
    return el;
}
let resultsSeq = 0;
// Writes the outcome list into the bar (the markup on the doc page), replacing any before it, and
// shows the bar. An empty list removes it.
export function showOutcomes(bar, outcomes) {
    part(bar, "results")?.remove();
    if (outcomes.length > 0) {
        const box = document.createElement("div");
        box.className = "cap-bulk-results";
        box.dataset.capPart = "results";
        box.setAttribute("role", "group");
        const summary = document.createElement("p");
        summary.className = "cap-bulk-results-summary";
        summary.id = `${bar.id || "cap-bulk"}-results-${++resultsSeq}`;
        summary.textContent = outcomeSummary(outcomes);
        box.setAttribute("aria-labelledby", summary.id);
        const list = document.createElement("ul");
        list.className = "cap-bulk-results-list";
        for (const o of orderOutcomes(outcomes)) {
            const li = document.createElement("li");
            li.dataset.ok = String(o.ok);
            const word = document.createElement("span");
            word.className = "cap-status";
            word.dataset.tone = o.ok ? "ok" : "crit";
            word.append(svg(o.ok ? GLYPHS.ok : GLYPHS.failure), o.ok ? "Done" : "Not done");
            const label = document.createElement("span");
            label.className = "cap-bulk-result-label";
            label.textContent = o.label;
            li.append(word, " ", label);
            if (o.message) {
                const m = document.createElement("span");
                m.className = "cap-bulk-result-message";
                m.textContent = o.message;
                li.append(" ", m);
            }
            if (o.usedBy?.length) {
                const uses = document.createElement("ul");
                uses.className = "cap-bulk-result-uses";
                for (const u of o.usedBy) {
                    const item = document.createElement("li");
                    item.textContent = u;
                    uses.append(item);
                }
                li.append(uses);
            }
            list.append(li);
        }
        const dismiss = document.createElement("button");
        dismiss.type = "button";
        dismiss.className = "cap-btn";
        dismiss.dataset.variant = "quiet";
        dismiss.dataset.size = "sm";
        dismiss.dataset.capPart = "dismiss-results";
        dismiss.textContent = "Dismiss results";
        box.append(summary, list, dismiss);
        bar.append(box);
    }
    refresh(bar);
    // A bar with no list is not counted by refresh; outcomes alone put it in view.
    if (outcomes.length > 0)
        bar.hidden = false;
}
const lastTouched = new WeakMap();
// Redraws the bar from the list: the count, hidden when there is none, the select-all label
// and the header checkbox's state. The count is written a frame after the bar appears, so a
// screen reader announces it (a status region that is shown and filled in one step is often
// missed).
export function refresh(bar) {
    const list = listOf(bar);
    if (!list)
        return Number.parseInt(part(bar, "count")?.textContent ?? bar.querySelector(".cap-bulk-count")?.textContent ?? "0", 10) || 0;
    const items = selectedItems(bar);
    const n = items.length;
    const count = bar.querySelector(".cap-bulk-count");
    const text = countText(n);
    if (count) {
        if (n > 0 && bar.hidden) {
            bar.hidden = false;
            count.textContent = "";
            requestAnimationFrame(() => {
                if (!bar.hidden)
                    count.textContent = countText(selectedItems(bar).length);
            });
        }
        else if (n > 0) {
            if (count.textContent !== text)
                count.textContent = text;
        }
        else if (hasOutcomes(bar)) {
            bar.hidden = false;
            if (count.textContent !== "Nothing selected")
                count.textContent = "Nothing selected";
        }
        else {
            bar.hidden = true;
        }
    }
    else
        bar.hidden = n === 0 && !hasOutcomes(bar);
    const total = itemsInView(list).length;
    const all = part(bar, "select-all");
    if (all) {
        all.textContent = fillCount(all.dataset.capLabel ?? "Select all {n} in view", total);
        all.hidden = total === 0 || n >= total;
    }
    for (const head of document.querySelectorAll(`input[data-cap-select-all][data-cap-list='${CSS.escape(list.id)}']`)) {
        head.checked = total > 0 && n >= total;
        head.indeterminate = n > 0 && n < total;
    }
    bar.dispatchEvent(new CustomEvent("cap-bulk-change", { bubbles: true, detail: { items, count: n } }));
    return n;
}
// Where focus goes when the bar goes away: the bar's data-cap-return selector, the item last
// touched, or the first item.
function returnTarget(bar) {
    const list = listOf(bar);
    const named = bar.dataset.capReturn ? document.querySelector(bar.dataset.capReturn) : null;
    return named ?? lastTouched.get(bar) ?? (list ? boxesOf(list)[0] : null) ?? null;
}
// Clears the selection. When focus was in the bar (which hides), it goes back to the list: the
// bar's data-cap-return selector, the item last touched, or the first item.
export function clearSelection(bar) {
    const list = listOf(bar);
    if (!list)
        return;
    const had = bar.contains(document.activeElement);
    setAllInView(list, false);
    refresh(bar);
    bar.dispatchEvent(new CustomEvent("cap-bulk-clear", { bubbles: true }));
    if (!had)
        return;
    returnTarget(bar)?.focus();
}
function valueFor(button) {
    const sel = button.dataset.capValue;
    if (!sel)
        return undefined;
    const el = document.querySelector(sel);
    return el?.value.trim() ?? "";
}
// Presses one action button: the preview or the immediate run, as the button says.
export async function invoke(bar, button) {
    const items = selectedItems(bar);
    const action = button.dataset.capBulkAction ?? "";
    if (items.length === 0 || !action)
        return false;
    const value = valueFor(button);
    if (value === "") {
        const input = document.querySelector(button.dataset.capValue ?? "");
        input?.focus();
        return false;
    }
    const h = handlers.get(bar)?.[action];
    const ok = await performBulk({
        action: button.dataset.capLabel ?? action,
        items,
        value,
        run: h?.run ?? (() => undefined),
        undo: h?.undo,
        said: h?.said ?? button.dataset.capSaid,
        undone: h?.undone ?? button.dataset.capUndone,
        destructive: button.hasAttribute("data-destructive"),
        confirmTitle: button.dataset.capConfirmTitle,
        confirmLead: button.dataset.capConfirmLead,
        confirmAction: button.dataset.capConfirmAction,
        returnTo: returnTarget(bar),
    });
    if (ok) {
        bar.dispatchEvent(new CustomEvent("cap-bulk-action", { bubbles: true, detail: { action, items, value } }));
        clearSelection(bar);
    }
    return ok;
}
export function attachBulkBar(bar) {
    if (bar.hasAttribute(READY))
        return () => { };
    bar.setAttribute(READY, "");
    const list = listOf(bar);
    const undo = [];
    if (list) {
        const onChange = (e) => {
            const t = e.target;
            if (t instanceof HTMLInputElement && t.matches(SELECT))
                lastTouched.set(bar, t);
            refresh(bar);
        };
        list.addEventListener("change", onChange);
        // Items added, removed or hidden (a filter, an upload, a bin) change what can be selected.
        const watch = new MutationObserver(() => refresh(bar));
        watch.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "disabled"] });
        const onKey = (e) => {
            if (e.key !== "Escape" || e.defaultPrevented || e.isComposing || bar.hidden)
                return;
            if (selectedItems(bar).length === 0)
                return;
            e.preventDefault();
            clearSelection(bar);
        };
        list.addEventListener("keydown", onKey);
        bar.addEventListener("keydown", onKey);
        undo.push(() => list.removeEventListener("change", onChange), () => watch.disconnect(), () => list.removeEventListener("keydown", onKey), () => bar.removeEventListener("keydown", onKey));
        for (const head of document.querySelectorAll(`input[data-cap-select-all][data-cap-list='${CSS.escape(list.id)}']`)) {
            const onHead = () => {
                setAllInView(list, head.checked);
                refresh(bar);
            };
            head.addEventListener("change", onHead);
            undo.push(() => head.removeEventListener("change", onHead));
        }
    }
    const onClick = (e) => {
        const target = e.target instanceof Element ? e.target : null;
        const button = target?.closest("button, [data-cap-bulk-action]");
        if (!button || !bar.contains(button) || button.getAttribute("aria-disabled") === "true")
            return;
        if (button.classList.contains("cap-bulk-clear"))
            return void clearSelection(bar);
        if (button.dataset.capPart === "dismiss-results") {
            const had = bar.contains(document.activeElement);
            showOutcomes(bar, []);
            if (had && bar.hidden)
                returnTarget(bar)?.focus();
            return;
        }
        if (button.dataset.capPart === "select-all" && list) {
            setAllInView(list, true);
            refresh(bar);
            return;
        }
        // Form mode: a submit button is the browser's own. It posts the form with the button's name
        // and value and the server answers (a destructive intent with its own confirmation page), so
        // nothing here runs, previews or offers Undo. It only refuses a press with nothing ticked.
        if (button instanceof HTMLButtonElement && button.type === "submit") {
            if (list && selectedItems(bar).length === 0) {
                e.preventDefault();
                fail("Tick at least one item first.");
            }
            return;
        }
        if (button.dataset.capBulkAction)
            void invoke(bar, button);
    };
    bar.addEventListener("click", onClick);
    undo.push(() => bar.removeEventListener("click", onClick));
    // A server-rendered outcome list carries its Dismiss hidden, since it needs script.
    const dismiss = part(bar, "dismiss-results");
    if (dismiss)
        dismiss.hidden = false;
    if (list)
        refresh(bar);
    return () => {
        undo.forEach((f) => f());
        bar.removeAttribute(READY);
    };
}
// Attaches to every [data-cap="bulk-bar"] under root not yet attached. Returns a function that
// detaches them all.
export function enhance(root = document) {
    const undo = Array.from(root.querySelectorAll("[data-cap='bulk-bar']:not([data-cap-ready])")).map(attachBulkBar);
    return () => undo.forEach((f) => f());
}
