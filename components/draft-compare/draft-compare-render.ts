// Draft compare's renderer: renderCompare returns the HTML string for every view (draft-compare.ts).

import { exact, parse } from "../time/time.ts";
import { type Analysis, type Counts, type Entry, type Sentence, type SentenceOptions, type WordPart, analyze, countsText } from "./draft-compare-diff.ts";

// ---------------------------------------------------------------------------------------
// The renderer
// ---------------------------------------------------------------------------------------

export type CompareView = "side" | "inline" | "changes";
export const VIEWS: readonly CompareView[] = ["side", "inline", "changes"];

export interface CompareSide {
  // What the version is called: "Draft 3", "Published 14 September".
  title: string;
  // Who wrote or saved it.
  who?: string;
  // When, as an ISO string (a time with no zone is read as UTC).
  time?: string;
  text: string;
}

export type RunKind = "you" | "ai" | "quoted";

// A stretch of one side's text, by character offset, with who wrote it. Optional: when given,
// each sentence is marked (the authorship component's runs) with its kind.
export interface RunSpan {
  from: number;
  to: number;
  kind: RunKind;
}

export interface CompareLabels {
  before: string;
  after: string;
}

export interface CompareOptions extends SentenceOptions {
  // Ids and radio names; give each compare on a page its own. Default "compare".
  id?: string;
  // The view shown first. Default "side".
  view?: CompareView;
  // Unchanged sentences kept either side of a change before the rest collapse. Default 1.
  context?: number;
  labels?: Partial<CompareLabels>;
  runs?: { before?: RunSpan[]; after?: RunSpan[] };
  // Leave the chosen view to the app (false): enhance() then does not read or write storage.
  remember?: boolean;
}

export const STORAGE_KEY = "cap-compare-view";

const RUN_LABEL: Record<RunKind, string> = { you: "You", ai: "AI", quoted: "Quoted" };

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const sr = (s: string) => `<span class="cap-sr-only"> ${s} </span>`;

function markup(parts: WordPart[], show: "before" | "after" | "both"): string {
  let out = "";
  for (const p of parts) {
    if (p.op === "same") out += esc(p.text);
    else if (p.op === "ins" && show !== "before") out += `<ins class="cap-ins">${sr("insertion start")}${esc(p.text)}${sr("insertion end")}</ins>`;
    else if (p.op === "del" && show !== "after") out += `<del class="cap-del">${sr("deletion start")}${esc(p.text)}${sr("deletion end")}</del>`;
  }
  return out;
}

function wholeIns(s: Sentence): string {
  return markup([{ op: "ins", text: s.text }], "after");
}
function wholeDel(s: Sentence): string {
  return markup([{ op: "del", text: s.text }], "before");
}

// The html of one sentence entry on one side ("both": the inline view).
function entryHtml(e: Entry, show: "before" | "after" | "both"): string {
  switch (e.op) {
    case "same":
      return esc((show === "before" ? e.a : e.b).text);
    case "change":
      return markup(e.parts, show);
    case "del":
      return show === "after" ? "" : wholeDel(e.a);
    case "ins":
      return show === "before" ? "" : wholeIns(e.b);
  }
}

function kindOf(spans: RunSpan[] | undefined, s: Sentence): RunKind | null {
  if (!spans) return null;
  let best: RunKind | null = null;
  let most = 0;
  for (const r of spans) {
    const overlap = Math.min(r.to, s.end) - Math.max(r.from, s.start);
    if (overlap > most) {
      most = overlap;
      best = r.kind;
    }
  }
  return best;
}

function timeHtml(iso: string): string {
  const t = parse(iso);
  if (!Number.isFinite(t)) return esc(iso);
  return `<time class="cap-time" data-cap="time" data-format="exact" datetime="${new Date(t).toISOString()}">${esc(exact(t, "UTC"))}</time>`;
}

function sideHead(role: string, s: CompareSide, which: "before" | "after"): string {
  const meta = [s.who ? esc(s.who) : "", s.time ? timeHtml(s.time) : ""].filter(Boolean).join(" · ");
  return `<div class="cap-compare-side" data-side="${which}"><span class="cap-compare-side-role">${esc(role)}</span><span class="cap-compare-side-title">${esc(s.title)}</span>${meta ? `<span class="cap-compare-side-meta">${meta}</span>` : ""}</div>`;
}

// Which sentences collapse: a run of unchanged sentences keeps `context` of them beside each
// change and folds the rest when that hides at least two.
function hiddenFlags(entries: Entry[], context: number): boolean[] {
  const hidden = entries.map(() => false);
  let s = 0;
  while (s < entries.length) {
    if ((entries[s] as Entry).op !== "same") {
      s++;
      continue;
    }
    let e = s;
    while (e < entries.length && (entries[e] as Entry).op === "same") e++;
    const from = s + (s > 0 ? context : 0);
    const to = e - (e < entries.length ? context : 0);
    if (to - from >= 2) for (let i = from; i < to; i++) hidden[i] = true;
    s = e;
  }
  return hidden;
}

const gapWord = (n: number) => plural(n, "unchanged sentence", "unchanged sentences");

interface Ctx {
  id: string;
  an: Analysis;
  opts: CompareOptions;
  total: number;
  labels: CompareLabels;
}

function changeLabel(ctx: Ctx, n: number): string {
  const c = ctx.an.perChange[n - 1] as { added: number; removed: number };
  return `<span class="cap-compare-change-label">Change ${n} of ${ctx.total}</span><span class="cap-sr-only">, ${plural(c.added, "word", "words")} added, ${c.removed} removed.</span>`;
}

// What marks a change's first element, in the one view that carries ids.
function changeAttrs(ctx: Ctx, n: number, withId: boolean): string {
  const c = ctx.an.perChange[n - 1] as { added: number; removed: number };
  return `${withId ? ` id="${ctx.id}-c${n}"` : ""} data-change="${n}" data-added="${c.added}" data-removed="${c.removed}" tabindex="-1"`;
}

// A sentence wrapped in its author's run, with the label where the kind changes.
function runWrap(kind: RunKind | null, prev: RunKind | null, html: string, tag: "div" | "span"): string {
  if (!kind) return html;
  const label = kind !== prev ? `<span class="cap-run-label">${RUN_LABEL[kind]}</span>` : "";
  return `<${tag} class="cap-run" data-kind="${kind}">${label}${html}</${tag}>`;
}

function renderSideRows(ctx: Ctx, from: number, to: number, withIds: boolean, last: { before: RunKind | null; after: RunKind | null }): string {
  const { an, opts } = ctx;
  let out = "";
  for (let i = from; i < to; i++) {
    const e = an.entries[i] as Entry;
    const g = an.group[i] as number;
    const opensChange = g > 0 && (i === 0 || an.group[i - 1] !== g);
    const para = (e.a?.para ?? false) || (e.b?.para ?? false);
    const kb = e.a ? kindOf(opts.runs?.before, e.a) : null;
    const ka = e.b ? kindOf(opts.runs?.after, e.b) : null;
    const before = e.op === "ins" ? "" : runWrap(kb, last.before, entryHtml(e, "before"), "div");
    const after = e.op === "del" ? "" : runWrap(ka, last.after, entryHtml(e, "after"), "div");
    if (e.a) last.before = kb;
    if (e.b) last.after = ka;
    const cell = (side: "before" | "after", html: string) =>
      html === ""
        ? `<div class="cap-compare-cell" data-side="${side}" data-empty aria-hidden="true"></div>`
        : `<div class="cap-compare-cell" data-side="${side}"><span class="cap-compare-cell-label">${esc(side === "before" ? ctx.labels.before : ctx.labels.after)}</span><div class="cap-compare-text">${html}</div></div>`;
    out += `<li class="cap-compare-row" data-op="${e.op}"${para ? " data-para" : ""}${opensChange ? changeAttrs(ctx, g, withIds) : ""}>${opensChange ? changeLabel(ctx, g) : ""}${cell("before", before)}${cell("after", after)}</li>`;
  }
  return out;
}

// Every segment of the entries: runs shown, runs folded.
function segments(ctx: Ctx): Array<{ hidden: boolean; from: number; to: number }> {
  const flags = hiddenFlags(ctx.an.entries, ctx.opts.context ?? 1);
  const out: Array<{ hidden: boolean; from: number; to: number }> = [];
  let i = 0;
  while (i < flags.length) {
    let j = i;
    while (j < flags.length && flags[j] === flags[i]) j++;
    out.push({ hidden: flags[i] as boolean, from: i, to: j });
    i = j;
  }
  return out;
}

function gapDetails(n: number, inner: string): string {
  return `<details class="cap-disclosure cap-compare-gap" data-cap-part="gap"><summary>${gapWord(n)}</summary>${inner}</details>`;
}

function renderSide(ctx: Ctx, withIds: boolean): string {
  const last = { before: null as RunKind | null, after: null as RunKind | null };
  let rows = "";
  for (const seg of segments(ctx)) {
    const inner = renderSideRows(ctx, seg.from, seg.to, withIds, last);
    rows += seg.hidden ? `<li class="cap-compare-gapitem">${gapDetails(seg.to - seg.from, `<ol class="cap-compare-rows cap-compare-gap-rows">${inner}</ol>`)}</li>` : inner;
  }
  return `<ol class="cap-compare-rows">${rows}</ol>`;
}

// The inline and changes views build paragraphs: entries between paragraph openers.
function paragraphs(ctx: Ctx, from: number, to: number, withIds: boolean, last: { k: RunKind | null }): string {
  const { an, opts } = ctx;
  let out = "";
  let open = false;
  let inChange = 0;
  const closeChange = () => {
    if (inChange) out += "</span>";
    inChange = 0;
  };
  for (let i = from; i < to; i++) {
    const e = an.entries[i] as Entry;
    const g = an.group[i] as number;
    const para = ((e.a?.para ?? false) || (e.b?.para ?? false));
    if (!open || para) {
      closeChange();
      if (open) out += "</p>";
      out += `<p class="cap-compare-text">`;
      open = true;
    }
    if (g !== inChange) {
      closeChange();
      if (g) {
        out += `<span class="cap-compare-hunk"${changeAttrs(ctx, g, withIds)}>${changeLabel(ctx, g)} `;
        inChange = g;
      }
    }
    const spans = e.b ? opts.runs?.after : opts.runs?.before;
    const sentence = e.b ?? e.a;
    const kind = sentence ? kindOf(spans, sentence) : null;
    out += `${runWrap(kind, last.k, entryHtml(e, "both"), "span")} `;
    last.k = kind;
  }
  closeChange();
  if (open) out += "</p>";
  return out;
}

function renderInline(ctx: Ctx, withIds: boolean): string {
  const last = { k: null as RunKind | null };
  let out = "";
  for (const seg of segments(ctx)) {
    const inner = paragraphs(ctx, seg.from, seg.to, withIds, last);
    out += seg.hidden ? gapDetails(seg.to - seg.from, `<div class="cap-compare-gap-rows">${inner}</div>`) : inner;
  }
  return `<div class="cap-compare-flow">${out}</div>`;
}

function renderChanges(ctx: Ctx, withIds: boolean): string {
  const { an } = ctx;
  const last = { k: null as RunKind | null };
  let out = "";
  let skipped = 0;
  const skip = () => {
    if (skipped) out += `<p class="cap-compare-skip">${gapWord(skipped)}</p>`;
    skipped = 0;
  };
  let i = 0;
  while (i < an.entries.length) {
    const g = an.group[i] as number;
    if (g === 0) {
      skipped++;
      i++;
      continue;
    }
    skip();
    let j = i;
    while (j < an.entries.length && an.group[j] === g) j++;
    out += `<div class="cap-compare-card">${paragraphs(ctx, i, j, withIds, last)}</div>`;
    i = j;
  }
  skip();
  return `<div class="cap-compare-flow">${out}</div>`;
}

const VIEW_NAMES: Record<CompareView, string> = { side: "Side by side", inline: "Inline", changes: "Changes only" };

function viewRegion(view: CompareView, label: string, inner: string): string {
  return `<div class="cap-compare-view" data-view="${view}" role="region" aria-label="${esc(label)}" tabindex="0">${inner}</div>`;
}

const fmtCounts = (c: Counts) => `<p class="cap-compare-counts" data-cap-part="counts">${esc(countsText(c))}</p>`;

function legend(c: Counts): string {
  return `<div class="cap-compare-legend">
<ul class="cap-compare-key" aria-label="Key to the marks">
<li><span class="cap-compare-key-mark" data-kind="ins">Added</span> underlined, with a plus</li>
<li><span class="cap-compare-key-mark" data-kind="del">Removed</span> struck through, with a minus</li>
</ul>
${fmtCounts(c)}
<dl class="cap-compare-views-help">
<div><dt>Side by side</dt><dd>before on the left, after on the right, sentence by sentence</dd></div>
<div><dt>Inline</dt><dd>one column, with each removal and addition where it happened</dd></div>
<div><dt>Changes only</dt><dd>just the changed sentences</dd></div>
</dl>
</div>`;
}

function jump(id: string, total: number): string {
  let items = "";
  for (let n = 1; n <= total; n++) {
    items += `<li><a class="cap-compare-jump-link" href="#${id}-c${n}" data-jump="${n}"><span class="cap-sr-only">Change </span>${n}<span class="cap-sr-only"> of ${total}</span></a></li>`;
  }
  return `<div class="cap-compare-tools"><nav class="cap-compare-jump" aria-label="Changes">
<span class="cap-compare-jump-title" aria-hidden="true">Jump to</span>
<button type="button" class="cap-btn" data-size="sm" data-cap-part="prev" hidden>Previous change <kbd class="cap-kbd">p</kbd></button>
<button type="button" class="cap-btn" data-size="sm" data-cap-part="next" hidden>Next change <kbd class="cap-kbd">n</kbd></button>
<ol class="cap-compare-jump-list">${items}</ol>
</nav>
<button type="button" class="cap-btn" data-size="sm" data-cap-part="expand" aria-pressed="false" hidden>Expand all unchanged</button></div>`;
}

function viewSwitch(id: string, view: CompareView): string {
  const radios = VIEWS.map((v) => `<label><input type="radio" name="${id}-view" value="${v}"${v === view ? " checked" : ""} /> ${VIEW_NAMES[v]}</label>`).join("");
  return `<fieldset class="cap-seg"><legend class="cap-sr-only">View</legend><div class="cap-seg-options" data-size="sm">${radios}</div></fieldset>`;
}

// The compared versions, as the HTML a page delivers: both sides named, a switch between three
// views, a legend with the counts, jump links to each change, and all three views in full.
// Safe to call on a server; the string needs no script to read. Call enhance() in the page
// for the jump keys, the remembered view and "expand all".
export function renderCompare(before: CompareSide, after: CompareSide, options: CompareOptions = {}): string {
  const id = options.id ?? "compare";
  const view = options.view ?? "side";
  const labels: CompareLabels = { before: "Before", after: "After", ...options.labels };
  const an = analyze(before.text, after.text, options);
  const name = `Compare ${before.title} with ${after.title}`;
  const attrs = `class="cap-compare" data-cap="draft-compare" id="${id}" aria-label="${esc(name)}"${options.remember === false ? ' data-remember="off"' : ""}`;
  const head = `<div class="cap-compare-head">${sideHead(labels.before, before, "before")}${sideHead(labels.after, after, "after")}</div>`;

  if (an.identical) {
    const words = (s: CompareSide) => `“${esc(s.title)}”${s.who || s.time ? ` (${[s.who ? esc(s.who) : "", s.time ? timeHtml(s.time) : ""].filter(Boolean).join(", ")})` : ""}`;
    const ctx: Ctx = { id, an, opts: options, total: 0, labels };
    const flow = `<div class="cap-compare-flow">${paragraphs(ctx, 0, an.entries.length, false, { k: null })}</div>`;
    return `<section ${attrs}>${head}<p class="cap-compare-none" role="status"><strong>No differences.</strong> ${words(before)} and ${words(after)} read the same, word for word.</p>${an.entries.length ? `<div class="cap-compare-view" data-view="same" role="region" aria-label="The text, the same on both sides" tabindex="0">${flow}</div>` : ""}</section>`;
  }

  const ctx: Ctx = { id, an, opts: options, total: an.counts.changes, labels };
  const body = (v: CompareView) => (v === "side" ? renderSide(ctx, v === view) : v === "inline" ? renderInline(ctx, v === view) : renderChanges(ctx, v === view));
  const views = VIEWS.map((v) => viewRegion(v, `${VIEW_NAMES[v]}, ${name}`, body(v))).join("");
  return `<section ${attrs}>${head}<div class="cap-compare-bar">${viewSwitch(id, view)}${legend(an.counts)}</div>${jump(id, an.counts.changes)}<p class="cap-sr-only" role="status" data-cap-part="live"></p><div class="cap-compare-views">${views}</div></section>`;
}
