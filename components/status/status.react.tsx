import type { ReactNode } from "react";

import { createElement } from "react";
import { STATUS_GLYPH, type GlyphName, type Tone } from "./status.ts";

export type { GlyphName, Tone };

const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false } as const;
// SVG attribute names as React spells them ("fill-rule" is fillRule).
const reactName = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// One shape per meaning (STATUS_GLYPH in status.ts, which the HTML renderer draws too).
export function Glyph({ name }: { name: GlyphName }) {
  return (
    <svg className="cap-status-glyph" {...box}>
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
  // No data says why: "the counter has not reported since 09:00".
  reason?: ReactNode;
  // For a table cell, where a sentence does not fit: the cell says the word and nothing
  // more, the reason is read out by a screen reader (and shown on hover, when it is text),
  // and the full sentence is in the row's detail. The Portal's NoData brief (design D18).
  brief?: boolean;
}

function glyphFor(tone: Tone, running?: boolean): GlyphName {
  return running ? "running" : tone;
}

export function Status({ tone, running, children, reason, brief }: StatusProps) {
  if (brief && reason) {
    return (
      <span
        className="cap-status"
        data-tone={tone}
        title={typeof reason === "string" ? reason : undefined}
      >
        <Glyph name={glyphFor(tone, running)} />
        {children}
        <span className="cap-sr-only">: {reason}</span>
      </span>
    );
  }
  const word = (
    <span className="cap-status" data-tone={tone}>
      <Glyph name={glyphFor(tone, running)} />
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

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "ghost" | "link";

export interface PillProps {
  // A status tone: the word and glyph on the tone's tint. Without a variant it is a status
  // badge; with one, outline and ghost keep the tone's color.
  tone?: Tone;
  // shadcn's badge variants. Leave out for the tinted status badge (or a quiet gray one).
  variant?: BadgeVariant;
  // Running is an info tone drawn with an arc.
  running?: boolean;
  // The word. A badge with a tone also draws that tone's glyph, so shape and word carry it.
  children: ReactNode;
  // A link badge: a real <a>. Its hit area grows to the target size.
  href?: string;
  // A button badge. Give href or onClick, not both.
  onClick?: () => void;
}

// The badge: a status on its tint (tone), or one of the six variants. A tone always draws
// its glyph; a variant with no tone is just the word (or a count).
export function Pill({ tone, variant, running, children, href, onClick }: PillProps) {
  const inner = (
    <>
      {tone ? <Glyph name={glyphFor(tone, running)} /> : null}
      {children}
    </>
  );
  const common = { className: "cap-pill", "data-tone": tone, "data-variant": variant } as const;
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
