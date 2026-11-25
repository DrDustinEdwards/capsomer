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

import { wordCount, readingMinutes } from "@drdustinedwards/site-helpers/text";
import { Editor, type JSONContent } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  filterLinkTargets,
  looksLikeUrl,
  type Scaffold,
} from "../markdown-editor/markdown-editor.ts";
import { openAt } from "../popover/popover.ts";
import { caretAnchor, focusSourceBlock, pasteHtml } from "./rich-editor-dom.ts";
import {
  fingerprints,
  fromDoc,
  pastedBlocks,
  toDoc,
  type JsonNode,
} from "./rich-editor-markdown.mjs";
import { ImageStep, LinkPalette, SlashMenu } from "./rich-editor-panels.tsx";
import { baseExtensions } from "./rich-editor-schema.mjs";
import { sourceBlockView, SourceInlineView } from "./rich-editor-source-views.ts";
import { Toolbar, formattingTools } from "./rich-editor-toolbar.tsx";
import type { Palette, RichEditorProps } from "./rich-editor-types.ts";
import { useImageStep } from "./rich-editor-upload.ts";

export type { RichEditorHandle, RichEditorProps, RichRoom } from "./rich-editor-types.ts";

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
  const [said, say] = useState("");
  const [activeTool, setActiveTool] = useState(0);
  // One editor's ids, so two editors on a page never share a label's or a listbox's target.
  const uid = useId();
  const toolbar = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLUListElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const img = useImageStep({
    props: propsRef,
    editor: editorRef,
    say,
    insertMarkdown: (md) => insertMarkdown(md),
  });

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
            img.start(files[0]);
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
            img.start(files[0]);
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
    // The anchor is read again on scroll, so the menu stays under the "/".
    const close = openAt(menu, caretAnchor(editor, slash + 1), { side: "bottom", align: "start" });
    say("Block menu open. Press Down arrow to choose a block, Escape to close.");
    return close;
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

  function insertMarkdown(md: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(pastedBlocks(md, dialect) as JSONContent[])
      .run();
  }

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
    const close = openAt(panel, caretAnchor(editor, palette.from), {
      side: "bottom",
      align: "start",
    });
    panel.querySelector<HTMLInputElement>("input")?.focus();
    return close;
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

  const tools = formattingTools({
    editor: () => editorRef.current,
    markdown,
    openPalette,
    chooseImage: onUpload ? () => fileRef.current?.click() : null,
  });
  const blocks = scaffolds.map((s) => ({
    id: `scaffold-${s.id}`,
    label: s.label,
    hint: s.hint,
    paths: s.icon ? [s.icon] : [],
    glyph: s.label.slice(0, 1),
    run: () => insertScaffold(s, false),
  }));
  const off = readOnly || !ready;

  return (
    <div
      className="cap-md cap-rich-editor"
      data-ready={ready ? "" : undefined}
      data-hide-front={room?.hideFrontMatter ? "" : undefined}
    >
      <div className="cap-md-frame">
        <Toolbar
          tools={tools}
          blocks={blocks}
          active={activeTool}
          setActive={setActiveTool}
          off={off}
          barRef={toolbar}
        />
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
            if (f) img.start(f);
          }}
        />
      ) : null}
      {img.upload ? (
        <ImageStep
          uid={uid}
          upload={img.upload}
          alt={img.alt}
          setAlt={img.setAlt}
          error={img.error}
          altRef={img.altRef}
          insert={(decorative) => void img.insert(decorative)}
          cancel={img.cancel}
        />
      ) : null}
      {palette ? (
        <LinkPalette
          uid={uid}
          palette={palette}
          setPalette={setPalette}
          matches={matches}
          typedUrl={typedUrl}
          panelRef={paletteRef}
          close={closePalette}
          apply={applyLink}
        />
      ) : null}
      {slash !== null ? (
        <SlashMenu
          scaffolds={scaffolds}
          menuRef={slashRef}
          editor={() => editorRef.current}
          close={() => setSlash(null)}
          choose={(s) => insertScaffold(s, true)}
        />
      ) : null}
    </div>
  );
}
