// The media library's inspector as a behavior: it opens beside the grid (a pane) or over it (a side
// sheet), fills from the tile it shows, saves by itself and never loses typed text, takes tags and
// the copy buttons, and answers its own keys. The controller owns the tiles and says which one is
// active; this owns what the inspector shows and does.

import { COPIED_MS, COPY_FAILED_MS, copyText } from "../copy/copy.ts";
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import { fail } from "../message/message.ts";
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { glyphEl } from "../status/status.ts";
import { createAutosave, type Autosave, type SaveState } from "./media-autosave.ts";
import { chipsGroup } from "./media-filter.ts";
import type { Direction } from "./media-grid.ts";
import { fillInspector, readFields, renderSave, renderTags } from "./media-inspector.ts";
import type { MediaOptions } from "./media-bulk.ts";
import { altStateOf, parseTags, type MediaFields } from "./media-record.ts";
import { part, recordOf, syncTile, writeRecord } from "./media-tile.ts";

export interface PanelHost {
  root: HTMLElement;
  inspector: HTMLDialogElement;
  options: Pick<MediaOptions, "save">;
  listen: (el: HTMLElement, type: string, fn: (e: never) => void) => void;
  modeOf: () => "pane" | "sheet";
  active: () => HTMLElement | null;
  setActive: (t: HTMLElement | null) => void;
  focusTile: (t: HTMLElement | null) => void;
  move: (from: HTMLElement, dir: Direction) => HTMLElement | null;
  openLink: (t: HTMLElement | null) => HTMLElement | null;
  syncRoving: () => void;
  // The saved fields were applied to the tile: redraw what reads them.
  saved: () => void;
  bin: (keys: string[]) => unknown;
  restore: (keys: string[]) => unknown;
}

export function createPanel(host: PanelHost) {
  const { root, inspector, options } = host;
  let current: HTMLElement | null = null;
  let session = 0;
  const drafts = new Map<string, MediaFields>();
  let autosave: Autosave | null = null;
  let unwire: (() => void) | null = null;
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;
  let observer: ResizeObserver | null = null;
  const ins = <T extends HTMLElement = HTMLElement>(name: string) => part<T>(inspector, name);
  const draw = (state: SaveState, error?: string) => renderSave(inspector, state, error);
  const keyOf = () => current?.dataset.key ?? "";

  const defaultSave = async (key: string): Promise<void> => {
    const form = ins<HTMLFormElement>("form");
    if (!form) return;
    const body = new FormData(form);
    body.set("key", key);
    const res = await fetch(form.getAttribute("action") || location.href, {
      method: (form.getAttribute("method") || "post").toUpperCase(),
      body,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`The server answered ${res.status}.`);
  };

  // Applies saved fields to the tile, so the grid, the filters and the next open read them.
  const applySaved = (tile: HTMLElement, f: MediaFields) => {
    writeRecord(tile, {
      altState: altStateOf(f.alt, f.decorative),
      alt: f.alt,
      title: f.title,
      caption: f.caption,
      tags: f.tags,
    });
    syncTile(tile);
    host.saved();
  };

  const startSession = (tile: HTMLElement | null) => {
    session += 1;
    const mine = session;
    autosave?.cancel();
    current = tile;
    autosave = tile
      ? createAutosave({
          save: () => {
            // Read now: this runs the moment a save starts, before anything else can change the fields.
            const fields = readFields(inspector);
            const key = tile.dataset.key ?? "";
            const send = options.save ?? defaultSave;
            return send(key, fields).then(
              () => {
                drafts.delete(key);
                applySaved(tile, fields);
              },
              (err: unknown) => {
                drafts.set(key, fields);
                throw err;
              },
            );
          },
          onState: (s, err) => {
            if (mine === session) draw(s, err);
            else if (s === "failed")
              fail(
                `Could not save the changes to ${tile.dataset.label ?? "a file"}: ${err ?? "nothing says why"}. Open it again to retry.`,
              );
          },
        })
      : null;
  };

  // Writes a record into the inspector's fields and lists. Idempotent: the server's own markup
  // for the first file is what this would write.
  const fill = (tile: HTMLElement) => {
    const r = recordOf(tile);
    startSession(tile);
    fillInspector(inspector, r, drafts.get(r.key));
    host.syncRoving();
  };
  const closePending = () => void autosave?.flush();
  const show = (tile: HTMLElement) => {
    closePending();
    fill(tile);
  };

  const setTags = (tags: string[]) => {
    renderTags(inspector, tags, (current ? recordOf(current) : null)?.suggestedTags ?? []);
    autosave?.schedule();
    void autosave?.flush();
  };
  const haveTags = () => parseTags(ins<HTMLInputElement>("tags-value")?.value ?? "");
  const addTagFrom = (input: HTMLInputElement) => {
    const add = parseTags(input.value);
    input.value = "";
    if (add.length === 0) return;
    const have = haveTags();
    setTags([...have, ...add.filter((t) => !have.includes(t))]);
  };

  const firstField = () => {
    const alt = ins<HTMLTextAreaElement>("alt");
    if (alt && !alt.disabled && !alt.closest("[hidden]")) return alt;
    return ins<HTMLInputElement>("decorative") ?? ins<HTMLInputElement>("title-field");
  };
  const showPane = () => {
    if (!inspector.open) inspector.show();
  };

  const open = (tile: HTMLElement, o: { focus: boolean }) => {
    host.setActive(tile);
    if (current !== tile) show(tile);
    const link = host.openLink(tile);
    if (host.modeOf() === "pane") {
      if (inspector.matches(":modal")) inspector.close();
      showPane();
      host.syncRoving();
      if (o.focus) firstField()?.focus();
    } else if (!inspector.open || !inspector.matches(":modal")) {
      if (inspector.open) inspector.close();
      unwire?.();
      unwire = wireDialog(inspector, { returnTo: link });
      openDialog(inspector, link, { focus: firstField() });
      host.syncRoving();
    }
  };
  const close = (o: { focus: boolean } = { focus: true }) => {
    closePending();
    const was = inspector.open;
    if (was) inspector.close();
    host.syncRoving();
    if (was && o.focus) host.focusTile(host.active());
  };

  const copyFrom = async (btn: HTMLElement) => {
    const value = btn.dataset.capCopy || ins<HTMLInputElement>("address")?.value || "";
    const what = btn.getAttribute("aria-label")?.replace(/^Copy (the )?/, "") || "address";
    const status = ins("copied");
    if (copiedTimer) clearTimeout(copiedTimer);
    // Emptied first, so a second copy of the same thing is announced again.
    status?.replaceChildren();
    await Promise.resolve();
    const ok = await copyText(value);
    if (status) {
      if (ok) status.replaceChildren(glyphEl("ok"), document.createTextNode(`Copied the ${what}.`));
      else {
        status.replaceChildren(
          glyphEl("crit"),
          "Could not copy. The address is selected: press Ctrl+C or Cmd+C.",
        );
        ins<HTMLInputElement>("address")?.select();
      }
      copiedTimer = setTimeout(() => status.replaceChildren(), ok ? COPIED_MS : COPY_FAILED_MS);
    }
  };

  host.listen(inspector, "change", (e: Event) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.dataset.capPart !== "decorative") return;
    const alt = ins<HTMLTextAreaElement>("alt");
    if (alt) {
      if (t.checked) {
        alt.dataset.prev = alt.value;
        alt.value = "";
        alt.disabled = true;
      } else {
        alt.disabled = false;
        alt.value = alt.dataset.prev ?? "";
      }
    }
    autosave?.schedule();
    void autosave?.flush();
  });

  host.listen(inspector, "input", (e: Event) => {
    const p = e.target instanceof HTMLElement ? e.target.dataset.capPart : "";
    if (p === "alt" || p === "title-field" || p === "caption") autosave?.schedule();
  });

  host.listen(inspector, "focusout", (e: FocusEvent) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    // A field that loses focus saves what was typed in it; a tag typed and left is added.
    if (t.dataset.capPart === "tag-input") {
      if ((t as HTMLInputElement).value.trim()) addTagFrom(t as HTMLInputElement);
    } else if (/^(INPUT|TEXTAREA)$/.test(t.tagName)) void autosave?.flush();
  });

  host.listen(inspector, "click", (e: MouseEvent) => {
    const btn = e.target instanceof Element ? e.target.closest<HTMLElement>("button") : null;
    if (!btn) return;
    const p = btn.dataset.capPart;
    if (p === "close") close();
    else if (p === "bin" && current) void host.bin([keyOf()]);
    else if (p === "restore" && current) void host.restore([keyOf()]);
    else if (p === "retry-save") void autosave?.retry();
    else if (p === "show-unattached") {
      const chip = chipsGroup(root)?.querySelector<HTMLElement>(
        ".cap-chip[data-value='unattached']",
      );
      if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      if (chip) chip.focus();
    } else if (btn.dataset.capTag !== undefined) {
      setTags(haveTags().filter((x) => x !== btn.dataset.capTag));
      ins("tag-input")?.focus();
    } else if (btn.dataset.capSuggest !== undefined) {
      setTags([...haveTags(), btn.dataset.capSuggest]);
      ins("tag-input")?.focus();
    } else if (btn.dataset.capCopy !== undefined) {
      void copyFrom(btn);
    }
  });

  // Enter in the tag field adds a tag; Esc goes back to the grid (a sheet closes by itself); Alt and an
  // arrow move to the next file without leaving the field.
  host.listen(inspector, "keydown", (e: KeyboardEvent) => {
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (!t || e.defaultPrevented || e.isComposing || isImeEnter(e)) return;
    if (t.dataset.capPart === "tag-input" && (e.key === "Enter" || e.key === ",")) {
      e.preventDefault();
      addTagFrom(t as HTMLInputElement);
      return;
    }
    if (e.altKey && !e.ctrlKey && !e.metaKey && current) {
      const dir: Direction | null =
        e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? "prev"
          : e.key === "ArrowRight" || e.key === "ArrowDown"
            ? "next"
            : null;
      if (dir) {
        e.preventDefault();
        const next = host.move(current, dir);
        if (next && next.dataset.state !== "uploading" && next.dataset.state !== "failed") {
          closePending();
          host.setActive(next);
          fill(next);
          next.scrollIntoView({ block: "nearest" });
        }
        return;
      }
    }
    if (e.key === "Escape" && inspector.open && !inspector.matches(":modal")) {
      e.preventDefault();
      closePending();
      host.focusTile(host.active());
    }
  });

  host.listen(inspector, "close", () => {
    unwire?.();
    unwire = null;
    host.syncRoving();
  });
  // The form's own Save button is for a page with no script; with script the pane saves itself.
  host.listen(inspector, "submit", (e: Event) => {
    e.preventDefault();
    void autosave?.flush();
  });

  let lastMode = host.modeOf();
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      const m = host.modeOf();
      if (m === lastMode) return;
      lastMode = m;
      if (!inspector.open) return;
      if (m === "pane") {
        if (inspector.matches(":modal")) {
          inspector.close();
          showPane();
        }
      } else if (!inspector.matches(":modal")) {
        closePending();
        inspector.close();
      }
      host.syncRoving();
    });
    observer.observe(root);
  }

  return {
    open,
    close,
    show,
    current: () => current,
    // The inspector follows the tile that has focus; focus stays where it is.
    follow: (tile: HTMLElement) => {
      if (
        inspector.open &&
        !inspector.matches(":modal") &&
        current !== tile &&
        tile.dataset.state !== "uploading" &&
        tile.dataset.state !== "failed"
      )
        show(tile);
    },
    // The server rendered the inspector for this tile: start its session without rewriting it.
    adopt: (tile: HTMLElement) => {
      startSession(tile);
      draw("idle");
    },
    detach: () => {
      observer?.disconnect();
      unwire?.();
    },
  };
}
