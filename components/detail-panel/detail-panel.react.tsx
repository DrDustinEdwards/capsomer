import { useCallback, useId, useState, type ReactNode } from "react";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";

export interface DetailPanelProps {
  open: boolean;
  // Called once the panel has closed, by Esc, Close, the backdrop or Back.
  onClose: () => void;
  // A stable identifier for the address (#detail-<id>) and the element ids.
  id: string;
  // The title in plain words: "Push the capsomer branch and open a pull request".
  title: string;
  // The record's identifier, shown under the title: "job_7f3a92c1d4e0".
  identifier?: string;
  // A small label above the title: "Job, capsid".
  kind?: string;
  // A status pill beside the title.
  badge?: ReactNode;
  // Push "#detail-<id>" so Back closes the panel.
  history?: boolean;
  closeLabel?: string;
  // The sections, in order: what to do first, the controls, the record, the source.
  children: ReactNode;
}

export function DetailPanel({ open, onClose, id, title, identifier, kind, badge, history = false, closeLabel = "Close", children }: DetailPanelProps) {
  // The panel's address is "#detail-<id>"; the shared dialog reads the prefix from the attribute.
  const mark = useCallback((el: HTMLDialogElement | null) => {
    if (el && el.hasAttribute("data-cap-history")) el.dataset.capHistory = "detail";
  }, []);
  return (
    <Dialog ref={mark} open={open} onOpenChange={() => onClose()} placement="right" size="md" className="cap-detail" id={id} history={history} historyId={id} closeLabel={closeLabel}>
      <DialogHeader divider>
        <div className="cap-detail-heading">
          {kind ? <p className="cap-detail-kind">{kind}</p> : null}
          <div className="cap-detail-titlerow">
            <DialogTitle>{title}</DialogTitle>
            {badge}
          </div>
          {identifier ? <p className="cap-detail-id">{identifier}</p> : null}
        </div>
      </DialogHeader>
      <DialogBody className="cap-detail-body">{children}</DialogBody>
    </Dialog>
  );
}

export interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  const id = useId();
  return (
    <section className="cap-detail-section" aria-labelledby={id}>
      <h3 className="cap-detail-section-title" id={id}>
        {title}
      </h3>
      {children}
    </section>
  );
}

// A command to run, in a sunken mono block, with a Copy button and a line that says
// whether it was copied.
export function DetailCommand({ text, copyLabel = "Copy command", what = "Command" }: { text: string; copyLabel?: string; what?: string }) {
  const id = useId();
  const [said, setSaid] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setSaid(`${what} copied.`);
    } catch {
      const el = document.getElementById(id);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      setSaid(`Could not reach the clipboard. ${what} is selected: copy it with Ctrl C or ⌘ C.`);
    }
  };
  return (
    <>
      <pre className="cap-detail-cmd" id={id}>
        {text}
      </pre>
      <div className="cap-detail-controls">
        <button type="button" className="cap-btn" onClick={() => void copy()}>
          {copyLabel}
        </button>
        <span className="cap-detail-copied" role="status">
          {said}
        </span>
      </div>
    </>
  );
}
