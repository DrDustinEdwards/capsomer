// The field's behaviour: check a field when it is left and every field on submit, with the
// platform's constraint validation (required, type, pattern, min, max...), write the
// message into the field's .cap-field-error, set aria-invalid, and on a failed submit move
// focus to the first field in error. No framework; the React wrapper and switch-reason use
// the same functions.
// The ValidityState flags, in the order a message is chosen. A control can override each
// with a data attribute: data-error-value-missing, data-error-type-mismatch, and so on.
const FLAGS = ["valueMissing", "typeMismatch", "patternMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput"];
let serial = 0;
export function isControl(el) {
    return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
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
    if (control instanceof HTMLInputElement && control.type === "radio" && control.name && control.form) {
        return [...control.form.querySelectorAll(`input[type="radio"][name="${CSS.escape(control.name)}"]`)];
    }
    return [control];
}
// The control a check is about: the select behind an enhanced select's button.
function controlOf(el) {
    if (isControl(el))
        return el;
    if (el instanceof HTMLElement && el.classList.contains("cap-select-trigger"))
        return el.closest(".cap-select-wrap")?.querySelector("select.cap-select") ?? null;
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
// Checks every field of a form. On failure, announces the messages that were not already
// showing and moves focus to the first field in error. True when the form is valid.
export function validateForm(form) {
    const seen = new Set();
    let first = null;
    for (const el of form.elements) {
        if (!isControl(el) || !el.willValidate)
            continue;
        if (el instanceof HTMLInputElement && el.type === "radio" && el.name) {
            if (seen.has(el.name))
                continue;
            seen.add(el.name);
        }
        const was = el.getAttribute("aria-invalid") === "true";
        const ok = validate(el, !was);
        if (!ok && !first)
            first = el;
    }
    if (first)
        first.focus();
    return first === null;
}
// A click on an input group's text or icon addon puts the cursor in its field, as a click
// on the field itself would (a button in the addon keeps its own click).
function groupClick(e) {
    const target = e.target;
    const addon = target?.closest(".cap-input-addon");
    if (!addon || target?.closest("button, a, input, select, textarea"))
        return;
    addon.parentElement?.querySelector("input, textarea")?.focus();
}
// Attaches to every form[data-cap="field"] under root that is not attached yet. The form
// gets novalidate, so the browser's own bubbles give way to the messages beside the
// fields. Returns a function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const group of root.querySelectorAll(".cap-input-group:not([data-cap-ready])")) {
        group.dataset.capReady = "";
        group.addEventListener("click", groupClick);
        undo.push(() => {
            group.removeEventListener("click", groupClick);
            delete group.dataset.capReady;
        });
    }
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
        form.addEventListener("input", onInput);
        form.addEventListener("change", onInput);
        form.addEventListener("focusout", onLeave);
        form.addEventListener("submit", onSubmit, { capture: true });
        undo.push(() => {
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
