// The formatted editor: Tiptap's MIT core over ProseMirror, showing formatted text with the Markdown
// underneath kept byte for byte (rich-editor-markdown.mjs). It keeps
// what the Markdown editor did: the APG toolbar (bold, italic, link, heading, code, footnote, the app's
// blocks, an image), Ctrl or Cmd B, I, E, K and S, the link palette over the app's pages, the block
// menu on a lone "/", an image described before it is uploaded, the word count and
// reading time, read-only, and Tab leaving the text. Markdown the editor does not format (front
// matter, code, tables, directives, math) sits in source blocks, edited as Markdown in place.
//
// The server renders a labeled textarea holding the Markdown, so the page reads the same before the
// script runs; the editor replaces it once it loads.
//
// In a shared room (`room`, made by the collab editor's useRoomEditing), the document is the room's
// copy: the room brings the extensions that bind it (collaboration, carets, suggesting, comment marks)
// and works out the Markdown, and `value` only feeds the word count. This file imports no Yjs, so an
// editor outside a room does not carry it.

import { plural, readingMinutes, wordCount } from "@drdustinedwards/site-helpers/text";
import { Editor, type AnyExtension, type JSONContent } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { DOMParser as SchemaParser } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  defaultImageMarkdown,
  filterLinkTargets,
  looksLikeUrl,
  type ImageDescription,
  type LinkTarget,
  type Scaffold,
} from "../markdown-editor/markdown-editor.ts";
import { GLYPH } from "../markdown-editor/markdown-editor.ts";
import { place } from "../popover/popover.ts";
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { inertDocument } from "../trusted-html/trusted-html.ts";

import {
  fingerprints,
  fromDoc,
  pastedBlocks,
  toDoc,
  type Dialect,
  type JsonNode,
} from "./rich-editor-markdown.mjs";
import { baseExtensions } from "./rich-editor-schema.mjs";
import { sourceBlockView, SourceInlineView } from "./rich-editor-source-views.ts";

export type RichEditorHandle = {
  /** Puts Markdown (a figure, an image) in as blocks at the cursor, as the editor's own blocks are put. */
  insertMarkdown: (markdown: string) => void;
  focus: () => void;
  /** The editor itself, for the room's panels (comments, suggestions). */
  editor: Editor;
};

/**
 * The room an editor is in, as the collab editor's useRoomEditing makes it. The editor knows nothing of
 * Yjs: the room gives it its extensions, the Markdown of a document, and a step to run after each change
 * of `syncKey` (suggesting on or off, the carets and the comment marks drawn again).
 */
export type RichRoom = {
  /** Made once per editor: the binding to the room's copy and what draws the others' work in it. */
  extensions: () => AnyExtension[];
  /** The Markdown a document stands for, with the room's bookkeeping. */
  markdown: (json: JSONContent) => string;
  /** Source blocks are read only (while suggesting, which cannot mark Markdown). */
  sourceLocked: (state: EditorState) => boolean;
  /** Brings the editor in step with the room; run once it is made and whenever `syncKey` changes. */
  sync: (editor: Editor) => void;
  syncKey: string;
  /** Front matter edited in its own fields, so the text does not show it a second time. */
  hideFrontMatter: boolean;
};

export type RichEditorProps = {
  /** What the editing surface is called to a screen reader, for example "Post, formatted". */
  ariaLabel: string;
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  dialect: Dialect;
  placeholder?: string;
  scaffolds?: Scaffold[];
  linkTargets?: LinkTarget[];
  /** Called once the image is described, as Capsomer's markdown editor calls it. */
  onUpload?: (file: File, image: ImageDescription, signal: AbortSignal) => Promise<{ url: string }>;
  imageMarkdown?: (image: {
    url: string;
    alt: string;
    decorative: boolean;
    name: string;
  }) => string;
  accept?: string;
  onReady?: (handle: RichEditorHandle) => void;
  room?: RichRoom;
};

type Palette = { from: number; to: number; query: string; active: number };
// An image is described before it is sent (ATAG 2.0 B.2.3; site-api 0.19+ refuses an undescribed
// upload): the step holds the file and a local preview until Insert, then sends it once.
type Upload = { file: File; preview: string; sending: AbortController | null } | null;

export function RichEditor(props: RichEditorProps) {
  const {
    ariaLabel,
    value,
    readOnly,
    dialect,
    placeholder = "Write here.",
    scaffolds = [],
    linkTargets = [],
    onUpload,
    accept,
    room,
  } = props;
  const host = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const origin = useRef<{ tail: string; prints: Map<number, string>; last: string }>({
    tail: "",
    prints: new Map(),
    last: value,
  });
  // The latest props, for the editor's callbacks, which it made once; set after each render, not during it.
  const propsRef = useRef(props);
  const readOnlyRef = useRef(readOnly);
  const [ready, setReady] = useState(false);
  const [words, setWords] = useState(() => wordCount(value));
  const [palette, setPalette] = useState<Palette | null>(null);
  const [slash, setSlash] = useState<number | null>(null);
  const [upload, setUploadState] = useState<Upload>(null);
  const uploadRef = useRef<Upload>(null);
  const setUpload = (next: Upload) => {
    uploadRef.current?.sending?.abort();
    uploadRef.current = next;
    setUploadState(next);
  };
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [said, say] = useState("");
  const [activeTool, setActiveTool] = useState(0);
  const toolbar = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLUListElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);

  /** The Markdown the document stands for: unchanged blocks as their bytes, the rest spelled again. */
  const markdown = (editor: Editor) =>
    roomRef.current
      ? roomRef.current.markdown(editor.getJSON())
      : fromDoc(editor.getJSON() as JsonNode, origin.current.tail, origin.current.prints, dialect);
  const roomRef = useRef(room);
  const sourceLocked = () =>
    readOnlyRef.current ||
    Boolean(editorRef.current && roomRef.current?.sourceLocked(editorRef.current.state));

  const load = (editor: Editor, source: string) => {
    const loaded = toDoc(source, dialect);
    const doc = editor.schema.nodeFromJSON(loaded.doc);
    // Not an edit: no undo step, and no change reported.
    editor.view.dispatch(
      editor.state.tr
        .replaceWith(0, editor.state.doc.content.size, doc.content)
        .setMeta("addToHistory", false)
        .setMeta("preventUpdate", true),
    );
    origin.current = {
      tail: loaded.tail,
      prints: fingerprints(editor.getJSON() as JsonNode),
      last: source,
    };
    setWords(wordCount(source));
  };

  // The editor itself: made once, after the page is in the browser.
  useEffect(() => {
    if (!host.current) return;
    const loaded = toDoc(value, dialect);
    const inRoom = roomRef.current;
    const editor = new Editor({
      element: host.current,
      extensions: [
        ...baseExtensions({ room: Boolean(inRoom) }).filter(
          (e) => e.name !== "sourceBlock" && e.name !== "sourceInline",
        ),
        sourceBlockView(sourceLocked),
        SourceInlineView,
        Placeholder.configure({ placeholder }),
        ...(inRoom ? inRoom.extensions() : []),
      ],
      // In a room the content is the room's.
      ...(inRoom ? {} : { content: loaded.doc as JSONContent }),
      editable: !readOnly,
      // Sites keep style-src 'self': Tiptap's base rules are in rich-editor.css, not a style element.
      injectCSS: false,
      editorProps: {
        attributes: {
          class: "cap-rich-editor-surface",
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": ariaLabel,
          "aria-placeholder": placeholder,
          spellcheck: "true",
        },
        handleKeyDown: (_view, event) => {
          const mod = event.ctrlKey || event.metaKey;
          if (mod && event.key.toLowerCase() === "s") return true; // The page's own Ctrl+S saves; the browser's never opens.
          if (mod && event.key.toLowerCase() === "k") {
            openPalette();
            return true;
          }
          if (event.key === "ArrowDown" && slashOpen.current) {
            slashRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
            return true;
          }
          if (event.key === "Escape" && slashOpen.current) {
            setSlash(null);
            return true;
          }
          return false;
        },
        handlePaste: (view, event) => {
          const files = [...(event.clipboardData?.files ?? [])].filter((f) =>
            f.type.startsWith("image/"),
          );
          if (files[0] && propsRef.current.onUpload) {
            startUpload(files[0]);
            return true;
          }
          // Markdown pasted as text becomes formatted blocks, as typing it in Markdown did.
          const html = event.clipboardData?.getData("text/html");
          const text = event.clipboardData?.getData("text/plain");
          if (!html && text && /\n|^#{1,6} |^[-*+] |^\d+\. |^> |[*_`[]/.test(text)) {
            const blocks = pastedBlocks(text, dialect);
            const single = blocks.length === 1 && blocks[0]!.type === "paragraph";
            editorRef.current?.commands.insertContent(single ? (blocks[0]!.content ?? []) : blocks);
            return true;
          }
          if (html) {
            pasteHtml(view, html);
            return true;
          }
          return false;
        },
        handleDrop: (view, event) => {
          const drop = event as DragEvent;
          const files = [...(drop.dataTransfer?.files ?? [])].filter((f) =>
            f.type.startsWith("image/"),
          );
          if (files[0] && propsRef.current.onUpload) {
            event.preventDefault();
            startUpload(files[0]);
            return true;
          }
          // Formatted text dragged in from elsewhere is read as a paste is; a drag inside the text is the editor's.
          const html = drop.dataTransfer?.getData("text/html");
          const at = view.posAtCoords({ left: drop.clientX, top: drop.clientY });
          if (html && !view.dragging && at && !readOnlyRef.current) {
            event.preventDefault();
            editorRef.current?.commands.setTextSelection(at.pos);
            pasteHtml(view, html);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: e }) => {
        syncSlash(e);
        // In a room, the room works out the Markdown for everyone, and `value` brings it back.
        if (roomRef.current) return;
        const md = markdown(e);
        origin.current.last = md;
        setWords(wordCount(md));
        propsRef.current.onChange(md);
        syncSlash(e);
      },
      onSelectionUpdate: ({ editor: e }) => syncSlash(e),
    });
    origin.current = {
      tail: loaded.tail,
      prints: fingerprints(editor.getJSON() as JsonNode),
      last: value,
    };
    editorRef.current = editor;
    inRoom?.sync(editor);
    setReady(true);
    propsRef.current.onReady?.({ insertMarkdown, focus: () => editor.commands.focus(), editor });
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // Made once; later values come in through the effects below.
    // oxlint-disable-next-line react/exhaustive-deps -- made once: the ProseMirror editor owns its state, and later values come in through the effects below
  }, []);

  // A new value from outside (a discarded draft, an AI draft taken as the working copy) is loaded. In a
  // room, a replacement arrives through the room itself, and the value is only counted.
  useEffect(() => {
    const editor = editorRef.current;
    if (room) setWords(wordCount(value));
    else if (editor && value !== origin.current.last) load(editor, value);
    // oxlint-disable-next-line react/exhaustive-deps -- a new value only: the room and load are read as they are when it comes
  }, [value]);

  // The room changed (suggesting on or off, its people, its threads): the editor is brought in step.
  const syncKey = room?.syncKey;
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && roomRef.current) roomRef.current.sync(editor);
  }, [syncKey]);

  useEffect(() => {
    editorRef.current?.setEditable(!readOnly, false);
  }, [readOnly]);

  // ---- the block menu on a lone "/"
  const slashOpen = useRef(false);
  useLayoutEffect(() => {
    propsRef.current = props;
    readOnlyRef.current = readOnly;
    roomRef.current = room;
    slashOpen.current = slash !== null;
  });
  function syncSlash(editor: Editor) {
    const { $from, empty: collapsed } = editor.state.selection;
    const lone =
      collapsed &&
      !readOnlyRef.current &&
      scaffolds.length > 0 &&
      $from.depth === 1 &&
      $from.parent.type.name === "paragraph" &&
      $from.parent.textContent === "/" &&
      $from.parentOffset === 1;
    setSlash(lone ? $from.before() : null);
  }
  useEffect(() => {
    const menu = slashRef.current;
    const editor = editorRef.current;
    if (!menu || !editor || slash === null) return;
    menu.showPopover?.();
    const at = editor.view.coordsAtPos(slash + 1);
    place(
      {
        getBoundingClientRect: () => new DOMRect(at.left, at.top, 0, at.bottom - at.top),
      } as Element,
      menu,
      { side: "bottom", align: "start" },
    );
    say("Block menu open. Press Down arrow to choose a block, Escape to close.");
    return () => {
      try {
        menu.hidePopover?.();
      } catch {
        // Already closed.
      }
    };
  }, [slash]);

  function insertScaffold(s: Scaffold, fromSlash: boolean) {
    const editor = editorRef.current;
    if (!editor) return;
    const block = { type: "sourceBlock", attrs: { text: s.text, kind: s.label } };
    const chain = editor.chain().focus();
    if (fromSlash && slash !== null)
      chain
        .insertContentAt(
          { from: slash, to: slash + editor.state.doc.nodeAt(slash)!.nodeSize },
          block,
        )
        .run();
    else chain.insertContent(block).run();
    setSlash(null);
    focusSourceBlock(editor, s);
  }

  /** Focus lands inside the new block's Markdown, where the block says (for example inside alt=""). */
  function focusSourceBlock(editor: Editor, s: Scaffold) {
    requestAnimationFrame(() => {
      const areas = [
        ...editor.view.dom.querySelectorAll<HTMLTextAreaElement>(".cap-rich-editor-src-text"),
      ];
      const area =
        areas.find((a) => a.value === s.text && document.activeElement !== a) ?? areas.at(-1);
      if (!area) return;
      area.focus();
      const at = s.cursorAfter
        ? s.text.indexOf(s.cursorAfter) + s.cursorAfter.length
        : (s.cursor ?? s.text.length);
      area.setSelectionRange(at, at);
    });
  }

  function insertMarkdown(md: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(pastedBlocks(md, dialect) as JSONContent[])
      .run();
  }

  // ---- the link palette
  function openPalette() {
    const editor = editorRef.current;
    if (!editor || readOnlyRef.current) return;
    const { from, to } = editor.state.selection;
    setSlash(null);
    setPalette({ from, to, query: editor.state.doc.textBetween(from, to, " "), active: 0 });
  }
  useEffect(() => {
    const panel = paletteRef.current;
    const editor = editorRef.current;
    if (!panel || !editor || !palette) return;
    panel.showPopover?.();
    const at = editor.view.coordsAtPos(palette.from);
    place(
      {
        getBoundingClientRect: () => new DOMRect(at.left, at.top, 0, at.bottom - at.top),
      } as Element,
      panel,
      { side: "bottom", align: "start" },
    );
    panel.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      try {
        panel.hidePopover?.();
      } catch {
        // Already closed.
      }
    };
    // Opened once per palette; typing in it does not move it.
    // oxlint-disable-next-line react/exhaustive-deps -- opened once per palette; typing in it does not move it
  }, [palette !== null]);
  const matches = palette ? filterLinkTargets(linkTargets, palette.query) : [];
  const typedUrl = palette && looksLikeUrl(palette.query) ? palette.query.trim() : null;
  function closePalette(restore: boolean) {
    const editor = editorRef.current;
    const p = palette;
    setPalette(null);
    if (editor && p && restore)
      editor.chain().focus().setTextSelection({ from: p.from, to: p.to }).run();
  }
  function applyLink(href: string, title: string) {
    const editor = editorRef.current;
    const p = palette;
    setPalette(null);
    if (!editor || !p) return;
    const chain = editor.chain().focus().setTextSelection({ from: p.from, to: p.to });
    if (p.from === p.to)
      chain
        .insertContent({ type: "text", text: title, marks: [{ type: "link", attrs: { href } }] })
        .run();
    else chain.setLink({ href }).run();
    // The cursor lands after the link, outside it.
    editor.commands.unsetMark("link", { extendEmptyMarkRange: false });
  }

  // ---- images: described, then sent, then in the text
  function startUpload(file: File) {
    if (!propsRef.current.onUpload) return;
    setUploadError(null);
    setAlt("");
    // A data: URL, not blob:, so the preview needs nothing a site's img-src does not already allow.
    const next: NonNullable<Upload> = { file, preview: "", sending: null };
    setUpload(next);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (uploadRef.current === next && typeof reader.result === "string") {
        const shown = { ...next, preview: reader.result };
        uploadRef.current = shown;
        setUploadState(shown);
      }
    });
    reader.readAsDataURL(file);
    say(`Describe ${file.name} to insert it.`);
    requestAnimationFrame(() => altRef.current?.focus());
  }
  function cancelUpload() {
    setUpload(null);
    setUploadError(null);
    editorRef.current?.commands.focus();
  }
  async function insertImage(decorative: boolean) {
    const current = uploadRef.current;
    const send = propsRef.current.onUpload;
    const text = decorative ? "" : alt.trim();
    if (!current || current.sending || !send || (!decorative && !text)) return;
    const sending = new AbortController();
    const busy = { ...current, sending };
    uploadRef.current = busy;
    setUploadState(busy);
    setUploadError(null);
    say(`Uploading ${current.file.name}`);
    try {
      const { url } = await send(current.file, { alt: text, decorative }, sending.signal);
      if (uploadRef.current !== busy) return;
      const md = (propsRef.current.imageMarkdown ?? defaultImageMarkdown)({
        url,
        alt: text,
        decorative,
        name: current.file.name,
      });
      uploadRef.current = null;
      setUploadState(null);
      insertMarkdown(md);
      say("Image inserted.");
    } catch (error) {
      if (uploadRef.current !== busy) return;
      // The step stays, with what was typed, so a retry is one press.
      const kept = { ...current, sending: null };
      uploadRef.current = kept;
      setUploadState(kept);
      setUploadError(error instanceof Error ? error.message : "The upload failed.");
      say("");
    }
  }

  // ---- the toolbar
  const run = (fn: (e: Editor) => void) => () => {
    const editor = editorRef.current;
    if (editor) fn(editor);
  };
  const tools = [
    {
      id: "bold",
      label: "Bold",
      hint: "Ctrl or Cmd + B",
      keys: "Control+B Meta+B",
      paths: GLYPH.bold,
      run: run((e) => e.chain().focus().toggleBold().run()),
    },
    {
      id: "italic",
      label: "Italic",
      hint: "Ctrl or Cmd + I",
      keys: "Control+I Meta+I",
      paths: GLYPH.italic,
      run: run((e) => e.chain().focus().toggleItalic().run()),
    },
    {
      id: "link",
      label: "Link",
      hint: "Ctrl or Cmd + K, searches pages",
      keys: "Control+K Meta+K",
      paths: GLYPH.link,
      run: openPalette,
    },
    {
      id: "heading",
      label: "Heading level",
      hint: "Cycles h2, h3, h4, none",
      paths: GLYPH.heading,
      run: run((e) => {
        const level = e.isActive("heading", { level: 2 })
          ? 3
          : e.isActive("heading", { level: 3 })
            ? 4
            : e.isActive("heading", { level: 4 })
              ? 0
              : 2;
        if (level === 0) e.chain().focus().setParagraph().run();
        else
          e.chain()
            .focus()
            .setHeading({ level: level as 2 | 3 | 4 })
            .run();
      }),
    },
    {
      id: "code",
      label: "Code",
      hint: "Ctrl or Cmd + E",
      keys: "Control+E Meta+E",
      paths: GLYPH.code,
      run: run((e) => e.chain().focus().toggleCode().run()),
    },
    {
      id: "footnote",
      label: "Footnote",
      hint: "A reference and its definition",
      paths: GLYPH.footnote,
      run: run((e) => {
        const md = markdown(e);
        const n = Math.max(0, ...[...md.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]))) + 1;
        e.chain()
          .focus()
          .insertContent({ type: "sourceInline", attrs: { text: `[^${n}]` } })
          .run();
        const end = e.state.doc.content.size;
        e.chain()
          .insertContentAt(end, {
            type: "sourceBlock",
            attrs: { text: `[^${n}]: `, kind: "Footnote" },
          })
          .run();
        focusSourceBlock(e, { id: "footnote", label: "Footnote", hint: "", text: `[^${n}]: ` });
      }),
    },
    ...(onUpload
      ? [
          {
            id: "image",
            label: "Insert image",
            hint: "Asks for alt text, then uploads the file",
            paths: GLYPH.image,
            run: () => fileRef.current?.click(),
          },
        ]
      : []),
  ];
  const blocks = scaffolds.map((s) => ({
    id: `scaffold-${s.id}`,
    label: s.label,
    hint: s.hint,
    keys: undefined,
    paths: s.icon ? [s.icon] : [],
    glyph: s.label.slice(0, 1),
    run: () => insertScaffold(s, false),
  }));
  const all = [...tools, ...blocks];
  const onToolbarKey = (event: React.KeyboardEvent) => {
    const buttons = [
      ...(toolbar.current?.querySelectorAll<HTMLButtonElement>(".cap-md-tool:not(:disabled)") ??
        []),
    ];
    const at = buttons.findIndex((b) => b === document.activeElement);
    const next =
      event.key === "ArrowRight"
        ? (at + 1) % buttons.length
        : event.key === "ArrowLeft"
          ? (at - 1 + buttons.length) % buttons.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : null;
    if (next === null || at < 0) return;
    event.preventDefault();
    buttons[next]?.focus();
  };
  const off = readOnly || !ready;

  return (
    <div
      className="cap-md cap-rich-editor"
      data-ready={ready ? "" : undefined}
      data-hide-front={room?.hideFrontMatter ? "" : undefined}
    >
      <div className="cap-md-frame">
        {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- a roving-tabindex toolbar: its buttons take focus, the arrow keys move between them */}
        <div
          className="cap-md-toolbar"
          role="toolbar"
          aria-label="Formatting"
          ref={toolbar}
          onKeyDown={onToolbarKey}
        >
          {all.map((t, i) => (
            <span key={t.id} className="cap-rich-editor-slot">
              {i === tools.length && blocks.length > 0 ? (
                <span className="cap-md-sep" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                className="cap-md-tool"
                aria-label={t.label}
                title={`${t.label}. ${t.hint}`}
                aria-keyshortcuts={t.keys}
                tabIndex={i === activeTool ? 0 : -1}
                disabled={off}
                onFocus={() => setActiveTool(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={t.run}
              >
                {t.paths.length > 0 ? (
                  <Icon paths={t.paths} />
                ) : (
                  <span className="cap-md-tool-glyph" aria-hidden="true">
                    {"glyph" in t ? String(t.glyph) : ""}
                  </span>
                )}
              </button>
            </span>
          ))}
          {blocks.length > 0 ? (
            <span className="cap-md-toolbar-hint">Type / on an empty line</span>
          ) : null}
        </div>
        {!ready ? (
          // Before the script: the Markdown itself, readable and selectable.
          <textarea
            className="cap-input cap-md-source"
            aria-label={ariaLabel}
            value={value}
            readOnly
            rows={12}
          />
        ) : null}
        <div ref={host} className="cap-md-surface cap-rich-editor-host" hidden={!ready} />
        <div className="cap-md-foot">
          {onUpload ? (
            <p className="cap-md-hint" aria-hidden="true">
              <Icon paths={GLYPH.image} />
              Drop or paste an image to upload it
            </p>
          ) : null}
          <p className="cap-md-stats">
            <span className="cap-md-count">
              {words.toLocaleString("en")} word{words === 1 ? "" : "s"}
              {words > 0 ? ` · ${readingMinutes(words)} min read` : ""}
            </span>
          </p>
        </div>
      </div>
      <p className="cap-sr-only" role="status">
        {said}
      </p>
      {onUpload ? (
        <input
          ref={fileRef}
          type="file"
          hidden
          tabIndex={-1}
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) startUpload(f);
          }}
        />
      ) : null}
      {upload ? (
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
              cancelUpload();
            }
          }}
        >
          <img className="cap-md-upload-thumb" src={upload.preview || undefined} alt="" />
          <div className="cap-md-upload-fields">
            <label className="cap-field-label" htmlFor="rich-alt">
              Alt text{" "}
              <span className="cap-field-required" aria-hidden="true">
                Required
              </span>
            </label>
            <input
              ref={altRef}
              id="rich-alt"
              className="cap-input"
              autoComplete="off"
              placeholder="What the image shows"
              aria-describedby="rich-alt-help"
              value={alt}
              readOnly={Boolean(upload.sending)}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => {
                // legacy-scan:keep isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
                if (e.key === "Enter" && !isImeEnter(e.nativeEvent)) {
                  e.preventDefault();
                  void insertImage(false);
                }
              }}
            />
            <p className="cap-field-help" id="rich-alt-help">
              Describe {upload.file.name} for a person who cannot see it, or insert it as decorative
              if it adds nothing. It is uploaded when you insert it.
            </p>
            {upload.sending ? (
              <p className="cap-md-upload-wait">Uploading {upload.file.name}</p>
            ) : null}
            {uploadError ? (
              <p className="cap-field-error cap-md-upload-error" role="alert">
                {uploadError}
              </p>
            ) : null}
            <div className="cap-md-upload-actions">
              <button
                type="button"
                className="cap-btn"
                data-variant="primary"
                disabled={!alt.trim() || Boolean(upload.sending)}
                onClick={() => void insertImage(false)}
              >
                Insert image
              </button>
              <button
                type="button"
                className="cap-btn"
                disabled={Boolean(upload.sending)}
                onClick={() => void insertImage(true)}
              >
                Insert as decorative
              </button>
              <button type="button" className="cap-btn" data-variant="quiet" onClick={cancelUpload}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {palette ? (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape and the arrow keys inside the link palette; the group only catches them from its input
        <div
          ref={paletteRef}
          className="cap-popover cap-md-palette"
          popover="manual"
          role="group"
          aria-label="Insert a link"
          data-size="lg"
          data-side="bottom"
          data-align="start"
          onBlur={(e) => {
            if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)))
              closePalette(false);
          }}
        >
          <label className="cap-md-palette-label" htmlFor="rich-link">
            Link to
          </label>
          <input
            id="rich-link"
            type="text"
            className="cap-input"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={matches.length > 0}
            aria-controls="rich-link-list"
            aria-activedescendant={matches.length > 0 ? `rich-link-${palette.active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search pages, or type a URL"
            value={palette.query}
            onChange={(e) => setPalette({ ...palette, query: e.target.value, active: 0 })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                closePalette(true);
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
                if (typedUrl) applyLink(typedUrl, typedUrl);
                else if (matches[palette.active])
                  applyLink(matches[palette.active]!.href, matches[palette.active]!.title);
              }
            }}
          />
          <div
            className="cap-listbox"
            role="listbox"
            id="rich-link-list"
            aria-label="Pages"
            data-wrap=""
          >
            {matches.map((m, i) => (
              // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- a listbox option chosen by pointer; the palette's input drives it from the keyboard (aria-activedescendant)
              <div
                key={m.href}
                id={`rich-link-${i}`}
                className="cap-option"
                role="option"
                aria-selected={i === palette.active}
                data-active={i === palette.active ? "" : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyLink(m.href, m.title)}
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
                ? "No page matches. Type a full address to link to it."
                : `${plural(matches.length, "page")}.`}
          </p>
        </div>
      ) : null}
      {slash !== null ? (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the block menu's keys come from the editor, which keeps focus while it is open
        <ul
          ref={slashRef}
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
              setSlash(null);
              editorRef.current?.commands.focus();
            } else if (
              e.key === "ArrowDown" ||
              e.key === "ArrowUp" ||
              e.key === "Home" ||
              e.key === "End"
            ) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? items.length - 1
                    : (at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
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
                onClick={() => insertScaffold(s, true)}
              >
                <strong>{s.label}</strong>
                <span className="cap-md-slash-hint">{s.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A toolbar icon: the markdown editor's 24-unit stroke paths, hidden because each button has a name. */
function Icon({ paths }: { paths: string[] }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * Pasted HTML, parsed in an inert document (no script runs, nothing loads) through Capsomer's policy and
 * read by the editor's schema, which keeps only what it knows. ProseMirror's own paste would give the
 * string to the page's default Trusted Types policy, which escapes markup, so a formatted paste would
 * arrive as tags in the text.
 */
function pasteHtml(view: EditorView, html: string) {
  const body = inertDocument(html).body;
  let slice = SchemaParser.fromSchema(view.state.schema).parseSlice(body, {
    preserveWhitespace: true,
  });
  view.someProp("transformPasted", (f) => {
    slice = f(slice, view, false);
  });
  view.dispatch(
    view.state.tr
      .replaceSelection(slice)
      .scrollIntoView()
      .setMeta("paste", true)
      .setMeta("uiEvent", "paste"),
  );
}
