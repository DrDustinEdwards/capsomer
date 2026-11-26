// The field's behavior: check a field when it is left and every field on submit, with the
// platform's constraint validation (required, type, pattern, min, max...), write the
// message into the field's .cap-field-error, set aria-invalid, and on a failed submit move
// focus to the first field in error, or, with two or more, to the error summary. The parts
// that ride on a field are here too: Show and Hide on a password, a character count, number
// steppers, a search field's Clear and a date input's real-date check. No framework; the
// React wrapper and switch-reason use the same functions.
import { hideSummary, setTitleError, showSummary, summaryFor, } from "../error-summary/error-summary.js";
import { dateFrom } from "./field-values.js";
import { groupClick, wireCount, wireReveal, wireSearch, wireSteps } from "./field-wire.js";
export { countText, dateFrom, fromDateTimeLocal, keyValue, limitOf, revealedText, setRevealed, stepValue, toDateTimeLocal, } from "./field-values.js";
export { setValue } from "./field-wire.js";
// The ValidityState flags, in the order a message is chosen. A control can override each
// with a data attribute: data-error-value-missing, data-error-type-mismatch, and so on.
const FLAGS = [
    "valueMissing",
    "typeMismatch",
    "patternMismatch",
    "tooShort",
    "tooLong",
    "rangeUnderflow",
    "rangeOverflow",
    "stepMismatch",
    "badInput",
];
let serial = 0;
export function isControl(el) {
    return (el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement);
}
// What to say about a control, or "" when it is valid. The control's own words first,
// then the browser's.
export function messageFor(control) {
    const v = control.validity;
    if (v.valid)
        return "";
    if (v.customError)
        return control.validationMessage;
    for (const flag of FLAGS) {
        if (!v[flag])
            continue;
        const own = control.dataset[`error${flag.charAt(0).toUpperCase()}${flag.slice(1)}`];
        if (own)
            return own;
    }
    return control.dataset.error || control.validationMessage;
}
// The controls that share one message: a radio group, or the control alone.
export function groupOf(control) {
    if (control instanceof HTMLInputElement &&
        control.type === "radio" &&
        control.name &&
        control.form) {
        return [
            ...control.form.querySelectorAll(`input[type="radio"][name="${CSS.escape(control.name)}"]`),
        ];
    }
    return [control];
}
// The control a check is about: the select behind an enhanced select's button.
function controlOf(el) {
    if (isControl(el))
        return el;
    if (el instanceof HTMLElement && el.classList.contains("cap-select-trigger"))
        return (el.closest(".cap-select-wrap")?.querySelector("select.cap-select") ?? null);
    return null;
}
export function errorFor(control) {
    return control.closest(".cap-field")?.querySelector(".cap-field-error") ?? null;
}
function describe(control, id) {
    const ids = (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    if (!ids.includes(id))
        control.setAttribute("aria-describedby", [id, ...ids].join(" "));
}
// Shows a message beside a control. `announce` gives it role="alert": only for an error
// that appears after a submit; one found on leaving a field is read through
// aria-describedby when the field is next focused.
export function showError(control, text, announce = false) {
    const el = errorFor(control);
    for (const c of groupOf(control))
        c.setAttribute("aria-invalid", "true");
    control.closest(".cap-field")?.setAttribute("data-invalid", "true");
    if (!el)
        return;
    if (!el.id)
        el.id = `cap-field-error-${++serial}`;
    for (const c of groupOf(control))
        describe(c, el.id);
    if (announce)
        el.setAttribute("role", "alert");
    else if (el.hidden || el.textContent !== text)
        el.removeAttribute("role");
    el.textContent = text;
    el.hidden = false;
}
export function clearError(control) {
    for (const c of groupOf(control))
        c.removeAttribute("aria-invalid");
    // A date input's other part may still be wrong: its message takes the field's place.
    const other = control.closest(".cap-field")?.querySelector('[aria-invalid="true"]');
    if (isControl(other) && messageFor(other))
        return showError(other, messageFor(other));
    control.closest(".cap-field")?.removeAttribute("data-invalid");
    const el = errorFor(control);
    if (!el)
        return;
    el.removeAttribute("role");
    el.textContent = "";
    el.hidden = true;
}
// Checks one control and shows or clears its message. True when it is valid.
export function validate(control, announce = false) {
    const text = messageFor(control);
    if (text)
        showError(control, text, announce);
    else
        clearError(control);
    return !text;
}
// Checks every field of a form. One field in error takes focus and its message is
// announced; two or more are listed in the error summary, which takes focus instead. The
// page title starts "Error: " until the form is valid. True when the form is valid.
export function validateForm(form) {
    for (const g of form.querySelectorAll(".cap-date-input"))
        checkDate(g);
    const seen = new Set();
    const controls = [];
    for (const el of form.elements) {
        if (!isControl(el) || !el.willValidate)
            continue;
        if (el instanceof HTMLInputElement && el.type === "radio" && el.name) {
            if (seen.has(el.name))
                continue;
            seen.add(el.name);
        }
        controls.push(el);
    }
    // One entry per field: a date input's three parts are one field.
    const wrong = new Map();
    for (const el of controls) {
        if (!messageFor(el))
            continue;
        const field = el.closest(".cap-field") ?? el;
        if (!wrong.has(field))
            wrong.set(field, { control: el, text: messageFor(el) });
    }
    const many = wrong.size > 1;
    for (const el of controls)
        validate(el, !many && el.getAttribute("aria-invalid") !== "true");
    const summary = form.querySelector(".cap-error-summary");
    if (many)
        showSummary(summaryFor(form), [...wrong.values()]);
    else if (summary)
        hideSummary(summary);
    if (!many)
        [...wrong.values()][0]?.control.focus();
    setTitleError(wrong.size > 0);
    return wrong.size === 0;
}
// A date input whose three parts are each well formed but make no real date is wrong on its
// day, in the group's data-error-date words. The parts are found by data-cap-part, so their
// order can follow the site's language (month first in American English).
export function checkDate(group) {
    const part = (name) => group.querySelector(`input[data-cap-part='${name}']`);
    const [day, month, year] = [part("day"), part("month"), part("year")];
    if (!day || !month || !year)
        return;
    day.setCustomValidity("");
    const parts = [day, month, year];
    if (parts.some((p) => !p.value || !p.validity.valid))
        return;
    if (!dateFrom(Number(year.value), Number(month.value), Number(day.value)))
        day.setCustomValidity(group.dataset.errorDate || "Enter a real date.");
}
// A plain GET search form (data-keep-focus) on a page with no client router loads its results
// afresh, and focus would go to the top. This puts it back on the control the person sent the
// form from (the field, caret at the end, or the button). Storage is read in try/catch: blocked,
// the page simply loads without it. `skip` returns true when the router submits in place (a
// hydrated app), where focus stays without help. Call once per page; returns the detach.
export function keepFocus({ key = "cap-keep-focus", skip = () => false, } = {}) {
    const onSubmit = (event) => {
        const form = event.target;
        if (skip() || !(form instanceof HTMLFormElement) || !form.hasAttribute("data-keep-focus"))
            return;
        const at = Array.from(form.elements).indexOf(document.activeElement);
        try {
            sessionStorage.setItem(key, JSON.stringify({ path: new URL(form.action, location.href).pathname, at }));
        }
        catch {
            /* storage blocked */
        }
    };
    document.addEventListener("submit", onSubmit);
    let saved;
    try {
        saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
        sessionStorage.removeItem(key);
    }
    catch {
        saved = null;
    }
    if (saved && saved.path === location.pathname && typeof saved.at === "number" && saved.at >= 0) {
        const target = document.querySelector("form[data-keep-focus]")?.elements[saved.at];
        if (target instanceof HTMLElement) {
            target.focus();
            if (target instanceof HTMLInputElement && /^(search|text)$/.test(target.type))
                target.setSelectionRange(target.value.length, target.value.length);
        }
    }
    return () => document.removeEventListener("submit", onSubmit);
}
// Marks el as attached and records how to detach it.
function attach(el, undo, wire) {
    el.dataset.capReady = "";
    const off = wire();
    undo.push(() => {
        off();
        delete el.dataset.capReady;
    });
}
// Attaches to every form[data-cap="field"] under root that is not attached yet, and to every
// input group, password, character count and search field. The form gets novalidate, so the
// browser's own bubbles give way to the messages beside the fields. Returns a function that
// detaches them all.
// The root is Element | Document | DocumentFragment, not ParentNode: under @cloudflare/workers-types
// an HTMLFormElement does not type as a ParentNode, so a site could not pass its form.
export function enhance(root = document) {
    const undo = [];
    for (const group of root.querySelectorAll(".cap-input-group:not([data-cap-ready])")) {
        attach(group, undo, () => {
            group.addEventListener("click", groupClick);
            const num = group.querySelector("input[type='number']");
            const steps = (part) => group.querySelector(`[data-cap-part='${part}']`);
            const off = num ? wireSteps(num, steps("step-down"), steps("step-up")) : () => undefined;
            return () => {
                off();
                group.removeEventListener("click", groupClick);
            };
        });
    }
    for (const b of root.querySelectorAll("[data-cap-part='reveal']:not([data-cap-ready])"))
        attach(b, undo, () => wireReveal(b));
    for (const count of root.querySelectorAll(".cap-field-count:not([data-cap-ready])")) {
        const control = count
            .closest(".cap-field")
            ?.querySelector("[data-maxlength], [data-maxwords]");
        if (control)
            attach(count, undo, () => wireCount(control, count));
    }
    for (const search of root.querySelectorAll(".cap-search:not([data-cap-ready])"))
        attach(search, undo, () => wireSearch(search));
    for (const form of root.querySelectorAll("form[data-cap='field']:not([data-cap-ready])")) {
        form.dataset.capReady = "";
        const hadNoValidate = form.noValidate;
        form.noValidate = true;
        // A field is checked on leaving only once it has been changed, so tabbing through an
        // empty form does not fill it with errors. A field showing an error is checked again
        // as it is typed in, so the message goes as soon as it is fixed.
        const onInput = (e) => {
            const c = e.target;
            if (!isControl(c))
                return;
            c.dataset.capDirty = "";
            const date = c.closest(".cap-date-input");
            if (date)
                checkDate(date);
            if (c.getAttribute("aria-invalid") === "true")
                validate(c);
        };
        const onLeave = (e) => {
            const c = controlOf(e.target);
            if (c && c.dataset.capDirty !== undefined && c.willValidate)
                validate(c);
        };
        // Capture, and stopped there, so an app's own submit handler runs only for a valid form.
        const onSubmit = (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };
        // A reset form holds no touched control.
        const onReset = () => form.querySelectorAll("[data-cap-dirty]").forEach((c) => c.removeAttribute("data-cap-dirty"));
        form.addEventListener("reset", onReset);
        form.addEventListener("input", onInput);
        form.addEventListener("change", onInput);
        form.addEventListener("focusout", onLeave);
        form.addEventListener("submit", onSubmit, { capture: true });
        undo.push(() => {
            form.removeEventListener("reset", onReset);
            form.removeEventListener("input", onInput);
            form.removeEventListener("change", onInput);
            form.removeEventListener("focusout", onLeave);
            form.removeEventListener("submit", onSubmit, { capture: true });
            form.noValidate = hadNoValidate;
            delete form.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
