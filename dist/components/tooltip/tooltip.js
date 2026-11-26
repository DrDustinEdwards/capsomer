// A tooltip: extra detail about a control, never the only place its label appears. It is the shared
// popover's tooltip variant (components/popover), shown on hover after 300 ms (at once when another
// tip is open or just closed) and on keyboard focus, hidden on Esc, blur and pointer leave, and
// hoverable (WCAG 1.4.13). A trigger names its tip with data-cap-tip="<id>".
import { attach as attachPopover, close, open } from "../popover/popover.js";
export { HIDE_GRACE_MS, SHOW_DELAY_MS, place, supportsAnchor } from "../popover/popover.js";
const tips = new WeakMap();
export function attach(trigger, tip) {
    tip.classList.add("cap-popover");
    tip.dataset.variant ??= "tooltip";
    if (!tip.hasAttribute("popover"))
        tip.setAttribute("popover", "manual");
    if (!tip.getAttribute("role"))
        tip.setAttribute("role", "tooltip");
    tips.set(trigger, tip);
    const detach = attachPopover(trigger, tip);
    return () => {
        detach();
        tips.delete(trigger);
    };
}
export function showTip(trigger) {
    const tip = tips.get(trigger);
    if (tip)
        open(tip);
}
export function hideTip(trigger) {
    const tip = tips.get(trigger);
    if (tip)
        close(tip);
}
export function enhance(root = document) {
    const undo = [];
    for (const trigger of root.querySelectorAll("[data-cap-tip]:not([data-cap-ready])")) {
        const tip = document.getElementById(trigger.dataset.capTip ?? "");
        if (!tip)
            continue;
        trigger.dataset.capReady = "";
        const detach = attach(trigger, tip);
        undo.push(() => {
            detach();
            delete trigger.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
