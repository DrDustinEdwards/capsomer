import type { ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";

export interface BannerProps {
  tone?: "warn" | "crit";
  // What happened and what is on screen now: "Could not refresh. Showing data from 4
  // minutes ago."
  children: ReactNode;
  // The next step, usually a Try again button.
  actions?: ReactNode;
  // Shown as a Dismiss button when given. A banner about data that is still stale
  // usually has none: it goes when the data is fresh again.
  onDismiss?: () => void;
}

// A warning banner is polite (role="status"); a critical one interrupts (role="alert").
export function Banner({ tone = "warn", children, actions, onDismiss }: BannerProps) {
  return (
    <div className="cap-banner" data-tone={tone} role={tone === "crit" ? "alert" : "status"}>
      <Glyph name={tone} />
      <p className="cap-banner-text">{children}</p>
      {actions || onDismiss ? (
        <div className="cap-banner-actions">
          {actions}
          {onDismiss ? (
            <button type="button" className="cap-btn" data-variant="quiet" onClick={onDismiss}>
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface AlertProps {
  // Plain words, and what to do next: "Could not save the schedule. Check the cron line
  // and save again."
  children: ReactNode;
  action?: ReactNode;
  // So the source can point at it with aria-describedby.
  id?: string;
}

export function Alert({ children, action, id }: AlertProps) {
  return (
    <div className="cap-alert" role="alert" id={id}>
      <Glyph name="crit" />
      <span className="cap-alert-text">{children}</span>
      {action}
    </div>
  );
}
