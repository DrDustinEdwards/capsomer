import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useHydrated } from "../hooks/hooks.react.tsx";
import { acceptLabel, validateFiles } from "../drop-zone/drop-zone.ts";
import { formatBytes } from "../format/format.ts";

export interface AttachedFile {
  id: string;
  name: string;
  // Opens the file (in a new tab, said to a screen reader).
  href?: string;
  // A short line after the name: its date or size.
  meta?: ReactNode;
}

export interface FileAttachProps {
  // The files already attached, in order.
  files: AttachedFile[];
  // The button's words. Default "Upload file".
  label?: string;
  pending?: boolean;
  pendingLabel?: string;
  // The input's accept list, and the limits checked before anything is sent.
  accept?: string;
  maxBytes?: number;
  // The most files the list may hold; the button goes once it is full.
  maxFiles?: number;
  // The file input's name, and the id of the form it posts in (its `form` attribute), for a
  // form placed elsewhere on the page (forms cannot nest).
  name?: string;
  form?: string;
  // Called with the files that pass the checks, as soon as they are chosen: the app uploads
  // them (a fetcher submit of input.form). Without script the Upload button posts the form.
  onFiles?: (files: File[], input: HTMLInputElement) => void;
  // The server's answer to the last upload or remove, when it refused.
  error?: ReactNode;
  // Why files cannot be added here (read-only, no storage): the button gives way to these words.
  unavailable?: ReactNode;
  // A file's own remove control (a confirmed post). Left out, the list cannot be changed.
  renderRemove?: (file: AttachedFile) => ReactNode;
  emptyText?: ReactNode;
  // The words for a link that opens in a new tab.
  newTabText?: string;
}

// Attach files to a record one choice at a time: a button that opens the file picker (the
// drop zone's input, drawn as a button, for a panel with no room for a zone), the same checks
// before anything is sent, each refusal said in words, and the list of what is attached.
export function FileAttach({
  files,
  label = "Upload file",
  pending = false,
  pendingLabel = "Uploading…",
  accept,
  maxBytes,
  maxFiles,
  name = "file",
  form,
  onFiles,
  error,
  unavailable,
  renderRemove,
  emptyText = "No files uploaded.",
  newTabText = "(opens in a new tab)",
}: FileAttachProps) {
  const ready = useHydrated();
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [refused, setRefused] = useState<string | null>(null);
  // A finished upload clears the chosen file, so the same file can be chosen again.
  const was = useRef(pending);
  useEffect(() => {
    if (was.current && !pending && input.current) input.current.value = "";
    was.current = pending;
  }, [pending]);
  const room = maxFiles === undefined ? Infinity : maxFiles - files.length;
  const off = unavailable != null && unavailable !== false && unavailable !== "";
  const message = refused ?? error;
  const limits = [
    accept ? acceptLabel(accept) : null,
    maxBytes ? `up to ${formatBytes(maxBytes)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="cap-attach">
      <div className="cap-attach-control">
        {off ? (
          <span className="cap-attach-unavailable">{unavailable}</span>
        ) : room > 0 ? (
          <>
            <span className="cap-attach-button">
              <input
                ref={input}
                id={inputId}
                className="cap-attach-input"
                type="file"
                name={name}
                form={form}
                accept={accept}
                disabled={pending}
                aria-describedby={limits ? hintId : undefined}
                onChange={(e) => {
                  const el = e.currentTarget;
                  const { accepted, rejected } = validateFiles(el.files ?? [], {
                    accept,
                    maxBytes,
                    maxFiles: room === Infinity ? undefined : room,
                  });
                  setRefused(rejected.length ? rejected.map((r) => r.message).join(" ") : null);
                  if (rejected.length || !accepted.length) {
                    el.value = "";
                    return;
                  }
                  onFiles?.(accepted, el);
                }}
              />
              <label
                htmlFor={inputId}
                className="cap-btn"
                data-size="sm"
                aria-disabled={pending || undefined}
              >
                {pending ? pendingLabel : label}
              </label>
            </span>
            {limits ? (
              <span className="cap-attach-hint" id={hintId}>
                {limits}
              </span>
            ) : null}
            {ready ? null : (
              <button type="submit" form={form} className="cap-btn" data-size="sm">
                Upload
              </button>
            )}
          </>
        ) : null}
      </div>
      <p className="cap-field-error" role="alert" hidden={!message}>
        {message ?? null}
      </p>
      {files.length === 0 ? (
        <p className="cap-attach-empty">{emptyText}</p>
      ) : (
        <ul className="cap-attach-list">
          {files.map((f) => (
            <li className="cap-attach-item" key={f.id}>
              {f.href ? (
                <a href={f.href} target="_blank" rel="noopener noreferrer">
                  {f.name}
                  <span className="cap-sr-only"> {newTabText}</span>
                </a>
              ) : (
                <span>{f.name}</span>
              )}
              <span className="cap-attach-item-end">
                {f.meta ? <span className="cap-attach-meta">{f.meta}</span> : null}
                {renderRemove && !off ? renderRemove(f) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
