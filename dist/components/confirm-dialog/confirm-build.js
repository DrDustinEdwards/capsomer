// The confirm dialog's markup: buildConfirm makes exactly the contract on the doc page (confirm-dialog.ts opens and wires it).
import { uid } from "../hooks/hooks.js";
const MEDIA_GLYPH = "M8 1.5l7 12.5H1zM7.2 6v4h1.6V6zM7.2 10.8v1.4h1.6v-1.4z";
export function svgGlyph(d, size) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const p = document.createElementNS(ns, "path");
    p.setAttribute("fill", "currentColor");
    p.setAttribute("fill-rule", "evenodd");
    p.setAttribute("d", d);
    svg.append(p);
    return svg;
}
export function buildConfirm(o) {
    const id = uid("cap-confirm");
    const dialog = document.createElement("dialog");
    dialog.className = "cap-dialog";
    dialog.dataset.cap = "confirm-dialog";
    dialog.dataset.placement = "center";
    dialog.dataset.size = "md";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-labelledby", `${id}-title`);
    const described = [];
    const header = document.createElement("div");
    header.className = "cap-dialog-header";
    if (o.media !== false) {
        const media = document.createElement("div");
        media.className = "cap-dialog-media";
        media.dataset.tone = "crit";
        media.setAttribute("aria-hidden", "true");
        media.append(svgGlyph(MEDIA_GLYPH, 16));
        header.append(media);
    }
    const h = document.createElement("h2");
    h.className = "cap-dialog-title";
    h.id = `${id}-title`;
    h.textContent = o.title;
    header.append(h);
    if (o.lead) {
        const p = document.createElement("p");
        p.className = "cap-dialog-description";
        p.id = `${id}-desc`;
        p.textContent = o.lead;
        header.append(p);
        described.push(p.id);
    }
    dialog.append(header);
    const body = document.createElement("div");
    body.className = "cap-dialog-body";
    if (o.body.length) {
        const ul = document.createElement("ul");
        ul.id = `${id}-list`;
        for (const line of o.body) {
            const li = document.createElement("li");
            li.textContent = line;
            ul.append(li);
        }
        body.append(ul);
        described.push(ul.id);
    }
    if (o.reason) {
        const wrap = document.createElement("div");
        wrap.className = "cap-confirm-reason";
        const label = document.createElement("label");
        label.htmlFor = `${id}-reason`;
        label.textContent = o.reason.label ?? "Reason (required)";
        const area = document.createElement("textarea");
        area.className = "cap-input";
        area.id = `${id}-reason`;
        area.rows = 3;
        area.setAttribute("aria-required", "true");
        area.setAttribute("aria-describedby", `${id}-reason-note`);
        area.dataset.capPart = "reason";
        const note = document.createElement("p");
        note.className = "cap-confirm-note";
        note.id = `${id}-reason-note`;
        note.dataset.capPart = "reason-note";
        note.textContent = o.reason.note ?? "Recorded with the change.";
        wrap.append(label, area, note);
        body.append(wrap);
    }
    if (o.typeToConfirm) {
        const wrap = document.createElement("div");
        wrap.className = "cap-confirm-typed";
        const label = document.createElement("label");
        label.id = `${id}-typed-label`;
        label.htmlFor = `${id}-typed`;
        const b = document.createElement("b");
        b.textContent = o.typeToConfirm;
        label.append("Type ", b, " to confirm");
        const input = document.createElement("input");
        input.className = "cap-input";
        input.id = `${id}-typed`;
        input.type = "text";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.setAttribute("autocapitalize", "off");
        input.dataset.capPart = "typed";
        input.dataset.capWord = o.typeToConfirm;
        wrap.append(label, input);
        body.append(wrap);
    }
    if (body.childElementCount)
        dialog.append(body);
    if (described.length)
        dialog.setAttribute("aria-describedby", described.join(" "));
    const error = document.createElement("div");
    error.className = "cap-confirm-error";
    error.setAttribute("role", "alert");
    error.id = `${id}-error`;
    error.dataset.capPart = "error";
    const footer = document.createElement("div");
    footer.className = "cap-dialog-footer";
    footer.dataset.align = "between";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "cap-btn";
    cancel.dataset.capPart = "cancel";
    cancel.textContent = o.cancelLabel ?? "Cancel";
    const perform = document.createElement("button");
    perform.type = "button";
    perform.className = "cap-btn";
    perform.dataset.variant = "danger";
    perform.dataset.capPart = "perform";
    perform.textContent = o.action;
    footer.append(cancel, perform);
    dialog.append(error, footer);
    return dialog;
}
