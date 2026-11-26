// The flag list's rows as the DOM shows them: read a flag back from its row and draw a row from its data
// (flag-list.ts decides when).
import { statusEl } from "../status/status.js";
import { enhance as enhanceTime, parse as parseTime, text as timeText } from "../time/time.js";
import { anchorStatus } from "./flag-list-model.js";
export const part = (el, name) => el.querySelector(`[data-cap-part='${name}']`);
export function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className)
        e.className = className;
    if (text !== undefined)
        e.textContent = text;
    return e;
}
export function readFlag(li) {
    const quote = li.querySelector(".cap-flag-quote-text")?.textContent ?? "";
    const after = li.querySelector(".cap-flag-after-text")?.textContent;
    const anchorId = li.dataset.anchorId;
    const flag = {
        id: li.dataset.flag ?? li.id,
        kind: li.dataset.kind === "advisory" ? "advisory" : "blocking",
        cause: part(li, "cause")?.textContent ?? "",
        message: li.querySelector(".cap-flag-message")?.textContent ?? "",
        state: li.dataset.state === "resolved" ? "resolved" : "open",
    };
    if (anchorId && quote) {
        flag.anchor = { id: anchorId, quote, lost: li.dataset.anchor === "lost" };
        if (li.dataset.before)
            flag.anchor.before = li.dataset.before;
        if (li.dataset.after)
            flag.anchor.after = li.dataset.after;
        const label = li.dataset.gotoLabel;
        if (label)
            flag.anchor.label = label;
    }
    if (after !== undefined && after !== null)
        flag.suggestion = { replacement: after };
    if (li.dataset.resolution)
        flag.resolution = li.dataset.resolution;
    if (li.dataset.resolvedBy)
        flag.resolvedBy = li.dataset.resolvedBy;
    if (li.dataset.resolvedAt)
        flag.resolvedAt = li.dataset.resolvedAt;
    return flag;
}
export function flagRows(root) {
    return Array.from(root.querySelectorAll("li.cap-flag"));
}
export function readFlags(root) {
    return flagRows(root).map(readFlag);
}
const WORDS = {
    resolved: "Resolved",
    dismissed: "Dismissed",
    applied: "Applied",
};
function actionButton(kind, label, message, variant) {
    const b = el("button", "cap-btn");
    b.type = "button";
    b.dataset.size = "sm";
    if (variant)
        b.dataset.variant = variant;
    b.dataset.capPart = kind;
    b.append(label, Object.assign(el("span", "cap-sr-only"), { textContent: ` flag: ${message}` }));
    return b;
}
// Rebuilds the parts of one row that depend on its state and anchor, from its data attributes.
export function renderFlag(li, ctx) {
    const flag = readFlag(li);
    const status = anchorStatus(flag);
    li.dataset.anchor = status;
    if (flag.kind === "blocking" && flag.state === "open")
        li.dataset.tone = "crit";
    else
        delete li.dataset.tone;
    const title = li.querySelector(".cap-row-title");
    if (title && flag.anchor) {
        const describedby = li.querySelector(".cap-row-title [aria-describedby]")?.getAttribute("aria-describedby") ??
            `${li.id}-s ${li.id}-d`;
        const message = el("span", "cap-flag-message", flag.message);
        if (status === "found") {
            const a = el("a");
            a.href = `#${flag.anchor.id}`;
            a.setAttribute("aria-describedby", describedby);
            a.append(message, " ", el("span", "cap-flag-goto", flag.anchor.label ?? "Go to passage"));
            title.replaceChildren(a);
        }
        else {
            const span = el("span", "cap-flag-title");
            span.append(message, " ", statusEl("nodata", "Anchor lost"));
            title.replaceChildren(span);
        }
    }
    const meta = li.querySelector(".cap-row-meta");
    if (meta) {
        if (flag.state === "resolved") {
            const r = flag.resolution ?? "resolved";
            meta.replaceChildren(statusEl(r === "dismissed" ? "nodata" : "ok", WORDS[r]));
        }
        else
            meta.replaceChildren();
    }
    const actions = li.querySelector(".cap-row-actions");
    if (actions) {
        actions.replaceChildren(...(flag.state === "open"
            ? [
                actionButton("resolve", "Resolve", flag.message),
                actionButton("dismiss", "Dismiss", flag.message, "quiet"),
            ]
            : [actionButton("reopen", "Reopen", flag.message)]));
    }
    const quoteNote = part(li, "anchor-note");
    if (quoteNote) {
        quoteNote.replaceChildren();
        if (status === "lost")
            quoteNote.append("The text this flag was raised on changed or was removed. Last known text:");
        quoteNote.hidden = quoteNote.childNodes.length === 0;
    }
    const sug = li.querySelector(".cap-flag-suggestion");
    if (sug && flag.suggestion) {
        const applied = flag.state === "resolved" && flag.resolution === "applied";
        sug.dataset.state = applied ? "applied" : "inert";
        const foot = part(sug, "suggestion-foot");
        if (foot) {
            foot.replaceChildren();
            if (applied || flag.state === "resolved") {
            }
            else if (status !== "found")
                foot.append(el("p", "cap-flag-note", "Cannot be applied: the passage it replaces has changed or gone."));
            else if (ctx.owner) {
                const b = el("button", "cap-btn");
                b.type = "button";
                b.dataset.size = "sm";
                b.dataset.variant = "primary";
                b.dataset.capPart = "apply";
                b.append("Apply", Object.assign(el("span", "cap-sr-only"), { textContent: ` suggestion: ${flag.message}` }));
                foot.append(b);
            }
            else
                foot.append(el("p", "cap-flag-note", `Only the owner${ctx.ownerName ? `, ${ctx.ownerName},` : ""} can apply this. The draft stays as it is until they do.`));
        }
    }
    const body = li.querySelector(".cap-flag-body");
    body?.querySelector(".cap-flag-resolution")?.remove();
    if (body && flag.state === "resolved") {
        const p = el("p", "cap-flag-resolution");
        p.append(`${WORDS[flag.resolution ?? "resolved"]}${flag.resolvedBy ? ` by ${flag.resolvedBy}` : ""}`);
        if (flag.resolvedAt) {
            const t = el("time", "cap-time");
            t.dataset.cap = "time";
            t.dateTime = flag.resolvedAt;
            t.textContent = timeText(parseTime(flag.resolvedAt), "relative");
            p.append(" ", t);
            enhanceTime(p);
        }
        p.append(".");
        body.append(p);
    }
}
