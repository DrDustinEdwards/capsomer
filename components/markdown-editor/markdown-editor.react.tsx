import { useEffect, useId, useRef, type ReactNode } from "react";

import type { LinkTarget, MarkdownEditorHandle, MarkdownEditorOptions } from "./markdown-editor.ts";

export type { LinkTarget, MarkdownEditorHandle, MarkdownEditorOptions, Scaffold, UploadResult } from "./markdown-editor.ts";

export interface MarkdownEditorProps
  extends Pick<MarkdownEditorOptions, "scaffolds" | "linkTargets" | "onUpload" | "imageMarkdown" | "accept" | "lineNumbers" | "nonce" | "wordsPerMinute" | "onSave"> {
  // The visible label above the editor.
  label: ReactNode;
  // The surface's accessible name; defaults to the label's text plus ", markdown".
  ariaLabel?: string;
  // The field's name in a form: the markdown is posted in a hidden textarea of this name.
  name?: string;
  id?: string;
  // Controlled: the text. Without it the editor keeps its own, starting at defaultValue.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  // A hint, not a stop: the footer counts characters against it and says when the text is over.
  maxLength?: number;
  // Help, between the label and the editor, read as its description.
  help?: ReactNode;
  // What is wrong and what to do; shown below the editor, and marks it invalid.
  error?: ReactNode;
  // Called once with the handle when CodeMirror has loaded.
  onReady?: (handle: MarkdownEditorHandle) => void;
}

// Renders the HTML contract in markdown-editor.md: a label and a real textarea holding the
// markdown, which is all a server render (and a reader without script) gets. After mount it
// loads the behaviour module and CodeMirror with import(), so they are their own chunks and
// never reach a bundle that renders no editor, and upgrades the textarea in place.
export function MarkdownEditor(props: MarkdownEditorProps) {
  const { label, ariaLabel, name, value, defaultValue, placeholder, readOnly, disabled, required, maxLength, help, error } = props;
  const base = useId();
  const id = props.id ?? `${base}-md`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const hasError = error != null && error !== false && error !== "";
  const describedBy = [hasError ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MarkdownEditorHandle | null>(null);
  // What the latest render said, read by the callbacks the editor was mounted with.
  const latest = useRef(props);
  latest.current = props;

  const hasUpload = !!props.onUpload;
  const scaffoldsKey = JSON.stringify(props.scaffolds ?? null);

  const options = (): MarkdownEditorOptions => ({
    label: latest.current.ariaLabel,
    lineNumbers: latest.current.lineNumbers,
    accept: latest.current.accept,
    nonce: latest.current.nonce,
    wordsPerMinute: latest.current.wordsPerMinute,
    scaffolds: latest.current.scaffolds,
    // Always a function, so a later render's targets are used without rebuilding the editor.
    linkTargets: async (query) => {
      const t = latest.current.linkTargets;
      if (typeof t === "function") return t(query);
      const { filterLinkTargets } = await import("./markdown-editor.ts");
      return filterLinkTargets((t ?? []) as LinkTarget[], query);
    },
    onUpload: latest.current.onUpload ? (f) => (latest.current.onUpload as NonNullable<MarkdownEditorOptions["onUpload"]>)(f) : undefined,
    imageMarkdown: latest.current.imageMarkdown ? (i) => (latest.current.imageMarkdown as NonNullable<MarkdownEditorOptions["imageMarkdown"]>)(i) : undefined,
    onChange: (v) => latest.current.onChange?.(v),
    onSave: (v) => latest.current.onSave?.(v),
  });

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;
    let cancelled = false;
    let mounted: MarkdownEditorHandle | null = null;
    import("./markdown-editor.ts")
      .then((m) => (cancelled ? null : m.mountMarkdownEditor(host, options())))
      .then((h) => {
        if (!h) return;
        if (cancelled) return h.destroy();
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
      cancelled = true;
      mounted?.destroy();
      handleRef.current = null;
    };
    // Mounted once; later renders reach the editor through `latest` and the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // The toolbar and the slash menu are rebuilt only when what they list changes, not each render.
  useEffect(() => {
    const o = options();
    handleRef.current?.update({ scaffolds: o.scaffolds, onUpload: o.onUpload, imageMarkdown: o.imageMarkdown, label: ariaLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
