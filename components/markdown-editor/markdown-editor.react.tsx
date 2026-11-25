import { useEffect, useId, useRef, type ReactNode, useLayoutEffect } from "react";

import type { LinkTarget, MarkdownEditorHandle, MarkdownEditorOptions } from "./markdown-editor.ts";

export type {
  ImageDescription,
  LinkTarget,
  MarkdownEditorHandle,
  MarkdownEditorOptions,
  Scaffold,
  UploadResult,
} from "./markdown-editor.ts";

export interface MarkdownEditorProps extends Pick<
  MarkdownEditorOptions,
  | "scaffolds"
  | "linkTargets"
  | "onUpload"
  | "imageMarkdown"
  | "accept"
  | "lineNumbers"
  | "nonce"
  | "wordsPerMinute"
  | "onSave"
> {
  label: ReactNode;
  ariaLabel?: string;
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  help?: ReactNode;
  error?: ReactNode;
  onReady?: (handle: MarkdownEditorHandle) => void;
}

// A label and a real textarea holding the markdown, which is all a server render (and a reader without
// script) gets. After mount it loads the behavior module and CodeMirror with import() as their own
// chunks and upgrades the textarea in place.
const loadBehavior = () =>
  (import.meta as { env?: { SSR?: boolean } }).env?.SSR
    ? Promise.reject(new Error("markdown-editor: the editor mounts only in a browser"))
    : import("./markdown-editor.ts");

export function MarkdownEditor(props: MarkdownEditorProps) {
  const {
    label,
    ariaLabel,
    name,
    value,
    defaultValue,
    placeholder,
    readOnly,
    disabled,
    required,
    maxLength,
    help,
    error,
  } = props;
  const base = useId();
  const id = props.id ?? `${base}-md`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const hasError = error != null && error !== false && error !== "";
  const describedBy =
    [hasError ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MarkdownEditorHandle | null>(null);
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });

  const hasUpload = !!props.onUpload;
  const scaffoldsKey = JSON.stringify(props.scaffolds ?? null);

  const options = (): MarkdownEditorOptions => ({
    label: latest.current.ariaLabel,
    lineNumbers: latest.current.lineNumbers,
    accept: latest.current.accept,
    nonce: latest.current.nonce,
    wordsPerMinute: latest.current.wordsPerMinute,
    scaffolds: latest.current.scaffolds,
    linkTargets: async (query) => {
      const t = latest.current.linkTargets;
      if (typeof t === "function") return t(query);
      const { filterLinkTargets } = await loadBehavior();
      return filterLinkTargets((t ?? []) as LinkTarget[], query);
    },
    onUpload: latest.current.onUpload
      ? (f, image, signal) =>
          (latest.current.onUpload as NonNullable<MarkdownEditorOptions["onUpload"]>)(
            f,
            image,
            signal,
          )
      : undefined,
    imageMarkdown: latest.current.imageMarkdown
      ? (i) =>
          (latest.current.imageMarkdown as NonNullable<MarkdownEditorOptions["imageMarkdown"]>)(i)
      : undefined,
    onChange: (v) => latest.current.onChange?.(v),
    onSave: (v) => latest.current.onSave?.(v),
  });

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;
    let canceled = false;
    let mounted: MarkdownEditorHandle | null = null;
    loadBehavior()
      .then((m) => (canceled ? null : m.mountMarkdownEditor(host, options())))
      .then((h) => {
        if (!h) return;
        if (canceled) return h.destroy();
        mounted = h;
        handleRef.current = h;
        const v = latest.current.value;
        if (v !== undefined && v !== h.getValue()) h.setValue(v);
        latest.current.onReady?.(h);
      })
      .catch(() => {
        // CodeMirror did not load: the textarea stays as the editor.
      });
    return () => {
      canceled = true;
      mounted?.destroy();
      handleRef.current = null;
    };
  }, []);

  // A controlled value: set only when it differs, or each keystroke would round-trip and reset the cursor.
  useEffect(() => {
    if (value === undefined) return;
    const h = handleRef.current;
    if (h) {
      if (h.getValue() !== value) h.setValue(value);
    } else {
      const ta = rootRef.current?.querySelector("textarea");
      if (ta && ta.value !== value) ta.value = value;
    }
  }, [value]);

  useEffect(() => {
    const o = options();
    handleRef.current?.update({
      scaffolds: o.scaffolds,
      onUpload: o.onUpload,
      imageMarkdown: o.imageMarkdown,
      label: ariaLabel,
    });
  }, [scaffoldsKey, hasUpload, ariaLabel]);

  return (
    <div className="cap-md cap-field" data-cap="markdown-editor" ref={rootRef}>
      <label className="cap-field-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="cap-field-required" aria-hidden="true">
            Required
          </span>
        ) : null}
      </label>
      {help ? (
        <p className="cap-field-help" id={helpId}>
          {help}
        </p>
      ) : null}
      <textarea
        className="cap-input cap-md-source"
        id={id}
        name={name}
        defaultValue={value ?? defaultValue ?? ""}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        spellCheck
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy}
      />
      {hasError ? (
        <p className="cap-field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
