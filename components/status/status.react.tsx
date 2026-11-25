import type { ReactNode } from "react";

import { createElement } from "react";
import { STATUS_GLYPH, type GlyphName, type Tone } from "./status.ts";

export type { GlyphName, Tone };

const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false } as const;
const reactName = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// A glyph on its own (no word of its own) takes its tone's color from data-tone; inside a status or pill it takes the word's.
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
  running?: boolean;
  children: ReactNode;
  // The mark of a state or kind with its own shape (queued, blocked, a pull request); the tone still sets the color.
  glyph?: GlyphName;
  reason?: ReactNode;
  // For a table cell: the cell says the word only, a screen reader reads the reason (shown on hover
  // when it is text), and the full sentence is in the row's detail.
  brief?: boolean;
  // Wraps in its own column (a hold reason) instead of one line; the glyph stays at the first line.
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
  // The reason follows the word with a real space between, so a screen reader does not run them together.
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
  | "accent"
  // A label on its tint with an edge in its own color, in the site's tag face (--tag-* tokens).
  | "tag";

export interface PillProps {
  // A status tone: the word and glyph on the tone's tint. With a variant, outline and ghost keep the tone's color.
  tone?: Tone;
  variant?: BadgeVariant;
  running?: boolean;
  // false leaves the glyph out, for a site whose badges are words alone: the word must then say the state.
  glyph?: GlyphName | false;
  // A dot in the series color 1 to 8 before the word, for a label the person colored. The word
  // carries the meaning; the dot only repeats it.
  series?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  family?: string;
  children: ReactNode;
  href?: string;
  // Give href or onClick, not both.
  onClick?: () => void;
}

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
