import { useEffect, useId, useState, type ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";
import { countText, fillCount, orderOutcomes, outcomeSummary, performBulk, type BulkItem, type BulkOutcome } from "./bulk-bar.ts";

export type { BulkOutcome };

export interface BulkBarAction {
  id: string;
  label: ReactNode;
  // A one-way action previews every item in the confirm dialog before it runs.
  destructive?: boolean;
  // Templates with {n} and {s}: "Bin {n} item{s}?", "This cannot be undone.", "Bin {n} item{s}".
  confirmTitle?: string;
  confirmLead?: string;
  confirmAction?: string;
  // What the message region says afterwards, and after Undo.
  said?: string;
  undone?: string;
  // Form mode (the bar has `form`): the action is a submit button of that form, named `intent`
  // with the action's id as the value. `run` is not used, the server answers.
  submit?: boolean;
  run?: (items: readonly BulkItem[]) => void | Promise<void>;
  // Reverses a reversible action: the region offers Undo.
  undo?: (items: readonly BulkItem[]) => void | Promise<void>;
  disabled?: boolean;
}

export interface BulkBarProps {
  // The selection. The bar is `hidden` (still rendered) while it is empty.
  items: readonly BulkItem[];
  actions: readonly BulkBarAction[];
  // Called after an action ran and by Clear selection: the app empties its selection.
  onClear: () => void;
  // "Select all 24 in view": shown while fewer than `total` are selected.
  total?: number;
  onSelectAll?: () => void;
  // Quiet text after the count, such as the size: "2.4 MB".
  detail?: ReactNode;
  position?: "bottom" | "top";
  // Where focus goes when the bar goes away.
  returnTo?: HTMLElement | null;
  // Extra controls before the actions (a tag field).
  children?: ReactNode;
  label?: string;
  // Form mode: the id of the form the selection belongs to (the checkboxes sit in it or name it
  // with their own `form`). Actions with `submit` post it. The bar is in the delivered page
  // without script and hides itself only after the page has loaded and nothing is ticked.
  form?: string;
  // Form mode: the count's words before script runs, when nothing can be counted ("Tick the
  // drafts to act on").
  prompt?: string;
  // The outcome of the action just run, one per item, refusals first. While there are any the
  // bar stays in view with nothing selected, so they can be read; a server renders them after a
  // form post, with no script.
  outcomes?: readonly BulkOutcome[];
  // Dismiss results: the app empties `outcomes`. Shown only once the page has loaded.
  onDismissOutcomes?: () => void;
}

export function BulkBar({ items, actions, onClear, total, onSelectAll, detail, position = "bottom", returnTo, children, label = "Bulk actions", form, prompt, outcomes = [], onDismissOutcomes }: BulkBarProps) {
  const [mounted, setMounted] = useState(false);
  const resultsId = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-results`;
  const showing = outcomes.length > 0;
  useEffect(() => setMounted(true), []);
  const n = items.length;
  // A status region that is shown and filled in one step is often missed: the count is written
  // a frame after the bar appears.
  const [shown, setShown] = useState(n);
  useEffect(() => {
    if (n === 0) {
      setShown(0);
      return;
    }
    if (shown > 0) {
      setShown(n);
      return;
    }
    const f = requestAnimationFrame(() => setShown(n));
    return () => cancelAnimationFrame(f);
  }, [n, shown]);

  const run = async (a: BulkBarAction) => {
    const ok = await performBulk({
      action: typeof a.label === "string" ? a.label : a.id,
      items,
      run: a.run ?? (() => undefined),
      undo: a.undo,
      destructive: a.destructive,
      confirmTitle: a.confirmTitle,
      confirmLead: a.confirmLead,
      confirmAction: a.confirmAction,
      said: a.said,
      undone: a.undone,
      returnTo,
    });
    if (ok) onClear();
  };

  return (
    <div className="cap-bulk" data-cap="bulk-bar" role="region" aria-label={label} data-position={position === "top" ? "top" : undefined} hidden={(form ? mounted && n === 0 : n === 0) && !showing} onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented && n > 0) {
          e.preventDefault();
          onClear();
        }
      }}>
      <p className="cap-bulk-count" role="status">
        {shown > 0 ? countText(shown) : !mounted && form && prompt ? prompt : showing && mounted ? "Nothing selected" : ""}
        {shown > 0 && detail ? (
          <>
            {" "}
            <span className="cap-bulk-detail">{detail}</span>
          </>
        ) : null}
      </p>
      {onSelectAll && total != null && n < total ? (
        <button type="button" className="cap-btn" data-variant="quiet" data-cap-part="select-all" onClick={onSelectAll}>
          {fillCount("Select all {n} in view", total)}
        </button>
      ) : null}
      <div className="cap-bulk-actions">
        {children}
        {actions.map((a) => a.submit ? (
          <button key={a.id} type="submit" form={form} name="intent" value={a.id} className="cap-btn" data-variant={a.destructive ? "danger" : undefined} aria-disabled={a.disabled || undefined}>
            {a.label}
          </button>
        ) : (
          <button key={a.id} type="button" className="cap-btn" data-variant={a.destructive ? "danger" : undefined} data-cap-bulk-action={a.id} aria-disabled={a.disabled || undefined} onClick={() => (a.disabled ? undefined : void run(a))}>
            {a.label}
          </button>
        ))}
      </div>
      <button type="button" className="cap-btn cap-bulk-clear" data-variant="quiet" onClick={onClear}>
        Clear selection
      </button>
      {showing ? (
        <div className="cap-bulk-results" data-cap-part="results" role="group" aria-labelledby={resultsId}>
          <p className="cap-bulk-results-summary" id={resultsId}>
            {outcomeSummary(outcomes)}
          </p>
          <ul className="cap-bulk-results-list">
            {orderOutcomes(outcomes).map((o) => (
              <li key={o.id} data-ok={String(o.ok)}>
                <span className="cap-status" data-tone={o.ok ? "ok" : "crit"}>
                  <Glyph name={o.ok ? "ok" : "crit"} />
                  {o.ok ? "Done" : "Not done"}
                </span>{" "}
                <span className="cap-bulk-result-label">{o.label}</span>
                {o.message ? (
                  <>
                    {" "}
                    <span className="cap-bulk-result-message">{o.message}</span>
                  </>
                ) : null}
                {o.usedBy?.length ? (
                  <ul className="cap-bulk-result-uses">
                    {o.usedBy.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          {onDismissOutcomes ? (
            <button type="button" className="cap-btn" data-variant="quiet" data-size="sm" data-cap-part="dismiss-results" hidden={!mounted} onClick={onDismissOutcomes}>
              Dismiss results
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
