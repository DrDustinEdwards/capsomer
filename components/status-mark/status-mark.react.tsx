import type { ReactNode } from "react";
import { iconCheck, iconClose } from "../icons/icons.ts";

export type MarkTone = "ok" | "crit" | "warn" | "info";

const PATH: Record<MarkTone, string> = {
  ok: iconCheck,
  crit: iconClose,
  warn: "M12 6v7M12 17.5v.5",
  info: "M12 11v7M12 6.5v.5",
};

// The round mark over a one-purpose page's sentence: a check, a cross, a bar, by tone. It only
// repeats what the heading and the sentence say, so it is hidden from screen readers.
export function StatusMark({ tone }: { tone: MarkTone }) {
  return (
    <span className="cap-status-mark" data-tone={tone} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d={PATH[tone]} />
      </svg>
    </span>
  );
}

export interface ResultPageProps {
  // The page's h1: "Unsubscribed", "Link not valid".
  title: string;
  // Hide the h1 visually (a page whose sentence is its visible heading). Default false.
  titleHidden?: boolean;
  // The mark over the sentence; none while the page still asks (a confirm step).
  tone?: MarkTone;
  // The sentence: what happened. A polite status, so the result is announced after a post.
  children: ReactNode;
  // The one action (a confirm button, its form) and the way back.
  actions?: ReactNode;
  // The site's mark or wordmark above the card.
  brand?: ReactNode;
}

// A one-purpose page (unsubscribe, a card update, a connect result): the site's mark, then one card
// holding the mark, the sentence and the way on, centered in the window's middle. Its main is the
// page's; the site header goes above it.
export function ResultPage({
  title,
  titleHidden,
  tone,
  children,
  actions,
  brand,
}: ResultPageProps) {
  return (
    <main id="main" tabIndex={-1} className="cap-result">
      <h1 className={titleHidden ? "cap-sr-only" : "cap-result-title"}>{title}</h1>
      {brand ? <div className="cap-result-brand">{brand}</div> : null}
      <div className="cap-panel">
        <div className="cap-result-body">
          {tone ? <StatusMark tone={tone} /> : null}
          <p role="status" className="cap-result-text">
            {children}
          </p>
          {actions ? <div className="cap-result-actions">{actions}</div> : null}
        </div>
      </div>
    </main>
  );
}
