import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { approveLabel, titleText, type GateChoice } from "./approval-sheet.ts";

export type { GateChoice } from "./approval-sheet.ts";

export interface Gate {
  id: string;
  // The job's title, the gate's legend: "Deploy foxhound to production".
  title: string;
  // The exact command that will run.
  command: string;
  // One line under the title: "job_8c21 in foxhound, waiting 26 minutes".
  meta?: string;
  // Whether the gate starts checked; true by default.
  include?: boolean;
}

export interface ApprovalSheetProps {
  open: boolean;
  gates: Gate[];
  // Performs the approval. A returned promise holds the sheet pending until it settles: on
  // success the sheet closes, on failure its message shows beside the buttons.
  onApprove: (gates: GateChoice[]) => void | Promise<void>;
  // Called when the sheet closes, by Cancel, Esc or a successful approval.
  onClose: () => void;
  lead?: string;
}

export function ApprovalSheet({ open, gates, onApprove, onClose, lead = "Each command runs once, when approved. Uncheck a gate you are not ready for; it stays waiting." }: ApprovalSheetProps) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A fresh sheet each time it opens: every gate's starting choice, no comments, no error.
  useEffect(() => {
    if (!open) return;
    setChecked(Object.fromEntries(gates.map((g) => [g.id, g.include ?? true])));
    setComments({});
    setError(null);
    setPending(false);
  }, [open]);

  const chosen: GateChoice[] = gates.filter((g) => checked[g.id] ?? g.include ?? true).map((g) => ({ id: g.id, comment: (comments[g.id] ?? "").trim() }));
  const n = chosen.length;
  const noneId = `${id}-none`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (n === 0 || pending) return;
    setError(null);
    const result = onApprove(chosen);
    if (!result || typeof (result as Promise<void>).then !== "function") return;
    setPending(true);
    try {
      await result;
      setPending(false);
      // Closing fires the dialog's close event, which calls onClose.
      ref.current?.close();
    } catch (err) {
      setPending(false);
      setError(err instanceof Error && err.message ? err.message : "Could not approve. Nothing was approved. Try again.");
    }
  };

  // The shared Dialog does the opening, focus (on Cancel, as the sheet is destructive), the
  // return of focus, Esc and Cancel being held while busy, and the locked backdrop.
  return (
    <Dialog ref={ref} className="cap-approval" size="lg" open={open} onOpenChange={(o) => !o && onClose()} modalLock destructive busy={pending} closeButton={false} described>
      <form className="cap-approval-form" onSubmit={submit}>
        <DialogHeader>
          <DialogTitle>{titleText(gates.length)}</DialogTitle>
          <DialogDescription>{lead}</DialogDescription>
        </DialogHeader>
        <DialogBody className="cap-approval-gates" flush role="group" aria-label="Gates waiting for approval">
          {gates.map((g, i) => (
            <fieldset className="cap-approval-gate" key={g.id} disabled={pending}>
              <legend className="cap-approval-job">{g.title}</legend>
              {g.meta && <p className="cap-approval-meta">{g.meta}</p>}
              <pre className="cap-approval-cmd">
                <code>{g.command}</code>
              </pre>
              <label className="cap-check">
                <input
                  type="checkbox"
                  data-cap-part="include"
                  name="gate"
                  value={g.id}
                  checked={checked[g.id] ?? g.include ?? true}
                  onChange={(e) => setChecked((c) => ({ ...c, [g.id]: e.target.checked }))}
                />{" "}
                Include this gate
              </label>
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${id}-c${i}`}>
                  Comment (optional)
                </label>
                <textarea className="cap-input" id={`${id}-c${i}`} data-cap-part="comment" rows={2} value={comments[g.id] ?? ""} onChange={(e) => setComments((c) => ({ ...c, [g.id]: e.target.value }))} />
              </div>
            </fieldset>
          ))}
        </DialogBody>
        {error && (
          <div className="cap-approval-error" data-cap-part="error">
            <div className="cap-alert" data-tone="crit" role="alert">
              <span data-cap-part="error-text">{error}</span>
            </div>
          </div>
        )}
        <DialogFooter align="between">
          <DialogClose part="cancel">Cancel</DialogClose>
          <p className="cap-approval-none" id={noneId} data-cap-part="none" hidden={n !== 0}>
            Choose at least one gate.
          </p>
          <button type="submit" className="cap-btn" data-variant="primary" data-cap-part="approve" aria-busy={pending ? "true" : undefined} aria-disabled={n === 0 ? "true" : undefined} aria-describedby={n === 0 ? noneId : undefined}>
            {pending && <span className="cap-btn-spinner" aria-hidden="true" />}
            <span data-cap-part="approve-label">{approveLabel(n, pending)}</span>
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
