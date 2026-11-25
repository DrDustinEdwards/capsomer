// The formatted editor's three panels (rich-editor.react.tsx): the image description step, the link
// palette and the block menu.
import { plural } from "@drdustinedwards/site-helpers/text";
import type { Editor } from "@tiptap/core";
import type { LinkTarget, Scaffold } from "../markdown-editor/markdown-editor.ts";
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { rovingIndex } from "../toolbar/toolbar.ts";
import type { Palette, Upload } from "./rich-editor-types.ts";

export function ImageStep(props: {
  uid: string;
  upload: NonNullable<Upload>;
  alt: string;
  setAlt: (alt: string) => void;
  error: string | null;
  altRef: React.RefObject<HTMLInputElement | null>;
  insert: (decorative: boolean) => void;
  cancel: () => void;
}) {
  const { uid, upload, alt, setAlt, error, altRef, insert, cancel } = props;
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape inside the image step closes it; the group only catches the key from its fields
    <div
      className="cap-md-upload"
      role="group"
      aria-label="Describe the image"
      aria-busy={upload.sending ? "true" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        }
      }}
    >
      <img className="cap-md-upload-thumb" src={upload.preview || undefined} alt="" />
      <div className="cap-md-upload-fields">
        <label className="cap-field-label" htmlFor={`${uid}-alt`}>
          Alt text{" "}
          <span className="cap-field-required" aria-hidden="true">
            Required
          </span>
        </label>
        <input
          ref={altRef}
          id={`${uid}-alt`}
          className="cap-input"
          autoComplete="off"
          placeholder="What the image shows"
          aria-describedby={`${uid}-alt-help`}
          value={alt}
          readOnly={Boolean(upload.sending)}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={(e) => {
            // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
            if (e.key === "Enter" && !isImeEnter(e.nativeEvent)) {
              e.preventDefault();
              insert(false);
            }
          }}
        />
        <p className="cap-field-help" id={`${uid}-alt-help`}>
          Describe {upload.file.name}, or insert it as decorative.
        </p>
        {upload.sending ? <p className="cap-md-upload-wait">Uploading {upload.file.name}</p> : null}
        {error ? (
          <p className="cap-field-error cap-md-upload-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="cap-md-upload-actions">
          <button
            type="button"
            className="cap-btn"
            data-variant="primary"
            disabled={!alt.trim() || Boolean(upload.sending)}
            onClick={() => insert(false)}
          >
            Insert image
          </button>
          <button
            type="button"
            className="cap-btn"
            disabled={Boolean(upload.sending)}
            onClick={() => insert(true)}
          >
            Insert as decorative
          </button>
          <button type="button" className="cap-btn" data-variant="quiet" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function LinkPalette(props: {
  uid: string;
  palette: Palette;
  setPalette: (p: Palette) => void;
  matches: LinkTarget[];
  typedUrl: string | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  close: (restore: boolean) => void;
  apply: (href: string, title: string) => void;
}) {
  const { uid, palette, setPalette, matches, typedUrl, panelRef, close, apply } = props;
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape and the arrow keys inside the link palette; the group only catches them from its input
    <div
      ref={panelRef}
      className="cap-popover cap-md-palette"
      popover="manual"
      role="group"
      aria-label="Insert a link"
      data-size="lg"
      data-side="bottom"
      data-align="start"
      onBlur={(e) => {
        if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)))
          close(false);
      }}
    >
      <label className="cap-md-palette-label" htmlFor={`${uid}-link`}>
        Link to
      </label>
      <input
        id={`${uid}-link`}
        type="text"
        className="cap-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={matches.length > 0}
        aria-controls={`${uid}-link-list`}
        aria-activedescendant={matches.length > 0 ? `${uid}-link-${palette.active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search pages, or type a URL"
        value={palette.query}
        onChange={(e) => setPalette({ ...palette, query: e.target.value, active: 0 })}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            close(true);
          } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (matches.length)
              setPalette({
                ...palette,
                active:
                  (palette.active + (e.key === "ArrowDown" ? 1 : matches.length - 1)) %
                  matches.length,
              });
          } else if (e.key === "Enter" && !isImeEnter(e.nativeEvent)) {
            e.preventDefault();
            if (typedUrl) apply(typedUrl, typedUrl);
            else if (matches[palette.active])
              apply(matches[palette.active]!.href, matches[palette.active]!.title);
          }
        }}
      />
      <div
        className="cap-listbox"
        role="listbox"
        id={`${uid}-link-list`}
        aria-label="Pages"
        data-wrap=""
      >
        {matches.map((m, i) => (
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- a listbox option chosen by pointer; the palette's input drives it from the keyboard (aria-activedescendant)
          <div
            key={m.href}
            id={`${uid}-link-${i}`}
            className="cap-option"
            role="option"
            aria-selected={i === palette.active}
            data-active={i === palette.active ? "" : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(m.href, m.title)}
          >
            <span className="cap-option-label">{m.title}</span>
            {m.note ? <span className="cap-md-option-note"> ({m.note})</span> : null}
            {m.hint ? <span className="cap-md-option-hint">{m.hint}</span> : null}
          </div>
        ))}
      </div>
      <p className="cap-md-palette-note" role="status">
        {typedUrl
          ? `Enter links to ${typedUrl}.`
          : matches.length === 0
            ? "No page matches."
            : `${plural(matches.length, "page")}.`}
      </p>
    </div>
  );
}

export function SlashMenu(props: {
  scaffolds: Scaffold[];
  menuRef: React.RefObject<HTMLUListElement | null>;
  editor: () => Editor | null;
  close: () => void;
  choose: (s: Scaffold) => void;
}) {
  const { scaffolds, menuRef, editor, close, choose } = props;
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the block menu's keys come from the editor, which keeps focus while it is open
    <ul
      ref={menuRef}
      className="cap-popover cap-md-slash"
      popover="manual"
      aria-label="Insert a block"
      data-flush=""
      data-size="auto"
      data-side="bottom"
      data-align="start"
      onKeyDown={(e) => {
        const items = [
          ...e.currentTarget.querySelectorAll<HTMLButtonElement>(".cap-md-slash-item"),
        ];
        const at = items.findIndex((b) => b === document.activeElement);
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
          editor()?.commands.focus();
        } else {
          const next = rovingIndex(e.key, at, items.length, "vertical");
          if (next === null) return;
          e.preventDefault();
          items[next]?.focus();
        }
      }}
    >
      {scaffolds.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            className="cap-md-slash-item"
            tabIndex={-1}
            onClick={() => choose(s)}
          >
            <strong>{s.label}</strong>
            <span className="cap-md-slash-hint">{s.hint}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
