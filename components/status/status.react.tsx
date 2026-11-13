import type { ReactNode } from "react";

import { createElement } from "react";
import { STATUS_GLYPH, type GlyphName, type Tone } from "./status.ts";

export type { GlyphName, Tone };

const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false } as const;
// SVG attribute names as React spells them ("fill-rule" is fillRule).
const reactName = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// One shape per meaning (STATUS_GLYPH in status.ts, which the HTML renderer draws too).
// A glyph on its own (a status icon beside a name, with no word of its own) takes its tone's color
// from data-tone; inside a status or a pill it takes the word's.
export function Glyph({ name, tone }: { name: GlyphName; tone?: Tone }) {
  return (
    <svg className="cap-status-glyph" data-tone={tone} {...box}>
      {STATUS_GLYPH[name].map(({ tag, attrs }, i) =>
        createElement(tag, {
          key: i,
          ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [reactName(k), v])),
        }),
      )}
    </svg>
  );
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
