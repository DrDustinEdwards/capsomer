import type { ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";

export type EmptyKind = "nothing-yet" | "no-match" | "all-clear" | "failed";

interface EmptyBase {
  // nothing-yet: "No sites are watched yet". no-match: "No jobs match “Blocked”".
  // failed: "Could not load the queue". all-clear: defaults to "All clear".
  title?: ReactNode;
  // nothing-yet: the one way to add the first. no-match: Clear filter. failed: Try again.
  action?: ReactNode;
  icon?: ReactNode;
  flush?: boolean;
  // The title's element: a paragraph by default, a heading where the empty area is the page's
  // subject (the error page's h1).
  titleAs?: "p" | "h1" | "h2" | "h3";
  // A polite status, for an empty area that replaces the page's content when nothing failed (the
  // signed-out page). A failed one is always an alert.
  role?: "status";
}

// An empty state is its title and its one action; only a failure has a line under the title.
export type EmptyProps =
  | (EmptyBase & { kind: "failed"; children?: ReactNode })
  | (EmptyBase & { kind: Exclude<EmptyKind, "failed">; children?: never });

export function Empty({
  kind,
  title,
  children,
  action,
  icon,
  flush,
  titleAs: Title = "p",
  role,
}: EmptyProps) {
  let head: ReactNode;
  if (kind === "all-clear") {
    head = (
      <span className="cap-status" data-tone="ok">
        <Glyph name="ok" />
        {title ?? "All clear"}
      </span>
    );
  } else if (kind === "failed") {
    head = (
      <>
        <Glyph name="crit" />
        {title}
      </>
    );
  } else {
    head = title;
  }
  return (
    <div
      className="cap-empty"
      data-kind={kind}
      data-flush={flush ? "" : undefined}
      role={kind === "failed" ? "alert" : role}
    >
      {icon ? (
        <div className="cap-empty-media" data-variant="icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div className="cap-empty-header">
        <Title className="cap-empty-title">{head}</Title>
        {kind === "failed" && children ? <p className="cap-empty-text">{children}</p> : null}
      </div>
      {kind !== "all-clear" && action ? <div className="cap-empty-content">{action}</div> : null}
    </div>
  );
}

export interface WaitProps {
  label: string;
  // Over 10 seconds, say how long: "This usually takes about 30 seconds."
  children: ReactNode;
}

export function Wait({ label, children }: WaitProps) {
  return (
    <div className="cap-empty-wait" aria-busy="true">
      <Spinner label={label} />
      <p className="cap-empty-text">{children}</p>
    </div>
  );
}

export interface MissingProps {
  // The word for no value. Default "none".
  children?: ReactNode;
  // Why there is none, read out with the word (and shown on hover when it is text).
  reason?: string;
}

// No value in a table cell or a line of facts: a muted word, never a blank cell or a dash, so a
// screen reader says it and the eye sees it is missing on purpose.
export function Missing({ children = "none", reason }: MissingProps) {
  return (
    <span className="cap-missing" title={reason}>
      {children}
      {reason ? <span className="cap-sr-only">: {reason}</span> : null}
    </span>
  );
}
