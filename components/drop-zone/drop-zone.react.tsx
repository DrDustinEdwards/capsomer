import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { acceptedText, dragHasFiles, formatBytes, rejectedLead, setInputFiles, validateFiles, type Rejection } from "./drop-zone.ts";

export interface DropZoneProps {
  // The same list an input's accept attribute takes: "image/*,.pdf".
  accept?: string;
  // The largest file, in bytes.
  maxBytes?: number;
  // The most files taken at once. A zone without `multiple` takes one.
  maxFiles?: number;
  multiple?: boolean;
  // The input's name, so a form posts the accepted files.
  name?: string;
  disabled?: boolean;
  // "page": a drag of files anywhere over the window is taken, with a full-window panel.
  scope?: "zone" | "page";
  // Files pasted from the clipboard are taken too.
  paste?: boolean;
  // The idle title ("Drop files here, or browse" by default) and the line of rules under it.
  title?: ReactNode;
  hint?: ReactNode;
  // Called with the files that passed, and again with the files that did not.
  onAccepted?: (files: File[], rejected: Rejection[]) => void;
  onRejected?: (rejected: Rejection[], accepted: File[]) => void;
  id?: string;
}

const CRIT = "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z";

export function DropZone({ accept, maxBytes, maxFiles, multiple = false, name, disabled, scope = "zone", paste, title, hint, onAccepted, onRejected, id }: DropZoneProps) {
  const own = useId();
  const base = id ?? own;
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [accepted, setAccepted] = useState<File[]>([]);
  const [rejected, setRejected] = useState<Rejection[]>([]);
  // The handlers read the latest props through a ref, so the listeners attach once.
  const latest = useRef({ accept, maxBytes, maxFiles, multiple, disabled, onAccepted, onRejected });
  latest.current = { accept, maxBytes, maxFiles, multiple, disabled, onAccepted, onRejected };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const take = (files: ArrayLike<File>, fromInput = false) => {
      const l = latest.current;
      const rules = { accept: l.accept, maxBytes: l.maxBytes, maxFiles: l.maxFiles ?? (l.multiple ? undefined : 1) };
      const result = validateFiles(Array.from(files), rules);
      if (input.current && (!fromInput || result.rejected.length > 0)) setInputFiles(input.current, result.accepted);
      setAccepted(result.accepted);
      setRejected(result.rejected);
      if (result.accepted.length > 0) l.onAccepted?.(result.accepted, result.rejected);
      if (result.rejected.length > 0) l.onRejected?.(result.rejected, result.accepted);
    };
    const page = scope === "page";
    const target: EventTarget = page ? window : el;
    let depth = 0;
    const onEnter = (e: Event) => {
      if (!dragHasFiles(e as DragEvent) || latest.current.disabled) return;
      depth += 1;
      setOver(true);
    };
    const onOver = (e: Event) => {
      if (!dragHasFiles(e as DragEvent) || latest.current.disabled) return;
      e.preventDefault();
    };
    const onLeave = (e: Event) => {
      if (depth === 0 || !dragHasFiles(e as DragEvent)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    };
    const onDrop = (e: Event) => {
      const ev = e as DragEvent;
      depth = 0;
      setOver(false);
      if (ev.defaultPrevented) return;
      const files = ev.dataTransfer?.files;
      if (!files || files.length === 0) {
        const editable = ev.target instanceof Element && ev.target.closest("input, textarea, [contenteditable='true']");
        if (page && !editable) ev.preventDefault();
        return;
      }
      if (latest.current.disabled) return;
      ev.preventDefault();
      take(files);
      input.current?.focus({ preventScroll: true });
    };
    const onPaste = (e: Event) => {
      const files = (e as ClipboardEvent).clipboardData?.files;
      if (!files || files.length === 0 || latest.current.disabled) return;
      e.preventDefault();
      take(files);
    };
    const inputEl = input.current;
    const onChange = () => {
      if (inputEl?.files) take(Array.from(inputEl.files), true);
    };
    target.addEventListener("dragenter", onEnter);
    target.addEventListener("dragover", onOver);
    target.addEventListener("dragleave", onLeave);
    target.addEventListener("drop", onDrop);
    inputEl?.addEventListener("change", onChange);
    const pasteTarget: EventTarget | null = paste ? (page ? document : el) : null;
    pasteTarget?.addEventListener("paste", onPaste);
    return () => {
      target.removeEventListener("dragenter", onEnter);
      target.removeEventListener("dragover", onOver);
      target.removeEventListener("dragleave", onLeave);
      target.removeEventListener("drop", onDrop);
      inputEl?.removeEventListener("change", onChange);
      pasteTarget?.removeEventListener("paste", onPaste);
    };
  }, [scope, paste]);

  const state = over ? "over" : rejected.length > 0 ? "rejected" : "idle";
  return (
    <div ref={root} className="cap-drop" data-state={state} data-scope={scope === "page" ? "page" : undefined}>
      <label className="cap-drop-label">
        <input ref={input} className="cap-drop-input" type="file" name={name} multiple={multiple || (maxFiles ?? 1) > 1} accept={accept} disabled={disabled} aria-labelledby={`${base}-title`} aria-describedby={`${base}-hint`} />
        <span className="cap-drop-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
        </span>
        <span className="cap-drop-title" id={`${base}-title`}>
          <span className="cap-drop-idle">
            {title ?? (
              <>
                {multiple ? "Drop files here, or " : "Drop a file here, or "}
                <span className="cap-drop-browse">browse</span>
              </>
            )}
          </span>
          <span className="cap-drop-over">Drop to upload</span>
        </span>
        <span className="cap-drop-hint" id={`${base}-hint`}>
          {hint}
        </span>
      </label>
      <div className="cap-drop-status" role="status">
        {accepted.length > 0 ? (
          <>
            <p className="cap-drop-lead">{acceptedText(accepted)}</p>
            <ul className="cap-drop-files">
              {accepted.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  <span className="cap-drop-file-name">{f.name}</span>
                  <span className="cap-drop-file-size">{formatBytes(f.size)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <div className="cap-drop-rejections" role="alert">
        {rejected.length > 0 ? (
          <>
            <p className="cap-drop-lead" data-tone="crit">
              <svg className="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path fill="currentColor" fillRule="evenodd" d={CRIT} />
              </svg>
              {rejectedLead(rejected.length)}
            </p>
            <ul className="cap-drop-files">
              {rejected.map((r, i) => (
                <li key={`${r.file.name}-${i}`}>{r.message}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {scope === "page" ? (
        <div className="cap-drop-overlay" aria-hidden="true">
          <div>
            <p className="cap-drop-overlay-title">Drop to upload</p>
            <p className="cap-drop-overlay-text">Release anywhere on this page to add the files.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
