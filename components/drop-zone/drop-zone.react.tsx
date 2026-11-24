import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { attachDropZone, type DropDetail, type Rejection } from "./drop-zone.ts";

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
  // false: the zone does not list the files it took ("3 files are ready to upload." and the
  // list), because the app shows its own upload queue. Refusals are still listed.
  acceptedList?: boolean;
  // Called with the files that passed, and again with the files that did not.
  onAccepted?: (files: File[], rejected: Rejection[]) => void;
  onRejected?: (rejected: Rejection[], accepted: File[]) => void;
  id?: string;
}

export function DropZone({
  accept,
  maxBytes,
  maxFiles,
  multiple = false,
  name,
  disabled,
  scope = "zone",
  paste,
  title,
  hint,
  acceptedList = true,
  onAccepted,
  onRejected,
  id,
}: DropZoneProps) {
  const own = useId();
  const base = id ?? own;
  const root = useRef<HTMLDivElement>(null);
  // The behavior module does the dropping, pasting and checking; the callbacks reach it through a ref.
  const latest = useRef({ onAccepted, onRejected });
  useLayoutEffect(() => {
    latest.current = { onAccepted, onRejected };
  });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const detach = attachDropZone(el);
    const tell = (e: Event) => {
      const { accepted, rejected } = (e as CustomEvent<DropDetail>).detail;
      if (e.type === "cap-drop-accepted") latest.current.onAccepted?.(accepted, rejected);
      else latest.current.onRejected?.(rejected, accepted);
    };
    el.addEventListener("cap-drop-accepted", tell);
    el.addEventListener("cap-drop-rejected", tell);
    return () => {
      el.removeEventListener("cap-drop-accepted", tell);
      el.removeEventListener("cap-drop-rejected", tell);
      detach();
    };
  }, [scope, paste]);

  return (
    <div
      ref={root}
      className="cap-drop"
      data-cap="drop-zone"
      data-scope={scope === "page" ? "page" : undefined}
      data-max-bytes={maxBytes}
      data-max-files={maxFiles}
      data-paste={paste ? "" : undefined}
      data-accepted-list={acceptedList ? undefined : "off"}
    >
      <label className="cap-drop-label">
        <input
          className="cap-drop-input"
          type="file"
          name={name}
          multiple={multiple || (maxFiles ?? 1) > 1}
          accept={accept}
          disabled={disabled}
          data-cap-part="input"
          aria-labelledby={`${base}-title`}
          aria-describedby={`${base}-hint`}
        />
        <span className="cap-drop-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
      {acceptedList ? (
        <div className="cap-drop-status" role="status" data-cap-part="status" />
      ) : null}
      <div className="cap-drop-rejections" role="alert" data-cap-part="rejections" />
      {scope === "page" ? (
        <div className="cap-drop-overlay" aria-hidden="true">
          <div>
            <p className="cap-drop-overlay-title">Drop to upload</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
