import type { ReactNode } from "react";

// "muted" is the quiet gray for a state that is neither good nor bad: queued, unknown.
export type Tone = "crit" | "warn" | "ok" | "info" | "nodata" | "muted";
// A glyph is named by its tone, except running, which is an info tone with an arc, and the
// marks a state or a kind of item has of its own (the Portal's queued, unknown, blocked,
// and its inbox kinds). The quiet gray "muted" draws the no data circle unless a glyph is named.
export type GlyphName =
  | Tone
  | "running"
  | "queued"
  | "unknown"
  | "blocked"
  | "question"
  | "pr"
  | "report"
  | "proposal"
  | "site-down";

const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false } as const;

// One shape per meaning, so the shape carries it without color. Marks inside a filled
// shape are cut out (evenodd), so the glyph reads on any background, a tint included.
export function Glyph({ name, tone }: { name: GlyphName; tone?: Tone }) {
  // A glyph on its own (a status icon beside a name, with no word of its own) takes its tone's
  // color from data-tone; inside a status or a pill it takes the word's.
  const attrs = { className: "cap-status-glyph", "data-tone": tone, ...box } as const;
  switch (name) {
    case "crit":
      return (
        <svg {...attrs}>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"
          />
        </svg>
      );
    case "warn":
      return (
        <svg {...attrs}>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"
          />
        </svg>
      );
    case "info":
      return (
        <svg {...attrs}>
          <rect
            x="1.5"
            y="1.5"
            width="13"
            height="13"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" />
        </svg>
      );
    case "ok":
      return (
        <svg {...attrs}>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"
          />
        </svg>
      );
    case "nodata":
    case "muted":
      return (
        <svg {...attrs}>
          <>
            <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M5 8h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        </svg>
      );
    case "queued":
      return (
        <svg {...attrs}>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "unknown":
    case "question":
      return (
        <svg {...attrs}>
          <circle
            cx="8"
            cy="8"
            r="6.2"
            fill={name === "question" ? "currentColor" : "none"}
            fillOpacity={name === "question" ? 0.18 : undefined}
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M6.1 6.4a1.95 1.95 0 1 1 2.9 1.7c-.6.3-1 .7-1 1.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11.7" r=".9" fill="currentColor" />
        </svg>
      );
    case "blocked":
      return (
        <svg {...attrs}>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M4 1.5h8A2.5 2.5 0 0 1 14.5 4v8a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 12V4A2.5 2.5 0 0 1 4 1.5zM5.7 4.8h1.5v6.4H5.7zM8.8 4.8h1.5v6.4H8.8z"
          />
        </svg>
      );
    case "pr":
      return (
        <svg {...attrs}>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="4.3" cy="3.4" r="1.8" />
            <circle cx="4.3" cy="12.6" r="1.8" />
            <circle cx="11.7" cy="12.6" r="1.8" />
            <path d="M4.3 5.2v5.6M11.7 10.8V7.1A2.5 2.5 0 0 0 9.2 4.6H7.4M8.9 3 7.3 4.6l1.6 1.6" />
          </g>
        </svg>
      );
    case "report":
      return (
        <svg {...attrs}>
          <path
            d="M3.4 14.5V2M3.4 2.5h8.7l-1.8 3 1.8 3H3.4"
            fill="currentColor"
            fillOpacity={0.18}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "proposal":
      return (
        <svg {...attrs}>
          <path
            d="M3.4 1.7h6.3l2.9 2.9v9.7H3.4z"
            fill="currentColor"
            fillOpacity={0.18}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M5.7 8h4.6M5.7 10.9h4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "site-down":
      return (
        <svg {...attrs}>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM7.2 4h1.6v4.1l1.5-1.5 1.1 1.1L8 11 4.6 7.7l1.1-1.1 1.5 1.5z"
          />
        </svg>
      );
    case "running":
      return (
        <svg {...attrs}>
          <circle
            cx="8"
            cy="8"
            r="6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity="0.35"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2"
          />
        </svg>
      );
  }
}

export interface StatusProps {
  tone: Tone;
  // Running is an info tone drawn with an arc.
  running?: boolean;
  // The word: "Critical", "Down", "2 blocked". Never empty: the word is the status.
  children: ReactNode;
  // The mark of a state or kind of item that has its own shape (queued, blocked, a pull
  // request); the tone still sets the color. Without it the tone's own glyph.
  glyph?: GlyphName;
  // No data says why: "the counter has not reported since 09:00".
  reason?: ReactNode;
  // For a table cell, where a sentence does not fit: the cell says the word and nothing
  // more, the reason is read out by a screen reader (and shown on hover, when it is text),
  // and the full sentence is in the row's detail. The Portal's NoData brief (design D18).
  brief?: boolean;
  // A phrase that wraps in its own column (a hold reason) instead of staying on one line; the
  // glyph stays at the first line.
  wrap?: boolean;
}

function glyphFor(tone: Tone, running?: boolean, glyph?: GlyphName): GlyphName {
  if (glyph) return glyph;
  if (running) return "running";
  return tone;
}

export function Status({ tone, running, glyph, children, reason, brief, wrap }: StatusProps) {
  if (brief && reason) {
    return (
      <span
        className="cap-status"
        data-tone={tone}
        data-wrap={wrap ? "" : undefined}
        title={typeof reason === "string" ? reason : undefined}
      >
        <Glyph name={glyphFor(tone, running, glyph)} />
        {children}
        <span className="cap-sr-only">: {reason}</span>
      </span>
    );
  }
  const word = (
    <span className="cap-status" data-tone={tone} data-wrap={wrap ? "" : undefined}>
      <Glyph name={glyphFor(tone, running, glyph)} />
      {children}
    </span>
  );
  if (!reason) return word;
  // The reason follows the word as its own sentence, with a real space between, so a
  // screen reader does not run the two together.
  return (
    <>
      {word} <span className="cap-status-reason">{reason}</span>
    </>
  );
}

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "link"
  // The family's accent tint, with no glyph: a category that is not a state (a kind of
  // attribution, a plan).
  | "accent"
  // A label on its tint with an edge in its own color, set in the site's tag face (--tag-*
  // tokens): a site whose badges are tags (Foxhound's upper-case mono badges).
  | "tag";

export interface PillProps {
  // A status tone: the word and glyph on the tone's tint. Without a variant it is a status
  // badge; with one, outline and ghost keep the tone's color.
  tone?: Tone;
  // shadcn's badge variants. Leave out for the tinted status badge (or a quiet gray one).
  variant?: BadgeVariant;
  // Running is an info tone drawn with an arc.
  running?: boolean;
  // The mark of a state or kind that has its own shape; the tone sets the color. false leaves
  // the glyph out, for a site whose badges are words alone: the word must then say the state.
  glyph?: GlyphName | false;
  // A dot in the series color 1 to 8, before the word: a label the person colored (a status
  // list's labels). The word carries the meaning; the dot only repeats it. Give it with a
  // variant (outline for the quiet edge).
  series?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  // The color family of this badge's accent: "purple", "amber" and the rest of Capsomer's
  // families. A site's own hue for the accent variant, kept in tokens.
  family?: string;
  // The word. A badge with a tone also draws that tone's glyph, so shape and word carry it.
  children: ReactNode;
  // A link badge: a real <a>. Its hit area grows to the target size.
  href?: string;
  // A button badge. Give href or onClick, not both.
  onClick?: () => void;
}

// The badge: a status on its tint (tone), or one of the six variants. A tone always draws
// its glyph; a variant with no tone is just the word (or a count).
export function Pill({
  tone,
  variant,
  running,
  glyph,
  series,
  family,
  children,
  href,
  onClick,
}: PillProps) {
  const inner = (
    <>
      {tone && glyph !== false ? <Glyph name={glyphFor(tone, running, glyph)} /> : null}
      {series ? <span className="cap-pill-dot" aria-hidden="true" /> : null}
      {children}
    </>
  );
  const common = {
    className: "cap-pill",
    "data-tone": tone,
    "data-variant": variant,
    "data-series": series,
    "data-family": family,
  } as const;
  if (href)
    return (
      <a {...common} href={href}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button type="button" {...common} onClick={onClick}>
        {inner}
      </button>
    );
  return <span {...common}>{inner}</span>;
}
