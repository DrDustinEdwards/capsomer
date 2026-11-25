// The markdown editor's behavior: a labeled <textarea>, delivered in the page's HTML, is
// upgraded in place to a CodeMirror surface with a toolbar, a link palette, a slash menu, an
// image prompt that insists on alt text, and a word count. The textarea stays in the page,
// hidden and kept in step, so a form posts the markdown and a page without script still has
// a working field; see markdown-editor.md.
//
// This file holds no CodeMirror: it imports markdown-editor.view.ts with import(), so the
// editor is its own chunk. The pure helpers (edits, counting, filtering, roving) are
// exported so the React wrapper and a node test can use them without the browser.

import { plural, readingMinutes, wordCount } from "@drdustinedwards/site-helpers/text";
import { type EditorContext, el } from "./markdown-editor-dom.ts";
import {
  type Edit,
  type MarkdownEditorHandle,
  type MarkdownEditorOptions,
  type Scaffold,
  blockEdit,
  scaffoldCursor,
  slashBlockEdit,
} from "./markdown-editor-edits.ts";
import { createLinkPalette } from "./markdown-editor-link.ts";
import { createToolbar } from "./markdown-editor-toolbar.ts";
import { createSlashMenu } from "./markdown-editor-slash.ts";
import { createUploader } from "./markdown-editor-upload.ts";
import type { Surface } from "./markdown-editor.view.ts";

export { rovingIndex } from "../toolbar/toolbar.ts";
export { GLYPH } from "./markdown-editor-dom.ts";
export {
  looksLikeUrl,
  filterLinkTargets,
  lineBounds,
  wrapEdit,
  headingEdit,
  footnoteEdit,
  blockEdit,
  slashBlockEdit,
  scaffoldCursor,
  linkEdit,
  defaultImageMarkdown,
} from "./markdown-editor-edits.ts";
export type {
  Edit,
  ImageDescription,
  LinkTarget,
  Scaffold,
  UploadResult,
  MarkdownEditorOptions,
  MarkdownEditorHandle,
} from "./markdown-editor-edits.ts";

let serial = 0;

function nonceFromPage(): string {
  if (typeof document === "undefined") return "";
  // The property, not getAttribute: browsers hide the attribute after parsing.
  return document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ?? "";
}

// Upgrades one editor: the element carrying data-cap="markdown-editor", holding a label and a
// textarea. Resolves once CodeMirror has loaded and the surface is mounted; if it cannot
// load, the textarea simply stays, and the promise rejects.
export async function mountMarkdownEditor(
  host: HTMLElement,
  options: MarkdownEditorOptions = {},
): Promise<MarkdownEditorHandle> {
  const found = host.querySelector("textarea");
  if (!found) throw new Error("markdown-editor: no <textarea> inside the element");
  const ta: HTMLTextAreaElement = found;
  const labelEl = host.querySelector("label");
  // A server build (Vite sets import.meta.env.SSR) never reaches this line, since a surface mounts only in a browser,
  // so the bundler drops the CodeMirror chunk from a server bundle: about 300 KB of Carrel's Worker was CodeMirror.
  // Outside Vite `env` is undefined and the import runs as before.
  if ((import.meta as { env?: { SSR?: boolean } }).env?.SSR)
    throw new Error("markdown-editor: a surface mounts only in a browser");
  const { createSurface } = await import("./markdown-editor.view.ts");
  // The element may have been detached or upgraded while CodeMirror loaded.
  if (!host.isConnected) throw new Error("markdown-editor: the element left the page");
  if (handles.has(host)) throw new Error("markdown-editor: the element is already an editor");

  const o: MarkdownEditorOptions = { ...options };
  const uid = `cap-md-${++serial}`;
  const cleanups: Array<() => void> = [];
  const listen = <T extends EventTarget>(
    t: T,
    type: string,
    fn: (e: never) => void,
    opt?: AddEventListenerOptions | boolean,
  ) => {
    t.addEventListener(type, fn as EventListener, opt);
    cleanups.push(() => t.removeEventListener(type, fn as EventListener, opt));
  };

  let surface: Surface | null = null;
  let quiet = false; // true while the app itself sets the text: no onChange for that
  let requiredMessage: HTMLElement | null = null;

  const readOnly = () => o.readOnly ?? ta.readOnly;
  const disabled = () => o.disabled ?? ta.disabled;
  const placeholder = () =>
    o.placeholder ?? (ta.getAttribute("placeholder") || "Write in markdown.");
  const maxLength = () => o.maxLength ?? (ta.maxLength > 0 ? ta.maxLength : undefined);
  const labelText = () =>
    o.label ??
    `${(labelEl?.textContent ?? "Body").replace(/\s*Required\s*$/i, "").trim() || "Body"}, markdown`;
  const attrs = (): Record<string, string> => {
    const a: Record<string, string> = { "aria-label": labelText() };
    if (ta.getAttribute("aria-invalid") === "true") a["aria-invalid"] = "true";
    const described = ta.getAttribute("aria-describedby");
    if (described) a["aria-describedby"] = described;
    if (ta.required) a["aria-required"] = "true";
    if (readOnly()) a["aria-readonly"] = "true";
    if (disabled()) a["aria-disabled"] = "true";
    return a;
  };

  const frame = el("div", { class: "cap-md-frame" });
  const toolbar = el("div", {
    class: "cap-md-toolbar",
    role: "toolbar",
    "aria-label": "Markdown formatting",
  });
  const surfaceEl = el("div", { class: "cap-md-surface" });
  const foot = el("div", { class: "cap-md-foot" });
  const stats = el("p", { class: "cap-md-stats" });
  const statsCount = el("span", { class: "cap-md-count" });
  const statsLimit = el("span", { class: "cap-md-limit" });
  const status = el("p", { class: "cap-sr-only", role: "status" });
  const file = el("input", { type: "file", hidden: "" });
  file.tabIndex = -1;
  stats.append(statsCount, statsLimit);
  foot.append(stats);
  frame.append(toolbar, surfaceEl, foot);

  const say = (text: string) => {
    status.textContent = text;
  };

  function updateStats(value: string) {
    const words = wordCount(value);
    const mins = readingMinutes(words, 0, o.wordsPerMinute);
    statsCount.textContent = `${plural(words, "word", "words", { grouped: true })}${words > 0 ? ` · ${mins} min read` : ""}`;
    const max = maxLength();
    if (max === undefined) {
      statsLimit.textContent = "";
      delete statsLimit.dataset.over;
    } else if (value.length > max) {
      statsLimit.textContent = ` · ${(value.length - max).toLocaleString("en")} over the ${max.toLocaleString("en")} character limit`;
      statsLimit.dataset.over = "";
    } else {
      statsLimit.textContent = ` · ${value.length.toLocaleString("en")} of ${max.toLocaleString("en")} characters`;
      delete statsLimit.dataset.over;
    }
  }

  const doc = () => surface?.getValue() ?? ta.value;
  const apply = (edit: Edit) => surface?.apply(edit);
  const sel = () => surface?.selection() ?? { from: 0, to: 0 };

  const ctx: EditorContext = {
    host,
    frame,
    uid,
    o,
    surface: () => surface,
    doc,
    apply,
    sel,
    say,
    locked: () => readOnly() || disabled(),
  };
  const slash = createSlashMenu(ctx, (s) => insertScaffold(s, true));
  const palette = createLinkPalette(ctx, slash.close);
  const uploader = createUploader(ctx);

  function insertScaffold(s: Scaffold, replaceSlash = false) {
    if (!surface) return;
    const fromSlash = replaceSlash && slash.isOpen();
    slash.close();
    const cursor = scaffoldCursor(s);
    if (fromSlash) {
      const c = surface.caret();
      surface.apply(slashBlockEdit(c.lineFrom, c.lineTo, s.text, cursor));
    } else {
      apply(blockEdit(doc(), sel().from, sel().to, s.text, cursor));
    }
  }

  const tb = createToolbar(ctx, {
    toolbar,
    file,
    openLink: palette.open,
    insertScaffold: (s) => insertScaffold(s),
  });
  const { commands } = tb;
  cleanups.push(tb.attach());

  listen(file, "change", () => {
    const f = file.files?.[0];
    file.value = "";
    if (f) uploader.start(f);
  });

  function syncState() {
    surface?.configure({
      placeholder: placeholder(),
      readOnly: readOnly(),
      disabled: disabled(),
      attrs: attrs(),
    });
    for (const b of toolbar.querySelectorAll<HTMLButtonElement>(".cap-md-tool"))
      b.disabled = disabled() || readOnly();
    file.accept = o.accept ?? "image/*";
    updateStats(doc());
    if (disabled() || readOnly()) {
      slash.close();
      palette.close(false);
    }
  }

  function onDocChange(value: string) {
    ta.value = value;
    updateStats(value);
    if (requiredMessage && value.trim() !== "") clearRequired();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    host.dispatchEvent(new CustomEvent("cap-md-change", { bubbles: true, detail: { value } }));
    if (!quiet) o.onChange?.(value);
  }

  function clearRequired() {
    ta.removeAttribute("aria-invalid");
    const id = requiredMessage?.id;
    if (id)
      ta.setAttribute(
        "aria-describedby",
        (ta.getAttribute("aria-describedby") ?? "")
          .split(/\s+/)
          .filter((x) => x && x !== id)
          .join(" "),
      );
    if (!ta.getAttribute("aria-describedby")) ta.removeAttribute("aria-describedby");
    requiredMessage?.remove();
    requiredMessage = null;
    syncState();
  }

  // A required, empty textarea blocks the form, and the browser cannot focus a hidden one to
  // say so. This does it for the editor: focus the surface and say what is wrong.
  listen(ta, "invalid", (e: Event) => {
    e.preventDefault();
    if (!requiredMessage) {
      requiredMessage = el(
        "p",
        { class: "cap-field-error", id: `${uid}-required`, role: "alert" },
        ta.dataset.errorValueMissing ?? "Write something before saving.",
      );
      ta.after(requiredMessage);
      ta.setAttribute(
        "aria-describedby",
        [`${uid}-required`, ta.getAttribute("aria-describedby")].filter(Boolean).join(" "),
      );
    }
    ta.setAttribute("aria-invalid", "true");
    syncState();
    surface?.focus();
  });
  const form = ta.form;
  if (form) listen(form, "reset", () => setTimeout(() => api.setValue(ta.defaultValue), 0));
  if (labelEl) listen(labelEl, "click", () => surface?.focus());
  // Focus leaving the editor closes the slash menu; a click into the menu is not leaving.
  listen(host, "focusout", (e: FocusEvent) => {
    const to = e.relatedTarget;
    if (slash.isOpen() && !slash.holds(to) && !(to instanceof Node && frame.contains(to)))
      slash.close();
  });

  const watch = new MutationObserver(syncState);
  watch.observe(ta, {
    attributes: true,
    attributeFilter: [
      "readonly",
      "disabled",
      "aria-invalid",
      "aria-describedby",
      "placeholder",
      "maxlength",
      "required",
    ],
  });

  tb.build();
  surface = createSurface({
    parent: surfaceEl,
    doc: ta.value,
    placeholder: placeholder(),
    nonce: o.nonce ?? nonceFromPage(),
    lineNumbers: !!o.lineNumbers,
    readOnly: readOnly(),
    disabled: disabled(),
    attrs: attrs(),
    onDocChange,
    onCaret: slash.sync,
    onFile: (f) => {
      if (!o.onUpload) return false;
      uploader.start(f);
      return true;
    },
    onKey(name) {
      switch (name) {
        case "bold":
          if (!readOnly() && !disabled()) commands.bold();
          return true;
        case "italic":
          if (!readOnly() && !disabled()) commands.italic();
          return true;
        case "code":
          if (!readOnly() && !disabled()) commands.code();
          return true;
        case "link":
          palette.open();
          return true;
        case "save": {
          const value = doc();
          const ev = new CustomEvent("cap-md-save", {
            bubbles: true,
            cancelable: true,
            detail: { value },
          });
          host.dispatchEvent(ev);
          o.onSave?.(value);
          return true;
        }
        case "escape":
          // Esc closes the menu or the palette first; only then does it fall through (to a dialog around the editor).
          if (slash.isOpen()) {
            slash.close();
            return true;
          }
          return false;
        case "down":
          if (!slash.isOpen()) return false;
          slash.focusFirst();
          return true;
      }
    },
  });

  host.append(file, status);
  ta.before(frame);
  ta.hidden = true;
  ta.tabIndex = -1;
  // A script or the field component that calls focus() on the textarea (to show an error) lands in the editor.
  ta.focus = () => surface?.focus();
  host.dataset.capMd = "ready";
  syncState();

  const api: MarkdownEditorHandle = {
    root: host,
    getValue: () => doc(),
    setValue(value) {
      quiet = true;
      try {
        surface?.setValue(value);
      } finally {
        quiet = false;
      }
    },
    focus(at) {
      if (at) {
        const pos = at === "end" ? doc().length : 0;
        surface?.select(pos, pos);
      }
      surface?.focus();
    },
    update(patch) {
      Object.assign(o, patch);
      tb.build();
      syncState();
    },
    destroy() {
      watch.disconnect();
      for (const fn of cleanups.splice(0).reverse()) fn();
      palette.close(false);
      slash.close();
      uploader.cancel(false);
      uploader.clearError();
      surface?.destroy();
      surface = null;
      frame.remove();
      file.remove();
      status.remove();
      Reflect.deleteProperty(ta, "focus");
      ta.hidden = false;
      ta.removeAttribute("tabindex");
      delete host.dataset.capMd;
      handles.delete(host);
    },
  };
  handles.set(host, api);
  host.dispatchEvent(new CustomEvent("cap-md-ready", { bubbles: true, detail: { handle: api } }));
  return api;
}

const handles = new WeakMap<HTMLElement, MarkdownEditorHandle>();

// The handle of an editor that has finished loading, or undefined while it is still the plain
// textarea (listen for the bubbling `cap-md-ready` event to know when).
export function getMarkdownEditor(host: Element): MarkdownEditorHandle | undefined {
  return host instanceof HTMLElement ? handles.get(host) : undefined;
}

// Upgrades every [data-cap="markdown-editor"] under root not yet upgraded. The textarea is
// the editor until CodeMirror has loaded, and again if it cannot. `options` apply to each one;
// to give editors different options, pass a narrower `root`. Returns a function that undoes it.
export function enhance(
  root: ParentNode = document,
  options: MarkdownEditorOptions = {},
): () => void {
  const undo: Array<() => void> = [];
  for (const host of root.querySelectorAll<HTMLElement>(
    "[data-cap='markdown-editor']:not([data-cap-ready])",
  )) {
    host.dataset.capReady = "";
    let gone = false;
    let mounted: MarkdownEditorHandle | null = null;
    mountMarkdownEditor(host, options).then(
      (h) => {
        if (gone) h.destroy();
        else mounted = h;
      },
      () => {
        // CodeMirror did not load, or the page changed: the textarea stays as the editor.
      },
    );
    undo.push(() => {
      gone = true;
      mounted?.destroy();
      delete host.dataset.capReady;
    });
  }
  return () => {
    for (const fn of undo.splice(0)) fn();
  };
}
