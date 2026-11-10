// The chart's downloads in one menu. Enarratio's figure has a "Download CSV" link in its source
// line, and its enhancement layer adds "Download SVG", "Download PNG", "Download tactile SVG" and
// "Copy embed" beside it: five actions in a row of text under every chart (Carrel Desk redesign,
// approved 2026-11-10: "chart downloads move into the chart's menu"). Once the layer has added
// them, this moves the CSV link and those buttons into a Download menu in the same place: Capsomer's
// form menu (`details.cap-menu-form`, capsomer/menu.css), so its keys are the menu's and it is a
// native disclosure even where menu.css is missing. With no script there is only the CSV link,
// which stays a link where Enarratio put it.
import { enhance as enhanceMenu } from "../menu/menu.ts";

const MENU = "cap-chart-downloads";
const SVG = "http://www.w3.org/2000/svg";

// The form menu's chevron (menu.react.tsx), built as nodes: no markup string on a page that
// requires Trusted Types.
function chevron(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  for (const [k, v] of Object.entries({
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
    focusable: "false",
  }))
    svg.setAttribute(k, v);
  const path = document.createElementNS(SVG, "path");
  for (const [k, v] of Object.entries({
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    d: "m3.5 6 4.5 4.5L12.5 6",
  }))
    path.setAttribute(k, v);
  svg.append(path);
  return svg;
}

// " · " between the CSV link and each button the layer added: dropped with the row.
const isDot = (n: Node | null) => n?.nodeType === Node.TEXT_NODE && n.textContent?.trim() === "·";

// Gives the item the menu's look, keeping its own label, handler and `download` name.
function asItem(el: HTMLElement): void {
  // Enarratio's inline-button look would override the menu item's (its class is only a marker).
  el.classList.remove("enarratio-export");
  el.classList.add("cap-option", "cap-menu-item");
  if (el.querySelector(":scope > .cap-option-label")) return;
  const label = document.createElement("span");
  label.className = "cap-option-label";
  label.append(...Array.from(el.childNodes));
  el.append(label);
}

// Groups one frame's downloads, once the enhancement layer has added its buttons. Returns the undo
// (the items back in the source line, the menu gone), or null when there was nothing to group.
export function groupDownloads(frame: HTMLElement): (() => void) | null {
  const exports = Array.from(
    frame.querySelectorAll<HTMLElement>(`.enarratio-export:not(.${MENU} *)`),
  );
  if (exports.length === 0) return null;
  const csv = frame.querySelector<HTMLAnchorElement>(`a.enarratio-csv:not(.${MENU} *)`);
  const anchor = csv ?? exports[0]!;
  const parent = anchor.parentNode;
  if (!parent) return null;

  // A wrapper of its own, so the menu's keys are set up for this menu only.
  const wrap = document.createElement("span");
  wrap.className = MENU;
  const menu = document.createElement("details");
  menu.className = "cap-menu-form";
  menu.dataset.cap = "menu-form";
  const summary = document.createElement("summary");
  summary.className = "cap-btn cap-menu-trigger";
  summary.dataset.size = "sm";
  summary.textContent = "Download";
  summary.append(" ", chevron());
  const list = document.createElement("div");
  list.className = "cap-popover cap-menu";
  menu.append(summary, list);
  wrap.append(menu);
  parent.insertBefore(wrap, anchor);

  const items = csv ? [csv, ...exports] : exports;
  const dots: Node[] = [];
  for (const el of items) {
    if (isDot(el.previousSibling)) dots.push(el.previousSibling!);
    asItem(el);
    list.append(el);
  }
  for (const d of dots) d.parentNode?.removeChild(d);
  // A download or a copy runs and the menu closes, focus back on its button.
  const onPick = (e: Event) => {
    if (!(e.target instanceof Element) || !e.target.closest(".cap-menu-item")) return;
    menu.open = false;
    summary.focus();
  };
  list.addEventListener("click", onPick);
  const keys = enhanceMenu(wrap);
  return () => {
    keys();
    list.removeEventListener("click", onPick);
    if (csv && wrap.parentNode) wrap.parentNode.insertBefore(csv, wrap);
    wrap.remove();
  };
}
