import { useRef, type ReactNode } from "react";
import { focusMain } from "./banner.ts";
import { Glyph, type GlyphName } from "../status/status.react.tsx";

export type NoticeTone = "neutral" | "info" | "ok" | "warn" | "crit";

// The glyph is a shape per tone, so the tone is never color alone. Neutral takes the
// notice square in the muted ink.
const glyphFor: Record<NoticeTone, GlyphName> = { neutral: "info", info: "info", ok: "ok", warn: "warn", crit: "crit" };

export interface BannerProps {
  // A banner with no tone is a warning.
  tone?: NoticeTone;
  // An optional short title above the words: "Signed out".
  title?: ReactNode;
  // What happened and what is on screen now: "Could not refresh. Showing data from 4
  // minutes ago."
  children?: ReactNode;
  // Block content under the words (a list, a second paragraph). It sits in a div, so a list is not inside a
  // paragraph; `children` stays the inline words in a p.
  body?: ReactNode;
  // The next step, usually a Try again button.
  actions?: ReactNode;
  // Shown as a Dismiss button when given. Focus inside the banner moves to the page's main region first, as the
  // HTML behavior's dismissBanner does, so it is never left on nothing when the banner goes. A banner about data that is still stale
  // usually has none: it goes when the data is fresh again.
  onDismiss?: () => void;
}

// A critical banner interrupts (role="alert"); every other one is polite (role="status").
export function Banner({ tone = "warn", title, children, body, actions, onDismiss }: BannerProps) {
  const root = useRef<HTMLDivElement>(null);
  const dismiss = () => {
    if (root.current?.contains(document.activeElement)) focusMain(root.current);
    onDismiss?.();
  };
  return (
    <div className="cap-banner" data-tone={tone} role={tone === "crit" ? "alert" : "status"} ref={root}>
      <Glyph name={glyphFor[tone]} />
      {title || body ? (
        <div className="cap-banner-body">
          {title ? <p className="cap-banner-title">{title}</p> : null}
          {children ? <p className="cap-banner-text">{children}</p> : null}
          {body ? <div className="cap-banner-text">{body}</div> : null}
        </div>
      ) : (
        <p className="cap-banner-text">{children}</p>
      )}
      {actions || onDismiss ? (
        <div className="cap-banner-actions">
          {actions}
          {onDismiss ? (
            <button type="button" className="cap-btn" data-variant="quiet" onClick={dismiss}>
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface AlertProps {
  // An alert with no tone is critical.
  tone?: NoticeTone;
  // An optional short title: "Could not save the schedule".
  title?: ReactNode;
  // Plain words, and what to do next: "Check the cron line and save again."
  children: ReactNode;
  action?: ReactNode;
  // So the source can point at it with aria-describedby.
  id?: string;
}

// An alert interrupts (role="alert"): it is added when the failure happens.
export function Alert({ tone = "crit", title, children, action, id }: AlertProps) {
  return (
    <div className="cap-alert" data-tone={tone} role="alert" id={id}>
      <Glyph name={glyphFor[tone]} />
      {title ? (
        <div className="cap-alert-body">
          <p className="cap-alert-title">{title}</p>
          <p className="cap-alert-text">{children}</p>
        </div>
      ) : (
        <span className="cap-alert-text">{children}</span>
      )}
      {action ? <div className="cap-alert-action">{action}</div> : null}
    </div>
  );
}
