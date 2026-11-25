// One flag as a row of the row list (FlagList in flag-list.react.tsx renders them).
import { Glyph } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import { type AnchorStatus, type Flag as FlagData, type Resolution } from "./flag-list.ts";

const WORDS: Record<Resolution, string> = {
  resolved: "Resolved",
  dismissed: "Dismissed",
  applied: "Applied",
};

export interface FlagProps {
  flag: FlagData;
  anchor: AnchorStatus;
  owner: boolean;
  ownerName?: string;
  // The row's id prefix, so ids are unique when several lists are on a page.
  idPrefix: string;
  onResolve: () => void;
  onDismiss: () => void;
  onReopen: () => void;
  onApply: () => void;
  // A router's link component for the passage link; a plain <a> by default.
  now?: number;
}

// One flag as a row of the row list. Renders exactly the contract on the doc page.
export function Flag({
  flag,
  anchor,
  owner,
  ownerName,
  idPrefix,
  onResolve,
  onDismiss,
  onReopen,
  onApply,
  now,
}: FlagProps) {
  const id = `${idPrefix}-${flag.id}`;
  const open = flag.state === "open";
  const r: Resolution = flag.resolution ?? "resolved";
  const a = flag.anchor;
  const crit = flag.kind === "blocking";
  const sug = flag.suggestion;
  const applied = !open && r === "applied";
  const attrs: Record<string, string | undefined> = {
    "data-flag": flag.id,
    "data-kind": flag.kind,
    "data-state": flag.state,
    "data-anchor": a ? anchor : "none",
    "data-anchor-id": a?.id,
    "data-resolution": open ? undefined : r,
    "data-resolved-by": open ? undefined : flag.resolvedBy,
    "data-resolved-at": open ? undefined : flag.resolvedAt,
    "data-tone": crit && open ? "crit" : undefined,
  };
  const message = <span className="cap-flag-message">{flag.message}</span>;
  return (
    <li className="cap-row cap-flag" id={id} {...attrs}>
      <span className="cap-row-status" id={`${id}-s`}>
        <span className="cap-status" data-tone={crit ? "crit" : "warn"}>
          <Glyph name={crit ? "crit" : "warn"} />
          {crit ? "Blocking" : "Advisory"}
        </span>
      </span>
      <div className="cap-row-title">
        {a && anchor === "found" ? (
          <a href={`#${a.id}`} aria-describedby={`${id}-s ${id}-d`}>
            {message} <span className="cap-flag-goto">{a.label ?? "Go to passage"}</span>
          </a>
        ) : (
          <span className="cap-flag-title">
            {message}
            {a ? (
              <>
                {" "}
                <span className="cap-status" data-tone="nodata">
                  <Glyph name="nodata" />
                  Anchor lost
                </span>
              </>
            ) : null}
          </span>
        )}
      </div>
      <p className="cap-row-detail" id={`${id}-d`}>
        {flag.raisedBy ? `${flag.raisedBy}. ` : ""}Cause:{" "}
        <span data-cap-part="cause">{flag.cause}</span>
      </p>
      <span className="cap-row-meta">
        {open ? null : (
          <span className="cap-status" data-tone={r === "dismissed" ? "nodata" : "ok"}>
            <Glyph name={r === "dismissed" ? "nodata" : "ok"} />
            {WORDS[r]}
          </span>
        )}
      </span>
      <div className="cap-row-actions">
        {open ? (
          <>
            <button
              type="button"
              className="cap-btn"
              data-size="sm"
              data-cap-part="resolve"
              onClick={onResolve}
            >
              Resolve<span className="cap-sr-only"> flag: {flag.message}</span>
            </button>
            <button
              type="button"
              className="cap-btn"
              data-size="sm"
              data-variant="quiet"
              data-cap-part="dismiss"
              onClick={onDismiss}
            >
              Dismiss<span className="cap-sr-only"> flag: {flag.message}</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="cap-btn"
            data-size="sm"
            data-cap-part="reopen"
            onClick={onReopen}
          >
            Reopen<span className="cap-sr-only"> flag: {flag.message}</span>
          </button>
        )}
      </div>
      <div className="cap-flag-body">
        {a ? (
          <blockquote className="cap-flag-quote">
            <p
              className="cap-flag-anchor-note"
              data-cap-part="anchor-note"
              hidden={anchor !== "lost"}
            >
              {anchor === "lost"
                ? "The text this flag was raised on changed or was removed. Last known text:"
                : null}
            </p>
            <p>
              <span className="cap-sr-only">Quoted passage: </span>
              <q className="cap-flag-quote-text">{a.quote}</q>
            </p>
          </blockquote>
        ) : null}
        {sug && a ? (
          <div className="cap-flag-suggestion" data-state={applied ? "applied" : "inert"}>
            <p className="cap-flag-suggestion-head">Suggested by {sug.by ?? "a reviewer"}</p>
            <div className="cap-flag-diff">
              <del>
                <span className="cap-flag-mark" aria-hidden="true">
                  &minus;
                </span>
                <span className="cap-sr-only">Before: </span>
                {a.quote}
              </del>
              <ins>
                <span className="cap-flag-mark" aria-hidden="true">
                  +
                </span>
                <span className="cap-sr-only">After: </span>
                <span className="cap-flag-after-text">{sug.replacement}</span>
              </ins>
            </div>
            <div className="cap-flag-suggestion-foot" data-cap-part="suggestion-foot">
              {applied || !open ? null : anchor !== "found" ? (
                <p className="cap-flag-note">
                  Cannot be applied: the passage it replaces has changed or gone.
                </p>
              ) : owner ? (
                <>
                  <button
                    type="button"
                    className="cap-btn"
                    data-size="sm"
                    data-variant="primary"
                    data-cap-part="apply"
                    onClick={onApply}
                  >
                    Apply<span className="cap-sr-only"> suggestion: {flag.message}</span>
                  </button>
                </>
              ) : (
                <p className="cap-flag-note">
                  Only the owner{ownerName ? `, ${ownerName},` : ""} can apply this. The draft stays
                  as it is until they do.
                </p>
              )}
            </div>
          </div>
        ) : null}
        {!open ? (
          <p className="cap-flag-resolution">
            {WORDS[r]}
            {flag.resolvedBy ? ` by ${flag.resolvedBy}` : ""}
            {flag.resolvedAt ? (
              <>
                {" "}
                <Time at={flag.resolvedAt} now={now} />
              </>
            ) : null}
            .
          </p>
        ) : null}
      </div>
    </li>
  );
}
