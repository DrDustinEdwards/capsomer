import { clamp } from "../hooks/hooks.ts";
import { escapeHtml } from "@dustinedwards/site-runtime/html";

export interface PatchOptions {
  /** A unique id on the page, for the patch's text paths. */
  id: string;
  /** Set round the top, in capitals. */
  name: string;
  /** Set round the foot, in capitals: the site or the series. */
  foot: string;
  /** The number on the disc, and the number of dots round it (at most 24). */
  count: number;
  /** The word under the number, in capitals. */
  unit: string;
}

/** The dots round a patch's disc, one per count (at most 24), as [cx, cy] strings: the SVG and the React patch share them. */
export function patchDots(count: number): [string, string][] {
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
export function patchSvg({ id, name, foot, count, unit }: PatchOptions): string {
  const dots = patchDots(count)
    .map(([cx, cy]) => `<circle class="cap-patch-dot" cx="${cx}" cy="${cy}" r="3.4"/>`)
    .join("");
  const p = `cap-patch-${escapeHtml(id)}`;
  return `<svg class="cap-patch" viewBox="0 0 140 140" aria-hidden="true" focusable="false"><defs><path id="${p}-top" d="M 22 70 A 48 48 0 0 1 118 70"/><path id="${p}-foot" d="M 27 74 A 43 43 0 0 0 113 74"/></defs><circle class="cap-patch-rim" cx="70" cy="70" r="68"/><circle class="cap-patch-field" cx="70" cy="70" r="61"/><circle class="cap-patch-disc" cx="70" cy="70" r="36"/>${dots}<text class="cap-patch-name" text-anchor="middle"><textPath href="#${p}-top" startOffset="50%">${escapeHtml(name.toUpperCase())}</textPath></text><text class="cap-patch-foot" text-anchor="middle"><textPath href="#${p}-foot" startOffset="50%">${escapeHtml(foot.toUpperCase())}</textPath></text><text class="cap-patch-count" x="70" y="77" text-anchor="middle">${count}</text><text class="cap-patch-unit" x="70" y="89" text-anchor="middle">${escapeHtml(unit.toUpperCase())}</text></svg>`;
}

// The manual's parts as HTML strings, for a page built without React (a static site's build script, a specimen, a
// Worker's own page): the one place their markup is written, so a build script never hand-types the classes. Every
// value is text and is escaped here; a link's href is escaped as an attribute. React pages write the same contract.

const esc = escapeHtml;
const linkOr = (text: string, href?: string, attrs = "") =>
  href ? `<a href="${esc(href)}"${attrs}>${esc(text)}</a>` : `<strong>${esc(text)}</strong>`;

export interface ChecklistItem {
  name: string;
  /** Where the step is; without one the name is bold, unlinked. */
  href?: string;
  kind: string;
  note: string;
}

/** A checklist card: a dark strip naming it (`strip`, two parts), then each item as a step. */
export function checklistHtml(options: {
  label: string;
  strip: readonly [string, string];
  items: readonly ChecklistItem[];
}): string {
  const items = options.items
    .map(
      ({ name, href, kind, note }) =>
        `<li class="cap-checklist-item"><div class="cap-checklist-line">${linkOr(name, href)}<span class="cap-checklist-dots" aria-hidden="true"></span><span class="cap-checklist-kind">${esc(kind)}</span></div><p class="cap-checklist-note">${esc(note)}</p></li>`,
    )
    .join("\n");
  return `<section class="cap-checklist" aria-label="${esc(options.label)}">\n<p class="cap-checklist-strip" aria-hidden="true"><span>${esc(options.strip[0])}</span><span>${esc(options.strip[1])}</span></p>\n<ol class="cap-checklist-items">\n${items}\n</ol>\n</section>`;
}

export interface TimelineStep {
  /** The step's mark at its tick (a year, a time, a number). */
  mark: string;
  /** A bold lead before the text, ending in a period. */
  lead?: string;
  text: string;
}

/** A time line of dated steps. */
export function timelineHtml(steps: readonly TimelineStep[]): string {
  return `<ol class="cap-timeline">\n${steps
    .map(
      ({ mark, lead, text }) =>
        `<li><span class="cap-timeline-mark">${esc(mark)}</span><div class="cap-timeline-body"><p>${lead ? `<b>${esc(lead)}.</b> ` : ""}${esc(text)}</p></div></li>`,
    )
    .join("\n")}\n</ol>`;
}

export interface FormBox {
  label: string;
  value: string | number;
  span?: 2 | "all";
  weight?: "bold";
}

/** Form boxes: facts in ruled boxes. `variant` is readings, tones, panel or grid. */
export function formBoxesHtml(
  boxes: readonly FormBox[],
  { variant }: { variant?: "readings" | "tones" | "panel" | "grid" } = {},
): string {
  return `<dl class="cap-form-boxes"${variant ? ` data-variant="${variant}"` : ""}>\n${boxes
    .map(
      ({ label, value, span, weight }) =>
        `<div class="cap-form-boxes-box"${span ? ` data-span="${span}"` : ""}${weight ? ` data-weight="${weight}"` : ""}><dt>${esc(label)}</dt><dd>${esc(String(value))}</dd></div>`,
    )
    .join("\n")}\n</dl>`;
}

export interface LeaderRow {
  name: string;
  /** The count or page at the right. */
  fact: string | number;
  /** The row's number; the row's place from 1 when left out. */
  no?: string | number;
  href?: string;
  /** Marks the row you are on (aria-current="page"). */
  current?: boolean;
}

/** A leader index: number, bold name, a dotted leader and a fact at the right; a row with an href is a link. */
export function leaderIndexHtml(rows: readonly LeaderRow[]): string {
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
export function cueCardHtml(options: {
  id: string;
  strip: readonly [string, string];
  title: string;
  lines: readonly { name: string; value: string }[];
  /** Extra classes beside cap-cue. */
  className?: string;
  /** A line under the card's lines. */
  note?: string;
}): string {
  const { id, strip, title, lines, className, note } = options;
  return `<section class="cap-cue${className ? ` ${esc(className)}` : ""}" aria-labelledby="${esc(id)}">\n<p class="cap-cue-strip"><span>${esc(strip[0])}</span><span>${esc(strip[1])}</span></p>\n<h2 class="cap-cue-title" id="${esc(id)}">${esc(title)}</h2>\n<ul class="cap-cue-lines">\n${lines
    .map(
      ({ name, value }) =>
        `<li><span class="cap-cue-name">${esc(name)}</span><span class="cap-cue-value">${esc(value)}</span></li>`,
    )
    .join("\n")}\n</ul>${note ? `\n<p>${esc(note)}</p>` : ""}\n</section>`;
}

export interface Sign {
  text: string;
  href: string;
  /** prev or next draws the arrow that way; forward is next's look for a first step. */
  way?: "prev" | "next" | "forward";
  /** rel values beside the way (external, nofollow). */
  rel?: string;
}

/** Signs: the ways on as dark panels. `label` names the nav. */
export function signsHtml(label: string, signs: readonly Sign[]): string {
  return `<nav class="cap-signs" aria-label="${esc(label)}">${signs
    .map(({ text, href, way, rel }) => {
      const rels = [way === "prev" || way === "next" ? way : "", rel ?? ""]
        .filter(Boolean)
        .join(" ");
      return `<a class="cap-sign"${way === "forward" ? ' data-variant="forward"' : ""}${rels ? ` rel="${esc(rels)}"` : ""} href="${esc(href)}">${esc(text)}</a>`;
    })
    .join("")}</nav>`;
}

/** A part of a site, for the running head: the paths it covers, its number and its trail of names. */
/**
 * A route's folio for the running head's right side, from its loader data: `export const handle = { folio }`. The
 * route handle contract every site's routes use.
 */
export type RunningHeadHandle = { folio?: (data: unknown) => string | null | undefined };

/** The deepest route's folio, from the router's matches (React Router's useMatches), or undefined. */
export function folioOf(
  matches: readonly { handle?: unknown; loaderData?: unknown; data?: unknown }[],
): string | undefined {
  let folio: string | undefined;
  for (const match of matches) {
    const handle = match.handle as RunningHeadHandle | undefined;
    folio = handle?.folio?.(match.loaderData ?? match.data) ?? folio;
  }
  return folio;
}
