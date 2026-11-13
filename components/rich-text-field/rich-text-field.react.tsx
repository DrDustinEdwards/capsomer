import { plural } from "@drdustinedwards/site-helpers/text";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { attachToolbar } from "../toolbar/toolbar.ts";
import {
  insertNodes,
  parseRichText,
  richTextNodes,
  richTextWords,
  sanitizeRichText,
  serializeRichText,
  tagsAround,
  toggleTag,
  type RichTextTag,
} from "./rich-text-field.ts";

export interface RichTextFieldProps {
  // The form field's name: a hidden input carries the sanitized value.
  name: string;
  label: ReactNode;
  // The inline tags this field allows, in toolbar order. Italic only for a title.
  tags: readonly RichTextTag[];
  // The stored value; sanitized again before it is shown.
  initialHTML?: string;
  // Help, between the label and the field, read as its description.
  help?: ReactNode;
  // What is wrong and what to do; marks the field invalid.
  error?: ReactNode;
  required?: boolean;
  // "multi" wraps over several lines and starts taller (an abstract's body); "single" is one line's height (a title).
  // Enter never adds a line break: the value holds inline text only.
  lines?: "single" | "multi";
  // A live word count under the field.
  wordCount?: boolean;
  // Another description's id (a limit the page states).
  describedBy?: string;
  // Every change, with the sanitized value.
  onValueChange?: (value: string) => void;
}

const BUTTONS: Record<
  RichTextTag,
  { label: string; key: string; keyName: string; glyph: ReactNode }
> = {
  em: { label: "Italic", key: "i", keyName: "I", glyph: <em>I</em> },
  strong: { label: "Bold", key: "b", keyName: "B", glyph: <strong>B</strong> },
  sup: {
    label: "Superscript",
    key: ".",
    keyName: ".",
    glyph: (
      <>
        x<sup>2</sup>
      </>
    ),
  },
  sub: {
    label: "Subscript",
    key: ",",
    keyName: ",",
    glyph: (
      <>
        x<sub>2</sub>
      </>
    ),
  },
  code: { label: "Code", key: "e", keyName: "E", glyph: <code>{"</>"}</code> },
};

// A short text with a few inline tags: the toolbar and the shortcuts put the real tag around the selection (or take
// it off), and a paste is kept to the allowed tags. The server sanitizes again on save.
export function RichTextField({
  name,
  label,
  tags,
  initialHTML = "",
  help,
  error,
  required,
  lines = "single",
  wordCount = false,
  describedBy,
  onValueChange,
}: RichTextFieldProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const countId = `${base}-count`;
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(() => sanitizeRichText(initialHTML, tags));
  const [active, setActive] = useState<RichTextTag[]>([]);
  const hasError = error != null && error !== false && error !== "";
  const report = useRef(onValueChange);
  useEffect(() => {
    report.current = onValueChange;
  });

  // The editable box is filled once, from the tree, and then left to the browser so typing keeps the caret.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.replaceChildren(...richTextNodes(el.ownerDocument, parseRichText(value, tags)));
    report.current?.(value);
    // oxlint-disable-next-line react/exhaustive-deps -- once: later values come from the box itself
  }, []);

  useEffect(() => (bar.current ? attachToolbar(bar.current) : undefined), []);

  // The pressed state follows the caret.
  useEffect(() => {
    const doc = box.current?.ownerDocument;
    if (!doc) return undefined;
    const onSelection = () => {
      const el = box.current;
      const sel = doc.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
      setActive(tagsAround(sel.anchorNode, el));
    };
    doc.addEventListener("selectionchange", onSelection);
    return () => doc.removeEventListener("selectionchange", onSelection);
  }, []);

  function sync() {
    const el = box.current;
    if (!el) return;
    const next = serializeRichText(parseRichText(el.innerHTML, tags)).trim();
    setValue(next);
    report.current?.(next);
  }

  function toggle(tag: RichTextTag) {
    const el = box.current;
    if (!el) return;
    if (toggleTag(el, tag, el.ownerDocument.getSelection())) {
      sync();
      setActive(tagsAround(el.ownerDocument.getSelection()?.anchorNode ?? null, el));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    const tag = tags.find((t) => BUTTONS[t].key === event.key.toLowerCase());
    if (!tag) {
      // The browser's own bold and underline would write tags the field does not allow.
      if (["b", "u"].includes(event.key.toLowerCase())) event.preventDefault();
      return;
    }
    event.preventDefault();
    toggle(tag);
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const el = box.current;
    if (!el) return;
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    // Plain text is text: its < and & are characters, not markup.
    const tree = html ? parseRichText(html, tags) : [text];
    const flat = tree.map((n) => (typeof n === "string" ? n.replace(/\s*[\r\n]+\s*/g, " ") : n));
    if (insertNodes(el, richTextNodes(el.ownerDocument, flat), el.ownerDocument.getSelection()))
      sync();
  }

  const described =
    [hasError ? errorId : null, help ? helpId : null, wordCount ? countId : null, describedBy]
      .filter(Boolean)
      .join(" ") || undefined;
  const words = richTextWords(value);

  return (
    <div className="cap-field cap-rich-text" data-invalid={hasError ? "true" : undefined}>
      <span className="cap-field-label" id={labelId}>
        {label}
        {required ? (
          <span className="cap-field-required" aria-hidden="true">
            Required
          </span>
        ) : null}
      </span>
      {help ? (
        <p className="cap-field-help" id={helpId}>
          {help}
        </p>
      ) : null}
      <div
        ref={bar}
        className="cap-toolbar cap-rich-text-bar"
        role="toolbar"
        aria-label="Formatting"
        aria-controls={`${base}-box`}
      >
        {tags.map((tag) => {
          const b = BUTTONS[tag];
          return (
            <button
              key={tag}
              type="button"
              className="cap-btn"
              data-size="sm"
              aria-pressed={active.includes(tag)}
              aria-keyshortcuts={`Control+${b.keyName} Meta+${b.keyName}`}
              title={`${b.label} (Ctrl or Cmd + ${b.keyName})`}
              // Keeps the selection in the box when the pointer presses the button.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggle(tag)}
            >
              <span aria-hidden="true">{b.glyph}</span>
              <span className="cap-sr-only">{b.label}</span>
            </button>
          );
        })}
      </div>
      <div
        ref={box}
        id={`${base}-box`}
        className="cap-input cap-rich-text-box"
        data-lines={lines}
        role="textbox"
        aria-multiline={lines === "multi"}
        aria-labelledby={labelId}
        aria-describedby={described}
        aria-invalid={hasError ? true : undefined}
        aria-required={required || undefined}
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={sync}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDrop={(e) => e.preventDefault()}
      />
      <input type="hidden" name={name} value={value} />
      {wordCount ? (
        <p className="cap-field-help cap-rich-text-count" id={countId} aria-live="polite">
          {plural(words, "word")}
        </p>
      ) : null}
      <p className="cap-field-error" id={errorId} hidden={!hasError}>
        {hasError ? error : null}
      </p>
    </div>
  );
}
