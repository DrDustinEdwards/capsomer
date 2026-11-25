// The markdown editor's image prompt. The person describes the image before it leaves the
// browser (ATAG 2.0 B.2.3: the authoring tool prompts for the text alternative; the server
// refuses an undescribed upload anyway), so the file is sent once, with its alt text or its
// decorative choice, and nothing is uploaded for an image they cancel.
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { type EditorContext, el } from "./markdown-editor-dom.ts";
import { blockEdit, defaultImageMarkdown } from "./markdown-editor-edits.ts";

function messageOf(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "The image did not upload. Try again.";
}

export function createUploader(c: EditorContext) {
  const { o, host, uid } = c;
  let upload: {
    token: number;
    panel: HTMLElement;
    abort: AbortController | null;
  } | null = null;
  let uploadToken = 0;

  function clearError() {
    host.querySelector(".cap-md-upload-error")?.remove();
  }

  function cancel(restoreFocus: boolean) {
    if (!upload) return;
    const { panel, abort } = upload;
    upload = null;
    uploadToken++;
    abort?.abort();
    panel.remove();
    if (restoreFocus) c.surface()?.focus();
  }

  function start(f: File): void {
    if (!o.onUpload || !c.surface()) return;
    cancel(false);
    clearError();
    const token = ++uploadToken;
    const panel = el("div", {
      class: "cap-md-upload",
      role: "group",
      "aria-label": "Describe the image",
    });
    upload = { token, panel, abort: null };
    c.frame.after(panel);
    showDescribeStep(panel, f, token);
  }

  function showDescribeStep(panel: HTMLElement, f: File, token: number) {
    const name = f.name;
    const alt = el("input", {
      type: "text",
      class: "cap-input",
      id: `${uid}-alt`,
      autocomplete: "off",
      placeholder: "What the image shows",
      "aria-describedby": `${uid}-alt-help`,
    });
    // A data: URL, not blob:, so the preview needs nothing a site's img-src does not already allow.
    const thumb = el("img", { class: "cap-md-upload-thumb", alt: "" });
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") thumb.src = reader.result;
    });
    reader.readAsDataURL(f);
    const help = el(
      "p",
      { class: "cap-field-help", id: `${uid}-alt-help` },
      `Describe ${name}, or insert it as decorative.`,
    );
    const wait = el("p", { class: "cap-md-upload-wait", hidden: "" }, `Uploading ${name}`);
    const insert = el(
      "button",
      { type: "button", class: "cap-btn", "data-variant": "primary" },
      "Insert image",
    );
    insert.disabled = true;
    const decorative = el("button", { type: "button", class: "cap-btn" }, "Insert as decorative");
    const cancelButton = el(
      "button",
      { type: "button", class: "cap-btn", "data-variant": "quiet" },
      "Cancel",
    );
    const fields = el(
      "div",
      { class: "cap-md-upload-fields" },
      el(
        "label",
        { class: "cap-field-label", for: alt.id },
        "Alt text ",
        el("span", { class: "cap-field-required", "aria-hidden": "true" }, "Required"),
      ),
      alt,
      help,
      wait,
      el("div", { class: "cap-md-upload-actions" }, insert, decorative, cancelButton),
    );
    panel.replaceChildren(thumb, fields);
    const busy = (on: boolean) => {
      if (on) panel.setAttribute("aria-busy", "true");
      else panel.removeAttribute("aria-busy");
      wait.hidden = !on;
      alt.readOnly = on;
      insert.disabled = on || alt.value.trim() === "";
      decorative.disabled = on;
    };
    const go = async (isDecorative: boolean) => {
      const send = o.onUpload;
      const text = isDecorative ? "" : alt.value.trim();
      if (
        !send ||
        !c.surface() ||
        !upload ||
        upload.token !== token ||
        panel.hasAttribute("aria-busy")
      )
        return;
      if (!isDecorative && !text) return;
      panel.querySelector(".cap-md-upload-error")?.remove();
      const abort = new AbortController();
      upload.abort = abort;
      busy(true);
      c.say(`Uploading ${name}`);
      try {
        const result = await send(f, { alt: text, decorative: isDecorative }, abort.signal);
        if (!upload || upload.token !== token) return;
        const md = (o.imageMarkdown ?? defaultImageMarkdown)({
          url: result.url,
          alt: text,
          decorative: isDecorative,
          name,
        });
        cancel(false);
        c.apply(blockEdit(c.doc(), c.sel().from, c.sel().to, md));
        c.say("Image added to the text.");
      } catch (e) {
        if (!upload || upload.token !== token) return;
        upload.abort = null;
        busy(false);
        // The step stays, with what was typed, so a retry is one press.
        fields.append(
          el("p", { class: "cap-field-error cap-md-upload-error", role: "alert" }, messageOf(e)),
        );
        c.say("");
        (isDecorative ? decorative : insert.disabled ? alt : insert).focus();
      }
    };
    alt.addEventListener("input", () => {
      insert.disabled = alt.value.trim() === "" || panel.hasAttribute("aria-busy");
    });
    alt.addEventListener("keydown", (e) => {
      // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
      if (e.key === "Enter" && !isImeEnter(e)) {
        e.preventDefault();
        void go(false);
      }
    });
    insert.addEventListener("click", () => void go(false));
    decorative.addEventListener("click", () => void go(true));
    cancelButton.addEventListener("click", () => cancel(true));
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancel(true);
      }
    });
    // Focus goes to the alt field: the image cannot go in until it is answered.
    alt.focus();
    c.say(`Describe ${name} to add it to the text.`);
  }

  return { start, cancel, clearError };
}
