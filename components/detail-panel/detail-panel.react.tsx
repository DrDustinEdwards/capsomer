import { useCallback, useId, useState, type ReactNode } from "react";
import { copyText } from "../copy/copy.ts";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";

export interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  id: string;
  title: string;
  identifier?: string;
  kind?: string;
  badge?: ReactNode;
  history?: boolean;
  closeLabel?: string;
  children: ReactNode;
}

export function DetailPanel({
  open,
  onClose,
  id,
  title,
  identifier,
  kind,
  badge,
  history = false,
  closeLabel = "Close",
  children,
}: DetailPanelProps) {
  const mark = useCallback((el: HTMLDialogElement | null) => {
    if (el && el.hasAttribute("data-cap-history")) el.dataset.capHistory = "detail";
  }, []);
  return (
    <Dialog
      ref={mark}
      open={open}
      onOpenChange={() => onClose()}
      placement="right"
      size="md"
      className="cap-detail"
      id={id}
      history={history}
      historyId={id}
      closeLabel={closeLabel}
    >
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

// A command to run in a sunken mono block, with a Copy button and a line saying whether it was copied.
export function DetailCommand({
  text,
  copyLabel = "Copy command",
  what = "Command",
}: {
  text: string;
  copyLabel?: string;
  what?: string;
}) {
  const id = useId();
  const [said, setSaid] = useState("");
  const copy = async () => {
    if (await copyText(text)) setSaid(`${what} copied.`);
    else {
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
