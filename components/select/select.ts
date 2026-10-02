// The select's behaviour: a real <select class="cap-select"> stays in the page (its options
// are the HTML, it submits with the form, it works with no script); this module hides it and
// puts a button (role="combobox") and a popup in its place, built from the shared listbox
// (options, groups, check, typeahead, keyboard) and the shared popover (surface, placement,
// open and close, focus return). Choosing writes the value back to the native select and
// fires `input` and `change` on it, so a form, the field's checks and an app's own handlers
// see what they always saw.
//
// Markup: <div class="cap-select-wrap" data-cap="select"><select class="cap-select">...</select></div>.
// Add `data-native` to the wrapper to keep the browser's own select (a phone, say).

import { createListbox, nextTypeahead, type Listbox, type TypeaheadState, TYPEAHEAD_MS } from "../listbox/listbox.ts";
import { attach, close } from "../popover/popover.ts";

const SVG = "http://www.w3.org/2000/svg";
let serial = 0;

export interface SelectItem {
  kind: "option";
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
}
export interface SelectGroup {
  kind: "group";
  label: string;
  disabled: boolean;
  items: SelectItem[];
}

// The native select's options and groups as plain data (the popup is built from it).
export function readOptions(select: HTMLSelectElement): Array<SelectItem | SelectGroup> {
  const item = (o: HTMLOptionElement): SelectItem => ({ kind: "option", value: o.value, label: (o.label || o.textContent || "").trim(), disabled: o.matches(":disabled"), selected: o.selected });
  const out: Array<SelectItem | SelectGroup> = [];
  for (const child of Array.from(select.children)) {
    if (child instanceof HTMLOptGroupElement) {
      out.push({ kind: "group", label: child.label, disabled: child.disabled, items: Array.from(child.querySelectorAll("option")).filter((o) => !o.hidden).map(item) });
    } else if (child instanceof HTMLOptionElement && !child.hidden) out.push(item(child));
  }
  return out;
}

// The words the trigger shows: the chosen option's label, or the placeholder (the empty
// option's label) when the value is empty.
export function triggerText(select: HTMLSelectElement): { text: string; placeholder: boolean } {
  const o = select.selectedOptions[0];
  if (!o) return { text: "", placeholder: true };
  return { text: (o.label || o.textContent || "").trim(), placeholder: o.value === "" };
}

function chevron(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("cap-select-icon");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", "M4 6l4 4 4-4");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

function check(): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "cap-option-indicator";
  span.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", "M3.5 8.5l3 3 6-6.5");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.75");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  span.append(svg);
  return span;
}

export interface SelectControl {
  readonly select: HTMLSelectElement;
  readonly trigger: HTMLButtonElement;
  readonly popup: HTMLElement;
  // Re-reads the native select (its value, its options, disabled) into the trigger and the popup.
  sync(): void;
  open(): void;
  close(): void;
  detach(): void;
}

const controls = new WeakMap<HTMLSelectElement, SelectControl>();

export function selectControlFor(select: Element | null): SelectControl | undefined {
  return select instanceof HTMLSelectElement ? controls.get(select) : undefined;
}

// Builds the trigger and the popup for one native select and wires them.
export function createSelect(wrap: HTMLElement, select: HTMLSelectElement): SelectControl {
  const n = ++serial;
  const nativeId = select.id;
  const label = (nativeId ? document.querySelector<HTMLElement>(`label[for="${CSS.escape(nativeId)}"]`) : null) ?? select.closest("label");
  const triggerId = nativeId || `cap-select-${n}`;
  const popupId = `${triggerId}-popup`;
  const listId = `${triggerId}-list`;

  // The trigger takes the select's id, so its label (for="...") points at it.
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cap-select-trigger";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", listId);
  trigger.id = triggerId;
  if (select.dataset.size) trigger.dataset.size = select.dataset.size;
  // The specimen hook for a forced hover carries over.
  if (select.dataset.force) trigger.dataset.force = select.dataset.force;
  if (label) {
    if (!label.id) label.id = `${triggerId}-label`;
    trigger.setAttribute("aria-labelledby", label.id);
  } else if (select.getAttribute("aria-label")) trigger.setAttribute("aria-label", select.getAttribute("aria-label") as string);
  else if (select.getAttribute("aria-labelledby")) trigger.setAttribute("aria-labelledby", select.getAttribute("aria-labelledby") as string);
  const value = document.createElement("span");
  value.className = "cap-select-value";
  trigger.append(value, chevron());

  const popup = document.createElement("div");
  popup.className = "cap-popover cap-select-popup";
  popup.id = popupId;
  popup.setAttribute("popover", "auto");
  popup.setAttribute("role", "presentation");
  popup.dataset.size = "auto";
  popup.dataset.flush = "";
  popup.dataset.side = "bottom";
  popup.dataset.align = "start";
  const list = document.createElement("div");
  list.className = "cap-listbox";
  list.id = listId;
  list.setAttribute("role", "listbox");
  if (label) list.setAttribute("aria-labelledby", label.id);
  else if (trigger.getAttribute("aria-label")) list.setAttribute("aria-label", trigger.getAttribute("aria-label") as string);
  popup.append(list);

  // The native select steps aside: out of the page, the tab order and the tree.
  select.id = `${triggerId}-native`;
  select.hidden = true;
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  wrap.dataset.enhanced = "";
  select.after(trigger, popup);
  // A check that wants to focus the select (the field's first-error focus) lands on the trigger.
  select.focus = (o?: FocusOptions) => trigger.focus(o);

  let lb: Listbox | null = null;

  const buildList = () => {
    lb?.detach();
    list.replaceChildren();
    let k = 0;
    const optionEl = (it: SelectItem): HTMLElement => {
      const el = document.createElement("div");
      el.className = "cap-option";
      el.id = `${listId}-${++k}`;
      el.setAttribute("role", "option");
      el.dataset.value = it.value;
      el.setAttribute("aria-selected", String(it.selected));
      if (it.disabled) el.setAttribute("aria-disabled", "true");
      const text = document.createElement("span");
      text.className = "cap-option-label";
      text.textContent = it.label;
      el.append(text, check());
      return el;
    };
    for (const entry of readOptions(select)) {
      if (entry.kind === "option") list.append(optionEl(entry));
      else {
        const g = document.createElement("div");
        g.className = "cap-listbox-group";
        g.setAttribute("role", "group");
        const gl = document.createElement("div");
        gl.className = "cap-listbox-label";
        gl.id = `${listId}-g${++k}`;
        gl.setAttribute("role", "presentation");
        gl.textContent = entry.label;
        g.setAttribute("aria-labelledby", gl.id);
        g.append(gl, ...entry.items.map((i) => optionEl(i)));
        list.append(g);
      }
    }
    delete list.dataset.capReady;
    lb = createListbox(list, { mode: "descendant", selection: "single", hideWhenEmpty: false });
  };

  const sync = () => {
    const t = triggerText(select);
    value.textContent = t.text;
    if (t.placeholder) trigger.dataset.placeholder = "";
    else delete trigger.dataset.placeholder;
    trigger.disabled = select.disabled;
    if (select.required) trigger.setAttribute("aria-required", "true");
    else trigger.removeAttribute("aria-required");
    for (const a of ["aria-invalid", "aria-describedby"]) {
      const v = select.getAttribute(a);
      if (v === null) trigger.removeAttribute(a);
      else trigger.setAttribute(a, v);
    }
    lb?.setValue(select.value);
  };
  const rebuild = () => {
    buildList();
    sync();
  };

  // Choosing: write the value back and tell the world what a native select would.
  const choose = (v: string) => {
    if (select.value !== v) {
      select.value = v;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    sync();
  };
  const onSelect = (e: Event) => {
    const d = (e as CustomEvent<{ value: string }>).detail;
    choose(d.value);
    close(popup);
  };
  list.addEventListener("cap:option-select", onSelect);

  const detachPopover = attach(trigger, popup);
  // attach() names the popup a generic popup; this one is a listbox.
  trigger.setAttribute("aria-haspopup", "listbox");

  // Open: the popup is as wide as the trigger at least, the chosen option is current and in view.
  const onBefore = (e: Event) => {
    if ((e as ToggleEvent).newState !== "open") return;
    popup.style.setProperty("--cap-select-min", `${Math.ceil(trigger.getBoundingClientRect().width)}px`);
  };
  const onToggle = (e: Event) => {
    if ((e as ToggleEvent).newState !== "open") return;
    const selected = list.querySelector<HTMLElement>("[role='option'][aria-selected='true']:not([aria-disabled='true'])");
    const first = list.querySelector<HTMLElement>("[role='option']:not([aria-disabled='true'])");
    lb?.setActive(selected ?? first);
    list.focus({ preventScroll: true });
  };
  popup.addEventListener("beforetoggle", onBefore);
  popup.addEventListener("toggle", onToggle);

  // Closed: arrows open the list; letters choose the matching option without opening (a
  // native select's own typeahead).
  let typed: TypeaheadState = { buffer: "", at: 0 };
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || trigger.disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      popup.showPopover();
    } else if (e.key.length === 1 && (e.key !== " " || (typed.buffer !== "" && Date.now() - typed.at <= TYPEAHEAD_MS))) {
      const items = readOptions(select).flatMap((x) => (x.kind === "option" ? [x] : x.items));
      const current = items.findIndex((i) => i.selected);
      const r = nextTypeahead(typed, e.key, Date.now(), items.map((i) => (i.disabled ? null : i.label)), current);
      typed = r.state;
      e.preventDefault();
      const hit = items[r.index];
      if (hit) choose(hit.value);
    }
  };
  trigger.addEventListener("keydown", onKey);

  // Keep the trigger true when the app or the form changes the select.
  const onChange = () => sync();
  select.addEventListener("change", onChange);
  const form = select.form;
  const onReset = () => setTimeout(sync, 0);
  form?.addEventListener("reset", onReset);
  // The select's own attributes only re-read the trigger; a change to its options or groups
  // rebuilds the list.
  const mo = new MutationObserver((records) => {
    if (records.every((r) => r.target === select && r.type === "attributes")) sync();
    else rebuild();
  });
  mo.observe(select, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled", "required", "aria-invalid", "aria-describedby", "label", "hidden", "selected"] });

  rebuild();

  const control: SelectControl = {
    select,
    trigger,
    popup,
    sync,
    open: () => popup.showPopover(),
    close: () => close(popup),
    detach() {
      mo.disconnect();
      lb?.detach();
      detachPopover();
      list.removeEventListener("cap:option-select", onSelect);
      popup.removeEventListener("beforetoggle", onBefore);
      popup.removeEventListener("toggle", onToggle);
      trigger.removeEventListener("keydown", onKey);
      select.removeEventListener("change", onChange);
      form?.removeEventListener("reset", onReset);
      delete (select as { focus?: unknown }).focus;
      trigger.remove();
      popup.remove();
      select.hidden = false;
      select.removeAttribute("aria-hidden");
      select.removeAttribute("tabindex");
      select.id = nativeId;
      delete wrap.dataset.enhanced;
      delete wrap.dataset.capReady;
      controls.delete(select);
    },
  };
  controls.set(select, control);
  return control;
}

// Attaches to every [data-cap="select"] under root not yet attached (and not data-native).
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const wrap of root.querySelectorAll<HTMLElement>("[data-cap='select']:not([data-cap-ready])")) {
    const select = wrap.querySelector<HTMLSelectElement>("select.cap-select");
    if (!select || wrap.dataset.native !== undefined || typeof HTMLElement.prototype.showPopover !== "function") continue;
    wrap.dataset.capReady = "";
    undo.push(createSelect(wrap, select).detach);
  }
  return () => undo.forEach((f) => f());
}
