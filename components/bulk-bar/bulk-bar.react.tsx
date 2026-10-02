import { useEffect, useState, type ReactNode } from "react";
import { countText, fillCount, performBulk, type BulkItem } from "./bulk-bar.ts";

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
  run: (items: readonly BulkItem[]) => void | Promise<void>;
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
}

export function BulkBar({ items, actions, onClear, total, onSelectAll, detail, position = "bottom", returnTo, children, label = "Bulk actions" }: BulkBarProps) {
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
      run: a.run,
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
    <div className="cap-bulk" data-cap="bulk-bar" role="region" aria-label={label} data-position={position === "top" ? "top" : undefined} hidden={n === 0} onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented && n > 0) {
          e.preventDefault();
          onClear();
        }
      }}>
      <p className="cap-bulk-count" role="status">
        {shown > 0 ? countText(shown) : ""}
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
        {actions.map((a) => (
          <button key={a.id} type="button" className="cap-btn" data-variant={a.destructive ? "danger" : undefined} data-cap-bulk-action={a.id} aria-disabled={a.disabled || undefined} onClick={() => (a.disabled ? undefined : void run(a))}>
            {a.label}
          </button>
        ))}
      </div>
      <button type="button" className="cap-btn cap-bulk-clear" data-variant="quiet" onClick={onClear}>
        Clear selection
      </button>
    </div>
  );
}
