// The date picker (APG Date picker dialog): a calendar in Capsomer's dialog, beside a text
// input that takes a date as 2026-11-14. With no script the input is the whole control: it is
// in the markup, the button is `hidden`, and the server reads the date as typed. Script shows
// the button; the calendar is built the first time it opens. The dialog supplies the modal,
// Tab staying inside, Esc and focus going back to the button.

import { openDialog, uid, wireDialog } from "../dialog/dialog.ts";
import { dateFrom, setValue } from "../field/field.ts";

const DAY = 86_400_000;

// The date in 2026-11-14 (a month or day may be one digit), or null when it is not a real one.
export function parseDate(text: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text.trim());
  return m ? dateFrom(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

// The same day `n` months on, or the month's last day when it has fewer (31 January to 28 February).
export function addMonths(d: Date, n: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
}

// Where a key in the grid moves the focused day (APG's table), or null for a key it ignores.
export function moveDate(d: Date, key: string, shift = false): Date | null {
  const dow = d.getUTCDay();
  switch (key) {
    case "ArrowLeft":
      return new Date(d.getTime() - DAY);
    case "ArrowRight":
      return new Date(d.getTime() + DAY);
    case "ArrowUp":
      return new Date(d.getTime() - 7 * DAY);
    case "ArrowDown":
      return new Date(d.getTime() + 7 * DAY);
    case "Home":
      return new Date(d.getTime() - dow * DAY);
    case "End":
      return new Date(d.getTime() + (6 - dow) * DAY);
    case "PageUp":
      return addMonths(d, shift ? -12 : -1);
    case "PageDown":
      return addMonths(d, shift ? 12 : 1);
    default:
      return null;
  }
}

function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const ICONS = {
  "prev-year": "M9 4L5 8l4 4M13 4L9 8l4 4",
  "prev-month": "M10 4L6 8l4 4",
  "next-month": "M6 4l4 4-4 4",
  "next-year": "M3 4l4 4-4 4M7 4l4 4-4 4",
};
const NAMES = { "prev-year": "Previous year", "prev-month": "Previous month", "next-month": "Next month", "next-year": "Next year" };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function navButton(part: keyof typeof ICONS): HTMLButtonElement {
  const b = el("button", { type: "button", className: "cap-btn" }, { "data-variant": "quiet", "data-icon-only": "", "data-cap-part": part, "aria-label": NAMES[part] });
  b.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${ICONS[part]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return b;
}

// The dialog: the month between its buttons, the grid, Cancel and Choose.
function build(lang: string): { dialog: HTMLDialogElement; heading: HTMLElement; body: HTMLTableSectionElement } {
  const dialog = el("dialog", { className: "cap-dialog cap-date-picker-dialog" }, { "data-size": "sm", "aria-label": "Choose a date" });
  const head = el("div", { className: "cap-dialog-header cap-date-picker-head" });
  const heading = el("h2", { className: "cap-dialog-title", id: uid("cap-date-month") }, { "aria-live": "polite" });
  head.append(navButton("prev-year"), navButton("prev-month"), heading, navButton("next-month"), navButton("next-year"));
  const grid = el("table", { className: "cap-date-picker-grid" }, { role: "grid", "aria-labelledby": heading.id });
  const row = el("tr");
  const long = new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" });
  const short = new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" });
  // 2026-11-01 is a Sunday: the week starts on Sunday.
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(2026, 10, 1 + i));
    row.append(el("th", { scope: "col", abbr: long.format(d), textContent: short.format(d) }));
  }
  const body = el("tbody");
  grid.append(el("thead"), body);
  grid.tHead?.append(row);
  const main = el("div", { className: "cap-dialog-body" });
  main.append(grid);
  const foot = el("div", { className: "cap-dialog-footer" });
  foot.append(
    el("button", { type: "button", className: "cap-btn", textContent: "Cancel" }, { "data-cap-part": "cancel" }),
    el("button", { type: "button", className: "cap-btn", textContent: "Choose" }, { "data-variant": "primary", "data-cap-part": "choose" }),
  );
  dialog.append(head, main, foot);
  return { dialog, heading, body };
}

// Wires one picker: `group` (.cap-date-picker) holds the input and the [data-cap-part="open"]
// button, in an input group; the dialog is added inside it. min and max
// (data-min, data-max on the input, as 2026-11-14) make the days outside them unchoosable.
export function wirePicker(group: HTMLElement): () => void {
  const input = group.querySelector<HTMLInputElement>("input");
  const open = group.querySelector<HTMLButtonElement>("[data-cap-part='open']");
  if (!input || !open) return () => undefined;
  const lang = input.closest("[lang]")?.getAttribute("lang") || "en-US";
  const full = new Intl.DateTimeFormat(lang, { dateStyle: "full", timeZone: "UTC" });
  const monthName = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric", timeZone: "UTC" });
  const min = parseDate(input.dataset.min ?? "");
  const max = parseDate(input.dataset.max ?? "");
  const outside = (d: Date) => (min !== null && d < min) || (max !== null && d > max);
  let parts: ReturnType<typeof build> | null = null;
  let focus = today();

  // The button's name says the date it would change, once there is one (APG).
  const name = () => {
    const d = parseDate(input.value);
    open.setAttribute("aria-label", d ? `Change date, ${full.format(d)}` : "Choose date");
    // A date in the right shape that does not exist (2026-02-31) is wrong, in the input's
    // data-error-date words; the wrong shape is the input's own pattern.
    const shaped = /^\d{4}-\d{1,2}-\d{1,2}$/.test(input.value.trim());
    input.setCustomValidity(shaped && !d ? input.dataset.errorDate || "Enter a real date." : "");
  };

  const render = (moveFocus: boolean) => {
    if (!parts) return;
    const picked = parseDate(input.value);
    const chosen = picked ? isoDate(picked) : "";
    const now = isoDate(today());
    const first = new Date(Date.UTC(focus.getUTCFullYear(), focus.getUTCMonth(), 1));
    const label = monthName.format(first);
    if (parts.heading.textContent !== label) parts.heading.textContent = label;
    const rows: HTMLTableRowElement[] = [];
    for (let w = 0; w < 6; w++) {
      const tr = el("tr");
      for (let i = 0; i < 7; i++) {
        const d = new Date(first.getTime() + (w * 7 + i - first.getUTCDay()) * DAY);
        const td = el("td");
        if (d.getUTCMonth() === first.getUTCMonth()) {
          const iso = isoDate(d);
          td.textContent = String(d.getUTCDate());
          td.dataset.date = iso;
          td.tabIndex = iso === isoDate(focus) ? 0 : -1;
          if (iso === chosen) td.setAttribute("aria-selected", "true");
          if (iso === now) td.setAttribute("aria-current", "date");
          if (outside(d)) td.setAttribute("aria-disabled", "true");
        }
        tr.append(td);
      }
      // A sixth row of empty days is left out.
      if (w < 5 || tr.querySelector("[data-date]")) rows.push(tr);
    }
    parts.body.replaceChildren(...rows);
    if (moveFocus) parts.body.querySelector<HTMLElement>("[tabindex='0']")?.focus();
  };

  const choose = (d: Date) => {
    if (outside(d) || !parts) return;
    setValue(input, isoDate(d));
    parts.dialog.close("choose");
  };

  const onGridKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      return choose(focus);
    }
    const next = moveDate(focus, e.key, e.shiftKey);
    if (!next) return;
    e.preventDefault();
    focus = next;
    render(true);
  };
  const onDialogClick = (e: MouseEvent) => {
    const t = e.target as Element;
    const cell = t.closest<HTMLElement>("td[data-date]");
    if (cell) return choose(parseDate(cell.dataset.date ?? "") ?? focus);
    const part = t.closest<HTMLElement>("[data-cap-part]")?.dataset.capPart;
    if (part === "choose") return choose(focus);
    const by = ({ "prev-year": -12, "prev-month": -1, "next-month": 1, "next-year": 12 } as Record<string, number>)[part ?? ""];
    if (by === undefined) return;
    // The heading changes and is said (aria-live); focus stays on the button (APG).
    focus = addMonths(focus, by);
    render(false);
  };

  const onOpen = () => {
    if (!parts) {
      parts = build(lang);
      group.append(parts.dialog);
      parts.dialog.addEventListener("click", onDialogClick);
      parts.body.addEventListener("keydown", onGridKey);
      wireDialog(parts.dialog);
    }
    const d = parseDate(input.value);
    focus = d ?? (min && today() < min ? min : max && today() > max ? max : today());
    render(false);
    openDialog(parts.dialog, open, { focus: parts.body.querySelector<HTMLElement>("[tabindex='0']") });
  };

  open.hidden = false;
  name();
  open.addEventListener("click", onOpen);
  input.addEventListener("input", name);
  return () => {
    open.removeEventListener("click", onOpen);
    input.removeEventListener("input", name);
    parts?.dialog.remove();
  };
}

// Wires every [data-cap="date-picker"] under root not yet wired. Returns a function that
// detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>("[data-cap='date-picker']:not([data-cap-ready])")) {
    group.dataset.capReady = "";
    const off = wirePicker(group);
    undo.push(() => {
      off();
      delete group.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
