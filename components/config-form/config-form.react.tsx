import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { Panel } from "../panel/panel.react.tsx";

// The editor state and form ids live in config-editor.react.tsx, so a list view that imports
// only useEditor does not load this module's Button, Alert and Panel.
export { useConfigForm, useEditor, type Editing } from "./config-editor.react.tsx";

export interface ConfigFormProps {
  f: (k: string) => string;
  first: RefObject<HTMLInputElement | null>;
  title: string;
  // Where the setting lives: "Saved in D1".
  src?: ReactNode;
  // Why the draft cannot be sent yet ("A name is needed"), shown above the buttons and announced.
  hint: string | null;
  onSubmit: () => void;
  onClose: () => void;
  // The submit's words. "Preview" by default: it opens a confirm that shows what will change,
  // and changes nothing itself.
  submitLabel?: string;
  // A Danger area under the buttons (Remove this site), apart from the form's own actions.
  danger?: ReactNode;
  children: ReactNode;
}

// The one shell of an operator's add and edit forms: a panel that scrolls into view and puts focus
// in its first field when it opens and hands focus back to its opener when it closes, the fields
// in a grid, a hint while the draft is not sendable, the submit and Cancel, and an optional Danger
// area. Esc in a field cancels.
export function ConfigForm({
  f,
  first,
  title,
  src,
  hint,
  onSubmit,
  onClose,
  submitLabel = "Preview",
  danger,
  children,
}: ConfigFormProps) {
  const box = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  // The control that opened the form (Add, Edit) gets focus back when the form closes by Cancel,
  // Esc or a save, if focus was lost with the form; a control that has gone keeps nothing.
  // Read while rendering, before the form's own focus and before an app disables its Add button.
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );
  useEffect(() => {
    return () => {
      requestAnimationFrame(() => {
        const now = document.activeElement;
        const lost = !now || now === document.body || !now.isConnected;
        if (lost && opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, [opener]);
  useEffect(() => {
    box.current?.scrollIntoView({ block: "nearest" });
    first.current?.focus();
  }, [first]);
  // Esc in any field cancels, as Cancel does.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const el = form.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      close.current();
    };
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Panel title={title} src={src} headingId={f("h")} ref={box} className="cap-config">
      <form
        ref={form}
        className="cap-fields cap-config-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {hint && (
          <div className="cap-config-full">
            <Alert tone="warn">{hint}</Alert>
          </div>
        )}
        <div className="cap-config-actions cap-config-full">
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
        {danger != null && <div className="cap-config-danger cap-config-full">{danger}</div>}
      </form>
    </Panel>
  );
}
