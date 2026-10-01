import type { ReactNode } from "react";

export type Tone = "crit" | "warn" | "ok" | "info" | "nodata";
// A glyph is named by its tone, except running, which is an info tone with an arc.
export type GlyphName = Tone | "running";

const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false } as const;

// One shape per meaning, so the shape carries it without colour. Marks inside a filled
// shape are cut out (evenodd), so the glyph reads on any background, a tint included.
export function Glyph({ name }: { name: GlyphName }) {
  switch (name) {
    case "crit":
      return (
        <svg className="cap-status-glyph" {...box}>
          <path fill="currentColor" fillRule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
        </svg>
      );
    case "warn":
      return (
        <svg className="cap-status-glyph" {...box}>
          <path fill="currentColor" fillRule="evenodd" d="M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" />
        </svg>
      );
    case "info":
      return (
        <svg className="cap-status-glyph" {...box}>
          <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" />
        </svg>
      );
    case "ok":
      return (
        <svg className="cap-status-glyph" {...box}>
          <path fill="currentColor" fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z" />
        </svg>
      );
    case "nodata":
      return (
        <svg className="cap-status-glyph" {...box}>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2.2" />
        </svg>
      );
    case "running":
      return (
        <svg className="cap-status-glyph" {...box}>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
          <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2" />
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
      <span className="cap-status" data-tone={tone} title={typeof reason === "string" ? reason : undefined}>
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

export function Pill({ tone, running, children }: Omit<StatusProps, "reason" | "brief">) {
  return (
    <span className="cap-pill" data-tone={tone}>
      <Glyph name={glyphFor(tone, running)} />
      {children}
    </span>
  );
}
