import { useEffect, useState, type ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";
import {
  allVisibleSelected,
  failedIds,
  toggleAllVisible,
  toggleOne,
  visibleSelection,
  countText,
  fillCount,
  orderOutcomes,
  outcomeSummary,
  performBulk,
  type BulkItem,
  type BulkOutcome,
} from "./bulk-bar.ts";
import { useCleanId, useHydrated } from "../hooks/hooks.react.tsx";

export type { BulkOutcome };

export interface BulkBarAction {
  id: string;
  label: ReactNode;
  destructive?: boolean;
  // Templates with {n} and {s}: "Bin {n} item{s}?", "This cannot be undone.", "Bin {n} item{s}".
  confirmTitle?: string;
  confirmLead?: string;
  confirmAction?: string;
  // What the message region says afterwards, and after Undo.
  said?: string;
  undone?: string;
  // Form mode: a submit button of the bar's form, named `intent` with the action's id as value.
  // `run` is unused; the server answers.
  submit?: boolean;
  run?: (items: readonly BulkItem[]) => void | Promise<void>;
  // The app's own flow does the whole action: the bar hands it the selection and says nothing.
  // `run`, the confirm fields, `said` and `undo` are unused; the selection stays until the app clears it.
  handOff?: (items: readonly BulkItem[]) => void;
  // Reverses a reversible action: the region offers Undo.
  undo?: (items: readonly BulkItem[]) => void | Promise<void>;
  disabled?: boolean;
}

export interface BulkBarProps {
  // The bar is `hidden` (still rendered) while the selection is empty.
  items: readonly BulkItem[];
  actions: readonly BulkBarAction[];
  // Called after an action ran and by Clear selection.
  onClear: () => void;
  // Shown while fewer than `total` are selected.
  total?: number;
  onSelectAll?: () => void;
  // Quiet text after the count, such as a size.
  detail?: ReactNode;
  position?: "bottom" | "top";
  // Where focus goes when the bar goes away.
  returnTo?: HTMLElement | null;
  // Extra controls before the actions (a tag field).
  children?: ReactNode;
  label?: string;
  // Form mode: the id of the form the selection belongs to. The bar is in the delivered page without
  // script and hides itself only after load with nothing ticked.
  form?: string;
  // Form mode: the count's words before script runs.
  prompt?: string;
  // The just-run action's outcomes, refusals first; the bar stays in view while any exist.
  outcomes?: readonly BulkOutcome[];
  // Dismiss results; shown only once the page has loaded.
  onDismissOutcomes?: () => void;
}

export function BulkBar({
  items,
  actions,
  onClear,
  total,
  onSelectAll,
  detail,
  position = "bottom",
  returnTo,
  children,
  label = "Bulk actions",
  form,
  prompt,
  outcomes = [],
  onDismissOutcomes,
}: BulkBarProps) {
  const mounted = useHydrated();
  const resultsId = `${useCleanId()}-results`;
  const showing = outcomes.length > 0;
  const n = items.length;
  // A status region shown and filled in one step is often missed, so the count is written a frame later.
  const [shown, setShown] = useState(n);
  useEffect(() => {
    if (n === 0) {
      // oxlint-disable-next-line react/set-state-in-effect -- the count is written a frame after the bar appears, so screen readers hear it
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
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates the events of the controls inside it
    <div
      className="cap-bulk"
      data-cap="bulk-bar"
      role="region"
      aria-label={label}
      data-position={position === "top" ? "top" : undefined}
      hidden={(form ? mounted && n === 0 : n === 0) && !showing}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented && n > 0) {
          e.preventDefault();
          onClear();
        }
      }}
    >
      <p className="cap-bulk-count" role="status">
        {shown > 0
          ? countText(shown)
          : !mounted && form && prompt
            ? prompt
            : showing && mounted
              ? "Nothing selected"
              : ""}
        {shown > 0 && detail ? (
          <>
            {" "}
            <span className="cap-bulk-detail">{detail}</span>
          </>
        ) : null}
      </p>
      {onSelectAll && total != null && n < total ? (
        <button
          type="button"
          className="cap-btn"
          data-variant="quiet"
          data-cap-part="select-all"
          onClick={onSelectAll}
        >
          {fillCount("Select all {n} in view", total)}
        </button>
      ) : null}
      <div className="cap-bulk-actions">
        {children}
        {actions.map((a) =>
          a.submit ? (
            <button
              key={a.id}
              type="submit"
              form={form}
              name="intent"
              value={a.id}
              className="cap-btn"
              data-variant={a.destructive ? "danger" : undefined}
              aria-disabled={a.disabled || undefined}
              onClick={(e) => a.disabled && e.preventDefault()}
            >
              {a.label}
            </button>
          ) : (
            <button
              key={a.id}
              type="button"
              className="cap-btn"
              data-variant={a.destructive ? "danger" : undefined}
              data-cap-bulk-action={a.id}
              aria-disabled={a.disabled || undefined}
              onClick={() => (a.disabled ? undefined : a.handOff ? a.handOff(items) : void run(a))}
            >
              {a.label}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="cap-btn cap-bulk-clear"
        data-variant="quiet"
        onClick={onClear}
      >
        Clear selection
      </button>
      {showing ? (
        <div
          className="cap-bulk-results"
          data-cap-part="results"
          role="group"
          aria-labelledby={resultsId}
        >
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
            <button
              type="button"
              className="cap-btn"
              data-variant="quiet"
              data-size="sm"
              data-cap-part="dismiss-results"
              hidden={!mounted}
              onClick={onDismissOutcomes}
            >
              Dismiss results
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface BulkSelection {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
  clear: () => void;
  keepFailed: (outcomes: readonly BulkOutcome[]) => void;
}

// A React list's selection: stored ids, read through what is in view, so a filter or a new page
// never leaves a hidden row selected.
export function useBulkSelection(rows: ReadonlyArray<{ id: string }>): BulkSelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const ids = visibleSelection(selected, rows);
  const allSelected = allVisibleSelected(selected, rows);
  return {
    ids,
    has: (id) => selected.has(id) && rows.some((r) => r.id === id),
    toggle: (id) => setSelected((s) => toggleOne(s, id)),
    toggleAll: () => setSelected((s) => toggleAllVisible(s, rows)),
    allSelected,
    someSelected: ids.length > 0 && !allSelected,
    clear: () => setSelected(new Set()),
    keepFailed: (outcomes) => setSelected(failedIds(outcomes)),
  };
}
