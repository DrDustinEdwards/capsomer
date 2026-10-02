import type { ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";

// Spinner and Skeleton moved to components/skeleton in 0.2; still exported here so
// "capsomer/react/empty" imports keep working.
export { Skeleton, Spinner, SkeletonBlock } from "../skeleton/skeleton.react.tsx";

export type EmptyKind = "nothing-yet" | "no-match" | "all-clear" | "failed";

export interface EmptyProps {
  kind: EmptyKind;
  // nothing-yet: "No sites are watched yet". no-match: "No jobs match “Blocked”".
  // failed: "Could not load the queue". all-clear: defaults to "All clear".
  title?: ReactNode;
  // One plain sentence: how to add the first, what the filter hides, what failed.
  children?: ReactNode;
  // nothing-yet: the one way to add the first. no-match: Clear filter. failed: Try again.
  action?: ReactNode;
  // An icon in a muted tile above the title (an svg). Decorative: the title says it.
  icon?: ReactNode;
  // No edge, for inside a panel or a table that already has one.
  flush?: boolean;
}

export function Empty({ kind, title, children, action, icon, flush }: EmptyProps) {
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
    <div className="cap-empty" data-kind={kind} data-flush={flush ? "" : undefined} role={kind === "failed" ? "alert" : undefined}>
      {icon ? (
        <div className="cap-empty-media" data-variant="icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div className="cap-empty-header">
        <p className="cap-empty-title">{head}</p>
        {children ? <p className="cap-empty-text">{children}</p> : null}
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
