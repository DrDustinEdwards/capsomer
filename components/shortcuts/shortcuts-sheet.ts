// The shortcut sheet: the "?" dialog listing every registered shortcut, with the single-key switch.
// In its own module so a page loads it only when the sheet is first asked for (shortcuts.ts).
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import { uid } from "../hooks/hooks.ts";
import {
  SINGLE_KEYS_NOTE,
  fire,
  grouped,
  isImeEnter,
  keysFragment,
  modifiedShortcutFor,
  setSingleKeys,
  singleKeysOn,
} from "./shortcuts.ts";

// Fills a sheet's list from the registry: one group heading and one description list each.
export function renderSheetList(container: HTMLElement): void {
  container.replaceChildren();
  for (const g of grouped()) {
    const wrap = document.createElement("div");
    wrap.className = "cap-keys-group";
    const h = document.createElement("h3");
    h.className = "cap-keys-group-title";
    h.textContent = g.group;
    const dl = document.createElement("dl");
    dl.className = "cap-keys-list";
    for (const s of g.items) {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      dt.append(keysFragment(s.key));
      const dd = document.createElement("dd");
      dd.textContent = s.label;
      if (s.about) {
        const about = document.createElement("span");
        about.className = "cap-keys-about";
        about.textContent = s.about;
        dd.append(about);
      }
      row.append(dt, dd);
      dl.append(row);
    }
    wrap.append(h, dl);
    container.append(wrap);
  }
}

function syncSwitch(sheet: HTMLElement): void {
  const box = sheet.querySelector<HTMLInputElement>("[data-cap-part='single-keys']");
  if (!box) return;
  const on = singleKeysOn();
  box.checked = on;
  const word = box.closest(".cap-switch")?.querySelector(".cap-switch-state");
  if (word) word.textContent = on ? "On" : "Off";
}

// Builds the sheet's markup, exactly the contract on the doc page: the shared dialog with a
// header, the list as its body, the switch in its footer, and the corner Close button.
export function buildSheet(): HTMLDialogElement {
  const id = uid("cap-keys");
  const d = document.createElement("dialog");
  d.className = "cap-dialog cap-keys";
  d.dataset.cap = "shortcuts";
  d.dataset.placement = "center";
  d.dataset.size = "md";
  d.setAttribute("aria-labelledby", `${id}-title`);

  const head = document.createElement("div");
  head.className = "cap-dialog-header";
  head.dataset.divider = "";
  const h = document.createElement("h2");
  h.className = "cap-dialog-title";
  h.id = `${id}-title`;
  h.textContent = "Keyboard shortcuts";
  head.append(h);

  const body = document.createElement("div");
  body.className = "cap-dialog-body cap-keys-body";
  body.dataset.capPart = "keys-list";

  const footer = document.createElement("div");
  footer.className = "cap-dialog-footer";
  footer.dataset.align = "start";
  const foot = document.createElement("div");
  foot.className = "cap-keys-foot";
  const label = document.createElement("label");
  label.className = "cap-switch";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.setAttribute("role", "switch");
  box.dataset.capPart = "single-keys";
  box.setAttribute("aria-describedby", `${id}-note`);
  const name = document.createElement("span");
  name.textContent = "Single-key shortcuts";
  const state = document.createElement("span");
  state.className = "cap-switch-state";
  state.setAttribute("aria-hidden", "true");
  label.append(box, name, state);
  const note = document.createElement("p");
  note.className = "cap-keys-note";
  note.id = `${id}-note`;
  note.textContent = SINGLE_KEYS_NOTE;
  foot.append(label, note);
  footer.append(foot);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "cap-btn cap-dialog-close";
  close.dataset.variant = "quiet";
  close.dataset.iconOnly = "";
  close.dataset.capPart = "close";
  close.setAttribute("aria-label", "Close");
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", "M4 4l8 8M12 4l-8 8");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("stroke-linecap", "round");
  svg.append(path);
  close.append(svg);

  d.append(head, body, footer, close);
  return d;
}

// Wires one sheet: the shared dialog's rules (Close, the backdrop, Esc, focus returned on
// close), its list, the switch, and the Ctrl or Cmd shortcuts that still work over it. Returns
// a function that unwires it.
export function wireSheet(sheet: HTMLDialogElement): () => void {
  const unwireBase = wireDialog(sheet);
  const box = sheet.querySelector<HTMLInputElement>("[data-cap-part='single-keys']");
  const onChange = () => {
    if (box) setSingleKeys(box.checked);
  };
  const onSingle = () => syncSwitch(sheet);
  // A shortcut with Ctrl or Cmd still works over the sheet: the sheet closes, then it runs.
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing || isImeEnter(e)) return;
    const hit = modifiedShortcutFor(e);
    if (!hit) return;
    sheet.close();
    fire(hit, e);
  };
  box?.addEventListener("change", onChange);
  document.addEventListener("cap-single-keys", onSingle);
  sheet.addEventListener("keydown", onKey);
  syncSwitch(sheet);
  return () => {
    box?.removeEventListener("change", onChange);
    document.removeEventListener("cap-single-keys", onSingle);
    sheet.removeEventListener("keydown", onKey);
    unwireBase();
  };
}

// Opens the sheet: the one in the page's markup, or one built on first use.
export function openShortcutSheet(
  opener: Element | null = document.activeElement,
): HTMLDialogElement {
  let sheet = document.querySelector<HTMLDialogElement>("dialog.cap-keys[data-cap='shortcuts']");
  if (!sheet) {
    sheet = buildSheet();
    document.body.append(sheet);
  }
  if (!sheet.dataset.capReady) wireSheet(sheet);
  const list = sheet.querySelector<HTMLElement>("[data-cap-part='keys-list']");
  if (list) renderSheetList(list);
  syncSwitch(sheet);
  // Focus starts on Close, so Esc and Enter are one key from leaving and nothing is changed by
  // arriving.
  if (!sheet.open)
    openDialog(sheet, opener, {
      focus: sheet.querySelector<HTMLElement>("[data-cap-part='close']"),
    });
  return sheet;
}
