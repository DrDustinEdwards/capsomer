import { clamp } from "../hooks/hooks.js";
import { escapeHtml as esc } from "@dustinedwards/site-runtime/html";
/** The dots round a patch's disc, one per count (at most 24), as [cx, cy] strings: the SVG and the React patch share them. */
export function patchDots(count) {
    const n = clamp(count, 0, 24);
    return Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        return [(70 + 36 * Math.cos(a)).toFixed(2), (70 + 36 * Math.sin(a)).toFixed(2)];
    });
}
/**
 * A project's round patch as SVG markup, as each Apollo crew wore its mission's (capsomer/manual.css
 * draws it). Plain string building, so a server or a static build can write it into the page. The
 * patch is decorative: the page says the same in words beside it, so it is hidden from screen readers.
 */
export function patchSvg({ id, name, foot, count, unit }) {
    const dots = patchDots(count)
        .map(([cx, cy]) => `<circle class="cap-patch-dot" cx="${cx}" cy="${cy}" r="3.4"/>`)
        .join("");
    const p = `cap-patch-${esc(id)}`;
    return `<svg class="cap-patch" viewBox="0 0 140 140" aria-hidden="true" focusable="false"><defs><path id="${p}-top" d="M 22 70 A 48 48 0 0 1 118 70"/><path id="${p}-foot" d="M 27 74 A 43 43 0 0 0 113 74"/></defs><circle class="cap-patch-rim" cx="70" cy="70" r="68"/><circle class="cap-patch-field" cx="70" cy="70" r="61"/><circle class="cap-patch-disc" cx="70" cy="70" r="36"/>${dots}<text class="cap-patch-name" text-anchor="middle"><textPath href="#${p}-top" startOffset="50%">${esc(name.toUpperCase())}</textPath></text><text class="cap-patch-foot" text-anchor="middle"><textPath href="#${p}-foot" startOffset="50%">${esc(foot.toUpperCase())}</textPath></text><text class="cap-patch-count" x="70" y="77" text-anchor="middle">${count}</text><text class="cap-patch-unit" x="70" y="89" text-anchor="middle">${esc(unit.toUpperCase())}</text></svg>`;
}
// The manual's parts as HTML strings, for a page built without React (a static site's build script, a specimen, a
// Worker's own page): the one place their markup is written, so a build script never hand-types the classes. Every
// value is text and is escaped here; a link's href is escaped as an attribute. React pages write the same contract.
const linkOr = (text, href, attrs = "") => href ? `<a href="${esc(href)}"${attrs}>${esc(text)}</a>` : `<strong>${esc(text)}</strong>`;
/** A checklist card: a dark strip naming it (`strip`, two parts), then each item as a step. */
export function checklistHtml(options) {
    const items = options.items
        .map(({ name, href, kind, note }) => `<li class="cap-checklist-item"><div class="cap-checklist-line">${linkOr(name, href)}<span class="cap-checklist-dots" aria-hidden="true"></span><span class="cap-checklist-kind">${esc(kind)}</span></div><p class="cap-checklist-note">${esc(note)}</p></li>`)
        .join("\n");
    return `<section class="cap-checklist" aria-label="${esc(options.label)}">\n<p class="cap-checklist-strip" aria-hidden="true"><span>${esc(options.strip[0])}</span><span>${esc(options.strip[1])}</span></p>\n<ol class="cap-checklist-items">\n${items}\n</ol>\n</section>`;
}
/** A time line of dated steps. */
export function timelineHtml(steps) {
    return `<ol class="cap-timeline">\n${steps
        .map(({ mark, lead, text }) => `<li><span class="cap-timeline-mark">${esc(mark)}</span><div class="cap-timeline-body"><p>${lead ? `<b>${esc(lead)}.</b> ` : ""}${esc(text)}</p></div></li>`)
        .join("\n")}\n</ol>`;
}
/** Form boxes: facts in ruled boxes. `variant` is readings, tones, panel or grid. */
export function formBoxesHtml(boxes, { variant } = {}) {
    return `<dl class="cap-form-boxes"${variant ? ` data-variant="${variant}"` : ""}>\n${boxes
        .map(({ label, value, span, weight }) => `<div class="cap-form-boxes-box"${span ? ` data-span="${span}"` : ""}${weight ? ` data-weight="${weight}"` : ""}><dt>${esc(label)}</dt><dd>${esc(String(value))}</dd></div>`)
        .join("\n")}\n</dl>`;
}
/** A leader index: number, bold name, a dotted leader and a fact at the right; a row with an href is a link. */
export function leaderIndexHtml(rows) {
    return `<ol class="cap-leader-index">\n${rows
        .map(({ name, fact, no, href, current }, i) => {
        const inner = `<span class="cap-leader-index-no">${esc(String(no ?? i + 1))}</span><span class="cap-leader-index-name">${esc(name)}</span><span class="cap-leader-index-dots" aria-hidden="true"></span><span class="cap-leader-index-fact">${esc(String(fact))}</span>`;
        return href
            ? `<li><a class="cap-leader-index-link" href="${esc(href)}"${current ? ' aria-current="page"' : ""}>${inner}</a></li>`
            : `<li><span class="cap-leader-index-link">${inner}</span></li>`;
    })
        .join("\n")}\n</ol>`;
}
/** A cue card: the strip (two parts), a title with its id (the section's aria-labelledby), and its lines. */
export function cueCardHtml(options) {
    const { id, strip, title, lines, className, note } = options;
    return `<section class="cap-cue${className ? ` ${esc(className)}` : ""}" aria-labelledby="${esc(id)}">\n<p class="cap-cue-strip"><span>${esc(strip[0])}</span><span>${esc(strip[1])}</span></p>\n<h2 class="cap-cue-title" id="${esc(id)}">${esc(title)}</h2>\n<ul class="cap-cue-lines">\n${lines
        .map(({ name, value }) => `<li><span class="cap-cue-name">${esc(name)}</span><span class="cap-cue-value">${esc(value)}</span></li>`)
        .join("\n")}\n</ul>${note ? `\n<p>${esc(note)}</p>` : ""}\n</section>`;
}
/** Signs: the ways on as dark panels. `label` names the nav. */
export function signsHtml(label, signs) {
    return `<nav class="cap-signs" aria-label="${esc(label)}">${signs
        .map(({ text, href, way, rel, label: kind }) => {
        const rels = [way === "prev" || way === "next" ? way : "", rel ?? ""]
            .filter(Boolean)
            .join(" ");
        return `<a class="cap-sign"${way === "forward" ? ' data-variant="forward"' : ""}${rels ? ` rel="${esc(rels)}"` : ""} href="${esc(href)}">${kind ? `<span class="cap-sr-only">${esc(kind)}: </span>` : ""}${esc(text)}</a>`;
    })
        .join("")}</nav>`;
}
/** The deepest route's folio, from the router's matches (React Router's useMatches), or undefined. */
export function folioOf(matches) {
    let folio;
    for (const match of matches) {
        const handle = match.handle;
        folio = handle?.folio?.(match.loaderData ?? match.data) ?? folio;
    }
    return folio;
}
