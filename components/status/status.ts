// The status word as an HTML string, for pages built without React (a static explorer, a server
// rendered table, an SVG drawing), and the one table of glyphs the React Status draws from too.
// Escaped here, so a reason or a label can never become markup.

export type Tone = "crit" | "warn" | "ok" | "info" | "nodata";
// A glyph is named by its tone, except running, which is an info tone with an arc.
export type GlyphName = Tone | "running";

// One element of a glyph: its tag and attributes, in SVG's own names. React and the string
// renderer both draw from these, so the shapes exist once.
export interface GlyphPart {
  tag: "path" | "rect" | "circle";
  attrs: Readonly<Record<string, string>>;
}

const ring = {
  cx: "8",
  cy: "8",
  r: "6.2",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.6",
};

// One shape per meaning, so the shape carries it without color. Marks inside a filled shape are
// cut out (evenodd), so the glyph reads on any background, a tint included. 16 by 16.
export const STATUS_GLYPH: Readonly<Record<GlyphName, readonly GlyphPart[]>> = {
  crit: [
    {
      tag: "path",
      attrs: {
        fill: "currentColor",
        "fill-rule": "evenodd",
        d: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z",
      },
    },
  ],
  warn: [
    {
      tag: "path",
      attrs: {
        fill: "currentColor",
        "fill-rule": "evenodd",
        d: "M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z",
      },
    },
  ],
  info: [
    {
      tag: "rect",
      attrs: {
        x: "1.5",
        y: "1.5",
        width: "13",
        height: "13",
        rx: "2",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.6",
      },
    },
    { tag: "path", attrs: { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" } },
  ],
  ok: [
    {
      tag: "path",
      attrs: {
        fill: "currentColor",
        "fill-rule": "evenodd",
        d: "M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z",
      },
    },
  ],
  nodata: [
    { tag: "circle", attrs: ring },
    {
      tag: "path",
      attrs: {
        d: "M5 8h6",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.6",
        "stroke-linecap": "round",
      },
    },
  ],
  running: [
    { tag: "circle", attrs: { ...ring, opacity: "0.35" } },
    {
      tag: "path",
      attrs: {
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.8",
        "stroke-linecap": "round",
        d: "M8 1.8a6.2 6.2 0 0 1 6.2 6.2",
      },
    },
  ],
};

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

// A glyph's inner elements as markup, for a page that draws it inside its own <svg> (a box in a
// graph at 12 px).
export function glyphParts(name: GlyphName): string {
  return STATUS_GLYPH[name]
    .map(({ tag, attrs }) => {
      const list = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join("");
      return `<${tag}${list}/>`;
    })
    .join("");
}

// The glyph as the status draws it: hidden from assistive technology, since the word says it.
export function glyphHtml(name: GlyphName): string {
  return `<svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${glyphParts(name)}</svg>`;
}

export interface StatusHtmlOptions {
  // Running is an info tone drawn with an arc.
  running?: boolean;
  // Why: "the counter has not reported since 09:00". Follows the word as its own sentence.
  reason?: string;
  // For a table cell: the word only, the reason for a screen reader and on hover.
  brief?: boolean;
}

// The status word, the same markup React's Status renders: the glyph, then the word, which is
// the accessible text and is never empty.
export function statusHtml(tone: Tone, label: string, options: StatusHtmlOptions = {}): string {
  const glyph = glyphHtml(options.running ? "running" : tone);
  const word = esc(label.trim() || (tone === "nodata" ? "No data" : tone));
  const reason = options.reason?.trim();
  if (options.brief && reason)
    return `<span class="cap-status" data-tone="${tone}" title="${esc(reason)}">${glyph}${word}<span class="cap-sr-only">: ${esc(reason)}</span></span>`;
  const status = `<span class="cap-status" data-tone="${tone}">${glyph}${word}</span>`;
  return reason ? `${status} <span class="cap-status-reason">${esc(reason)}</span>` : status;
}

// "startup_failure" as words: "Startup failure".
const sentence = (key: string): string => {
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export interface Outcome {
  tone: Tone;
  running: boolean;
  label: string;
}

// The conclusion of a run (a CI check, a build, a backup copy, a scheduled task) as a status. The
// words are GitHub's check-run conclusions and Cloudflare's build outcomes, which cover the rest:
// success and neutral are ok, skipped did not run (no data), cancelled and timed out stopped
// before an answer (warning), and every other conclusion failed. No conclusion yet is running.
// A site that words a state its own way passes `labels` ("Built", "Green").
export function outcomeStatus(
  conclusion: string | null | undefined,
  labels: Partial<Record<string, string>> = {},
): Outcome {
  const key = (conclusion ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const said = (fallback: string) => labels[key] ?? fallback;
  if (key === "") return { tone: "info", running: true, label: labels.running ?? "Running" };
  switch (key) {
    case "success":
    case "succeeded":
    case "passed":
      return { tone: "ok", running: false, label: said("Passed") };
    case "neutral":
      return { tone: "ok", running: false, label: said("Neutral") };
    case "skipped":
      return { tone: "nodata", running: false, label: said("Skipped") };
    case "cancelled":
    case "canceled":
      return { tone: "warn", running: false, label: said("Canceled") };
    case "timed_out":
      return { tone: "warn", running: false, label: said("Timed out") };
    case "stale":
      return { tone: "warn", running: false, label: said("Stale") };
    case "action_required":
      return { tone: "warn", running: false, label: said("Needs action") };
    case "queued":
    case "pending":
    case "in_progress":
    case "running":
    case "building":
      return { tone: "info", running: true, label: said(key === "queued" ? "Queued" : "Running") };
    default:
      return {
        tone: "crit",
        running: false,
        label: said(
          key === "failure" || key === "fail" || key === "failed" ? "Failed" : sentence(key),
        ),
      };
  }
}
