// A label that changes in place (Save, Saving…, Saved): the button's width eases to the new
// label's while the old words blur out and the new ones blur in (uiarc's morphing label). Opt
// in: the words sit in `.cap-btn-label`, and the page changes them through morphLabel. Under
// reduced motion, or with no `.cap-btn-label`, the label just changes. The leaving words are a
// copy hidden from assistive technology, so the button's name is only ever the new label.
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
// Animates a label that has already changed, from the button's width before the change and a
// copy of the old label. The React wrapper calls it after React has written the new label.
// Widths are layout widths (offsetWidth), so a pressed button's scale does not count. Returns
// the new label's width.
export function morphFrom(button, from, old) {
    const label = button.querySelector(":scope > .cap-btn-label:not([data-leaving])");
    for (const a of button.getAnimations?.() ?? [])
        if (a.id === "cap-morph")
            a.cancel();
    for (const g of button.querySelectorAll(":scope > [data-leaving]"))
        g.remove();
    const to = button.offsetWidth;
    if (!label || reduced() || typeof button.animate !== "function")
        return to;
    const css = getComputedStyle(button);
    const ms = (name, fallback) => parseFloat(css.getPropertyValue(name)) || fallback;
    const timing = { duration: ms("--dur-base", 200), easing: css.getPropertyValue("--ease-out").trim() || "ease-out" };
    old.dataset.leaving = "";
    old.setAttribute("aria-hidden", "true");
    button.append(old);
    if (Math.abs(to - from) > 0.5)
        button.animate({ width: [`${from}px`, `${to}px`], overflow: ["clip", "clip"] }, { ...timing, id: "cap-morph" });
    const out = old.animate({ opacity: [1, 0], filter: ["blur(0)", "blur(4px)"] }, { ...timing, duration: ms("--dur-fast", 100), fill: "forwards" });
    out.onfinish = out.oncancel = () => old.remove();
    // A pending button hides its label under the spinner; its own fade must not show it.
    if (button.getAttribute("aria-busy") !== "true")
        label.animate({ opacity: [0, 1], filter: ["blur(4px)", "blur(0)"] }, timing);
    return to;
}
// Changes a button's label with the morph: `change` writes the new label (into
// `.cap-btn-label`), e.g. morphLabel(save, () => (label.textContent = "Saving…")).
export function morphLabel(button, change) {
    const label = button.querySelector(":scope > .cap-btn-label:not([data-leaving])");
    const from = button.offsetWidth;
    const old = label?.cloneNode(true);
    change();
    if (old)
        morphFrom(button, from, old);
}
