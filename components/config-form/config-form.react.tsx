import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { Panel } from "../panel/panel.react.tsx";

export { useConfigForm, useEditor, type Editing } from "./config-editor.react.tsx";

export interface ConfigFormProps {
  f: (k: string) => string;
  first: RefObject<HTMLInputElement | null>;
  title: string;
  src?: ReactNode;
  hint: string | null;
  onSubmit: () => void;
  onClose: () => void;
  // The submit's words. "Preview" by default: it opens a confirm that shows what will change,
  // and changes nothing itself.
  submitLabel?: string;
  danger?: ReactNode;
  children: ReactNode;
}

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
