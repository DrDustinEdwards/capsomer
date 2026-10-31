import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { Fragment, createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { THEMES, expectNoAxeViolations, settled, visitStates } from "./helpers.ts";
// The wrappers as the package ships them (npm run build): Playwright rewrites the JSX of a .tsx
// file a spec imports, so the source cannot be rendered here (catalog.spec.ts says the same).
import { AnchorBar } from "../dist/components/anchor-bar/anchor-bar.react.js";
import { ApprovalSheet } from "../dist/components/approval-sheet/approval-sheet.react.js";
import { AttentionList } from "../dist/components/attention-list/attention-list.react.js";
import { Avatar, AvatarGroup } from "../dist/components/avatar/avatar.react.js";
import { Alert, Banner } from "../dist/components/banner/banner.react.js";
import { Breadcrumb } from "../dist/components/breadcrumb/breadcrumb.react.js";
import { BulkBar } from "../dist/components/bulk-bar/bulk-bar.react.js";
import { Button, ButtonGroup, ButtonGroupText } from "../dist/components/button/button.react.js";
import { FilterChips } from "../dist/components/chips/chips.react.js";
import { ConfirmDialog, ConfirmPage } from "../dist/components/confirm-dialog/confirm-dialog.react.js";
import { DatePicker } from "../dist/components/date-picker/date-picker.react.js";
import { DetailCommand, DetailPanel, DetailSection } from "../dist/components/detail-panel/detail-panel.react.js";
import { Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle } from "../dist/components/dialog/dialog.react.js";
import { Disclosure, Group } from "../dist/components/disclosure/disclosure.react.js";
import { DropZone } from "../dist/components/drop-zone/drop-zone.react.js";
import { Empty, Wait } from "../dist/components/empty/empty.react.js";
import { ErrorSummary } from "../dist/components/error-summary/error-summary.react.js";
import { Feed } from "../dist/components/feed/feed.react.js";
import { CharacterCount, Check, DateInput, Field, InputGroup, InputGroupAddon, NumberField, PasswordInput, Range, SearchField } from "../dist/components/field/field.react.js";
import { Listbox, ListboxSeparator, Option, OptionGroup } from "../dist/components/listbox/listbox.react.js";
import { MessageProvider } from "../dist/components/message/message.react.js";
import { Meter } from "../dist/components/meter/meter.react.js";
import { PageHead } from "../dist/components/page-head/page-head.react.js";
import { Pagination } from "../dist/components/pagination/pagination.react.js";
import { Panel } from "../dist/components/panel/panel.react.js";
import { PeopleRoles } from "../dist/components/people-roles/people-roles.react.js";
import { PermissionMatrix } from "../dist/components/permission-matrix/permission-matrix.react.js";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../dist/components/popover/popover.react.js";
import { Row, RowList } from "../dist/components/row-list/row-list.react.js";
import { Segmented } from "../dist/components/segmented/segmented.react.js";
import { Select } from "../dist/components/select/select.react.js";
import { SessionList } from "../dist/components/session-row/session-row.react.js";
import { OgCardPreview, SerpPreview } from "../dist/components/share-preview/share-preview.react.js";
import { Shell } from "../dist/components/shell/shell.react.js";
import { Keys, ShortcutSheet } from "../dist/components/shortcuts/shortcuts.react.js";
import { Skeleton, Spinner } from "../dist/components/skeleton/skeleton.react.js";
import { StatTile, StatTiles } from "../dist/components/stat-tile/stat-tile.react.js";
import { Pill, Status } from "../dist/components/status/status.react.js";
import { SwitchWithReason } from "../dist/components/switch-reason/switch-reason.react.js";
import { Switch } from "../dist/components/switch/switch.react.js";
import { ThemeButton, ThemeSwitch } from "../dist/components/theme-switch/theme-switch.react.js";
import { Tooltip } from "../dist/components/tooltip/tooltip.react.js";
import { UsageMeter } from "../dist/components/usage-meter/usage-meter.react.js";

// The sweep: every component's states page and each of its page-level specimens, checked for
// what every component owes and no component spec has to repeat. A failure names the
// component, the page (its specimen id) and the element.
//   reflow        320px wide, no sideways scroll outside a named scroll region (WCAG 1.4.10),
//                 and with dir="rtl" no element newly sticks out of its parent (physical
//                 left/right where a logical property belongs), at 320px and 1280px
//   text spacing  WCAG 1.4.12's overrides clip no text that fitted before
//   links         no link is underlined, and every text link is semibold (DEFAULTS.md)
//   targets       on a coarse pointer every target is 44 x 44, or at least 24 x 24 with no
//                 other target within 22px of its centre (WCAG 2.5.8's spacing, at the 44px
//                 Capsomer promises on touch, tokens/scale.css)
//   forced colors axe-free, and every focusable element shows an outline on :focus-visible
//                 (a box-shadow or background ring is gone in forced colors), in both themes:
//                 Chromium follows the color scheme to a dark or a light system palette
//   React         a wrapper renders each of its classes with the role (written, or implied by
//                 the tag) and the naming the HTML contract (the doc page's markup and
//                 examples.html) gives it: in its React specimens, or for a wrapper with none,
//                 in one fixture rendered on the server (FIXTURES)
// Geometry does not depend on the palette, so reflow, spacing, targets and React run once, in
// the light theme (playwright.config.ts, grepInvert).

type Spot = { name: string; only?: string };
const NAMES = readdirSync("components", { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`components/${d.name}/examples.html`))
  .map((d) => d.name);
function spots(name: string): Spot[] {
  const html = readFileSync(`components/${name}/examples.html`, "utf8");
  return [{ name }, ...[...html.matchAll(/<template\b[^>]*\bdata-specimen="([^"]+)"/g)].map((m) => ({ name, only: m[1] }))];
}
const where = (s: Spot) => (s.only ? `${s.name} ?only=${s.only}` : `${s.name} states page`);

// A wrapper with no React specimen (no examples.tsx) is checked against one small fixture,
// rendered to HTML as a server would: the cheapest real check that it writes the contract.
const noop = () => undefined;
const later = async () => undefined;
const NOW = Date.parse("2026-10-31T12:00:00Z");
const FIXTURES: Record<string, () => ReactElement> = {
  "anchor-bar": () => h(AnchorBar, { sections: [{ id: "overview", label: "Overview" }, { id: "checks", label: "Checks" }], always: true }),
  "approval-sheet": () => h(ApprovalSheet, { open: true, gates: [{ id: "push", title: "Push the capsomer branch", command: "git push origin a11y-all" }], onApprove: noop, onClose: noop }),
  "attention-list": () => h(AttentionList, { title: "Needs you", items: [{ id: "down", tone: "crit", title: "foxhound.app does not answer", detail: "3 failed checks since 13:40", href: "#down" }, { id: "cert", tone: "warn", title: "Renew txasm.example's certificate", href: "#cert" }] }),
  avatar: () => h(Fragment, null, h(Avatar, { name: "Rosa Park" }), h(AvatarGroup, { label: "Reviewers", extra: 2, children: h(Avatar, { name: "Sam Okafor" }) })),
  banner: () => h(Fragment, null, h(Banner, { title: "Maintenance tonight", onDismiss: noop, children: "The queue pauses at 22:00 UTC." }), h(Alert, { title: "The draft was not saved", children: "Try again in a minute." })),
  breadcrumb: () => h(Breadcrumb, { items: [{ label: "Sites", href: "#sites" }, { label: "fieldnotes.example", href: "#site" }, { label: "Media", href: "#media" }, { label: "IMG_4821" }], maxItems: 3 }),
  "bulk-bar": () => h(BulkBar, { items: [{ id: "p1", label: "Notes on the Foxhound release" }], actions: [{ id: "publish", label: "Publish" }, { id: "delete", label: "Delete", destructive: true }], onClear: noop, total: 4 }),
  button: () => h(Fragment, null, h(Button, { variant: "primary" }, "Save"), h(ButtonGroup, { label: "Zoom" }, h(Button, null, "Smaller"), h(ButtonGroupText, null, "100%"))),
  chips: () => h(FilterChips, { label: "Status", options: [{ value: "open", label: "Open" }, { value: "done", label: "Done" }], value: ["open"], onChange: noop, count: "12 shown" }),
  "confirm-dialog": () => h(Fragment, null, h(ConfirmDialog, { open: true, title: "Delete 3 drafts?", body: ["They are gone for good."], action: "Delete", perform: later, onClose: noop }), h(ConfirmPage, { title: "Delete fieldnotes.example?", cancelHref: "#back", typeToConfirm: "fieldnotes" })),
  "date-picker": () => h(DatePicker, { label: "Publish on", name: "on" }),
  "detail-panel": () => h(DetailPanel, { open: true, onClose: noop, id: "job_7f3a", title: "Push the capsomer branch", kind: "Job", children: h(DetailSection, { title: "Command", children: h(DetailCommand, { text: "git push origin a11y-all" }) }) }),
  dialog: () => h(Dialog, { open: true, onOpenChange: noop }, h(DialogHeader, null, h(DialogTitle, null, "Rename the draft")), h(DialogBody, null, "The old address redirects."), h(DialogFooter, null, h(DialogClose, { part: "cancel" }, "Cancel"))),
  disclosure: () => h(Fragment, null, h(Disclosure, { summary: "What the check reads", children: "The site's sitemap." }), h(Group, { label: "Warnings", count: 2, children: h("p", null, "Two certificates end this month.") })),
  "drop-zone": () => h(DropZone, { name: "files", title: "Drop pictures here" }),
  empty: () => h(Fragment, null, h(Empty, { kind: "no-match", title: "No posts match" }), h(Wait, { label: "Loading posts", children: h("p", null, "Posts") })),
  "error-summary": () => h(ErrorSummary, { errors: [{ id: "email", text: "Enter an email address" }, { id: "name", text: "Enter a name" }] }),
  feed: () => h(Feed, { days: [{ id: "today", label: "Today", events: [{ id: "e1", tone: "ok", what: "Deployed capsomer", when: "10:02", at: "2026-10-31T10:02:00Z" }] }] }),
  field: () =>
    h(
      Fragment,
      null,
      h(Field, { label: "Email", help: "Your work address", error: "Enter an email address", children: (p) => h("input", { ...p, className: "cap-input", type: "email" }) }),
      h(Check, { label: "Send me the digest" }),
      h(Range, { "aria-label": "Volume", value: 4, max: 10 }),
      h(InputGroup, { label: "Price" }, h(InputGroupAddon, null, "$"), h("input", { className: "cap-input" })),
      h(PasswordInput, { label: "Password", name: "password" }),
      h(CharacterCount, { label: "Summary", value: "Short", limit: 160 }),
      h(NumberField, { label: "Copies", value: 2, onChange: noop }),
      h(SearchField, { label: "Search posts", value: "", onChange: noop }),
      h(DateInput, { legend: "Date of birth", name: "dob", value: { day: "", month: "", year: "" }, onChange: noop }),
    ),
  listbox: () => h(Listbox, { "aria-label": "Sites", selection: "single" }, h(OptionGroup, { label: "Watch" }, h(Option, { id: "o1", value: "fh", selected: true }, "foxhound.app"), h(Option, { id: "o2", value: "tx" }, "txasm.example")), h(ListboxSeparator)),
  message: () => h(MessageProvider, null, h("p", null, "The page.")),
  meter: () => h(Meter, { label: "Storage", value: 7, max: 10, valueText: "7 of 10 GB" }),
  "page-head": () => h(PageHead, { title: "Media", lead: "Every picture on the site.", crumbs: [{ label: "Sites", href: "#sites" }, { label: "Media" }], actions: h(Button, null, "Upload") }),
  pagination: () => h(Pagination, { page: 2, pageCount: 5, hrefFor: (n: number) => `?page=${n}`, total: 48, perPage: 10, noun: "posts" }),
  panel: () => h(Panel, { title: "Checks", count: 3, description: "What ran today.", children: h("p", null, "All passed.") }),
  "people-roles": () =>
    h(PeopleRoles, {
      action: "/members",
      now: NOW,
      data: { heading: "Lab members", people: [{ email: "rosa@example.com", name: "Rosa Park", title: "Lab worker", endDate: "2027-01-31", status: "active", sync: "ready", manageable: true }], titles: [{ value: "worker", label: "Lab worker", defaultEnd: "2027-01-31" }] },
    }),
  "permission-matrix": () => h(PermissionMatrix, { matrix: { permissions: ["read", "write"], agents: [{ name: "capsid-agent", holds: ["read"] }] } }),
  popover: () => h(Popover, null, h(PopoverTrigger, null, "Details"), h(PopoverContent, null, h(PopoverHeader, null, h(PopoverTitle, null, "Job"), h(PopoverDescription, null, "Runs at noon.")))),
  "row-list": () => h(RowList, { label: "Jobs", children: h(Row, { title: "Push the branch", href: "#push", detail: "Waiting for approval", meta: "2 min ago" }) }),
  segmented: () => h(Segmented, { legend: "View", options: [{ value: "grid", label: "Grid" }, { value: "list", label: "List" }], value: "grid", onChange: noop }),
  select: () => h(Select, { "aria-label": "Site", options: [{ value: "fh", label: "foxhound.app" }, { group: "Labs", options: [{ value: "tx", label: "txasm.example" }] }] }),
  "session-row": () => h(SessionList, { label: "Sessions", sessions: [{ id: "s1", agent: "capsid-agent", state: "needs", since: NOW, age: "2 min", ask: { question: "Push the branch?", command: "git push", answers: [{ id: "yes", label: "Push", variant: "primary" }] } }] }),
  "share-preview": () => h(Fragment, null, h(SerpPreview, { url: "https://dustinedwards.info/blog/foxhound", title: "Notes on the Foxhound release", description: "What changed." }), h(OgCardPreview, { image: h("img", { src: "/card.png", alt: "" }), host: "dustinedwards.info", title: "Notes on the Foxhound release" })),
  shell: () => h(Shell, { brand: "Capsid", nav: [{ id: "queue", label: "Queue", href: "#queue", current: true, count: 5 }, { id: "sites", label: "Sites", href: "#sites" }], children: h("p", null, "The page.") }),
  shortcuts: () => h(Fragment, null, h(Keys, { spec: "g o" }), h(ShortcutSheet, { open: true, onOpenChange: noop })),
  skeleton: () => h(Fragment, null, h(Spinner, { label: "Loading jobs" }), h(Skeleton, { lines: 2 })),
  "stat-tile": () => h(StatTiles, { label: "This week", children: [h(StatTile, { key: "up", label: "Uptime", figure: "99.9", unit: "%", tone: "ok" }), h(StatTile, { key: "err", label: "Errors", tone: "nodata", reason: "No data yet" })] }),
  status: () => h(Fragment, null, h(Status, { tone: "crit", children: "Down" }), h(Pill, { tone: "warn", href: "#mentions", children: "Mentions 4" })),
  "switch-reason": () => h(SwitchWithReason, { label: "Pause the queue", checked: false, onApply: later }),
  switch: () => h(Switch, { label: "Email me" }),
  "theme-switch": () => h(Fragment, null, h(ThemeSwitch, { initial: "light" }), h(ThemeButton, { initial: "dark" })),
  tooltip: () => h(Tooltip, { tip: "3 failed checks", children: (t) => h("button", { ...t, type: "button", className: "cap-btn" }, "foxhound.app") }),
  "usage-meter": () => h(UsageMeter, { now: NOW, items: [{ id: "runs", name: "Runs", amount: "40 of 100", used: 40, limit: 100, history: [10, 20, 40], resetsAt: NOW + 86_400_000 }] }),
};

// A state axe misreads, left out exactly as the component's own spec leaves it out: the
// admin-shell tile whose tip is open (admin-shell.spec.ts says why).
const AXE_EXCLUDE: Record<string, string> = { "admin-shell/tip": ".cap-admin-tip:popover-open" };

// Every check runs in the page. One installer, so each check reads as a call.
function install(): void {
  const vis = (el: Element) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "contents" || el.closest("[hidden], [inert], template, svg *, details:not([open]) > :not(summary)")) return false;
    // Visually hidden (.cap-sr-only, Enarratio's hidden list and caption): clipped to nothing.
    for (let a: Element | null = el; a; a = a.parentElement) if (getComputedStyle(a).clipPath === "inset(50%)") return false;
    return true;
  };
  const label = (el: Element) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = [...el.classList].filter((c) => !c.startsWith("cm-")).slice(0, 2).map((c) => `.${c}`).join("");
    const text = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30);
    const at = el.closest("[id]:not(html):not(body)");
    const place = at && at !== el ? ` in #${at.id}` : "";
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ""}${place}`;
  };
  const all = () => [...document.body.querySelectorAll("*")].filter((el) => !(el instanceof HTMLIFrameElement && el.classList.contains("cap-specimen-frame")));
  const clipsX = (el: Element) => getComputedStyle(el).overflowX !== "visible";
  const named = (el: Element | null) => !!el && (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby"));

  // Sideways scroll of the page, and what causes it: an element past the window's edge with no
  // clipping or scrolling ancestor. A region that scrolls sideways must be named.
  const reflow = () => {
    const out: string[] = [];
    const past = new Set<Element>();
    const vw = document.documentElement.clientWidth;
    const scrolls = document.documentElement.scrollWidth > vw + 1;
    for (const el of all()) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if ((r.right > vw + 1 || r.left < -1) && (scrolls || (r.right > 0 && r.left < vw)) && cs.position !== "fixed") {
        let held = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (clipsX(a)) held = true;
        // The outermost cause only: a child of an element already reported adds nothing.
        if (!held && ![...past].some((p) => p.contains(el))) out.push(`${label(el)} runs past the window (${Math.round(r.left)} to ${Math.round(r.right)}px of ${vw})`);
        if (!held) past.add(el);
      }
      if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1 && !named(el) && !named(el.parentElement)) {
        out.push(`${label(el)} scrolls sideways and is not a named region`);
      }
    }
    return out.slice(0, 12);
  };

  // Each element's horizontal spill past its parent (past the window, for a fixed element or one
  // in the top layer: an open popover or modal), to compare left to right with right to left.
  const spill = () => {
    const m = new Map<Element, number>();
    const vw = document.documentElement.clientWidth;
    for (const el of all()) {
      const p = el.parentElement;
      if (!p || !vis(el) || !vis(p) || el instanceof SVGElement) continue;
      const a = el.getBoundingClientRect();
      const top = getComputedStyle(el).position === "fixed" || el.matches(":popover-open, dialog:modal");
      const b = top ? new DOMRect(0, 0, vw, 0) : p.getBoundingClientRect();
      m.set(el, Math.max(0, b.left - a.left, a.right - b.right));
    }
    return m;
  };
  let ltr = new Map<Element, number>();
  const rtl = (phase: "ltr" | "rtl") => {
    if (phase === "ltr") {
      document.documentElement.dir = "";
      ltr = spill();
      return [];
    }
    document.documentElement.dir = "rtl";
    const now = spill();
    document.documentElement.dir = "";
    const out: string[] = [];
    for (const [el, px] of now) if (px > (ltr.get(el) ?? 0) + 2) out.push(`${label(el)} sticks out of its parent by ${Math.round(px)}px only right to left`);
    return out.filter((m, i) => !out.slice(0, i).some((p) => p.split(" sticks ")[0] === m.split(" sticks ")[0])).slice(0, 12);
  };

  // Elements that clip (overflow hidden or clip) and hold text, and whether their content is
  // already bigger than their box.
  const clipped = () => {
    const s = new Set<Element>();
    for (const el of all()) {
      if (!vis(el) || !(el.textContent ?? "").trim()) continue;
      const cs = getComputedStyle(el);
      const cut = (v: string) => v === "hidden" || v === "clip";
      if ((cut(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) || (cut(cs.overflowY) && el.scrollHeight > el.clientHeight + 1)) s.add(el);
    }
    return s;
  };
  let before = new Set<Element>();
  const spacing = (phase: "before" | "after") => {
    if (phase === "before") {
      before = clipped();
      const style = document.createElement("style");
      style.id = "sweep-text-spacing";
      style.textContent = "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }";
      document.head.append(style);
      return [];
    }
    const out = [...clipped()].filter((el) => !before.has(el)).map((el) => `${label(el)} clips its text`);
    document.getElementById("sweep-text-spacing")?.remove();
    return out.slice(0, 12);
  };

  // A target's hit extent along the lines through its centre, by hit testing, so a label, a
  // ::before hit area and padding count, and what covers it does not.
  const TARGETS =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=menuitemradio], [role=menuitemcheckbox], [role=option], [role=treeitem], [role=slider], [role=combobox], [tabindex]:not([tabindex='-1'])";
  const owns = (el: Element, h: Element | null) => !!h && (el.contains(h) || (el instanceof HTMLInputElement && [...(el.labels ?? [])].some((l) => l.contains(h))));
  const targets = () => {
    const found: { el: Element; label: string; w: number; h: number; x: number; y: number; box: DOMRect }[] = [];
    for (const el of document.body.querySelectorAll(TARGETS)) {
      if (!vis(el) || (el as HTMLButtonElement).disabled || el.closest("[aria-disabled='true'], [aria-hidden='true']")) continue;
      // Inline in a sentence: WCAG 2.5.8's inline exception.
      if (getComputedStyle(el).display === "inline" && el.parentElement && (el.parentElement.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 1) continue;
      el.scrollIntoView({ block: "center", inline: "center" });
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (!owns(el, document.elementFromPoint(cx, cy))) continue; // covered, or hit-tests to its label only
      let l = cx;
      let rr = cx;
      let t = cy;
      let b = cy;
      while (l > r.left - 30 && owns(el, document.elementFromPoint(l - 1, cy))) l--;
      while (rr < r.right + 30 && owns(el, document.elementFromPoint(rr + 1, cy))) rr++;
      while (t > r.top - 30 && owns(el, document.elementFromPoint(cx, t - 1))) t--;
      while (b < r.bottom + 30 && owns(el, document.elementFromPoint(cx, b + 1))) b++;
      // Hit testing reads whole pixels; where the hits reach both edges of the box, the box's own
      // (fractional) size is the size.
      const w = Math.max(rr - l + 1, l <= r.left + 1 && rr >= r.right - 2 ? r.width : 0);
      const h = Math.max(b - t + 1, t <= r.top + 1 && b >= r.bottom - 2 ? r.height : 0);
      const sx = window.scrollX;
      const sy = window.scrollY;
      found.push({ el, label: label(el), w: Math.round(w * 100) / 100, h: Math.round(h * 100) / 100, x: cx + sx, y: cy + sy, box: new DOMRect(r.left + sx, r.top + sy, r.width, r.height) });
    }
    const out: string[] = [];
    for (const f of found) {
      if (f.w >= 44 && f.h >= 44) continue;
      const near = found.find((o) => {
        if (o === f || o.el.contains(f.el) || f.el.contains(o.el)) return false;
        const dx = Math.max(o.box.left - f.x, 0, f.x - o.box.right);
        const dy = Math.max(o.box.top - f.y, 0, f.y - o.box.bottom);
        return Math.hypot(dx, dy) < 22;
      });
      if (f.w < 24 || f.h < 24) out.push(`${f.label} is ${f.w} x ${f.h}px`);
      else if (near) out.push(`${f.label} is ${f.w} x ${f.h}px with ${near.label} within 22px`);
    }
    window.scrollTo(0, 0);
    return out.slice(0, 15);
  };

  // A link is told by weight, not a line (DEFAULTS.md): no link is underlined (the current page
  // in a bar may be, as its marker), and a text link, inline with no component class, is semibold.
  const links = () => {
    const out: string[] = [];
    for (const el of document.body.querySelectorAll("a[href]")) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.textDecorationLine.includes("underline") && !el.hasAttribute("aria-current")) out.push(`${label(el)} is underlined`);
      else if (cs.display === "inline" && !el.matches("[class*='cap-']") && Number(cs.fontWeight) < 600) out.push(`${label(el)} is a text link at weight ${cs.fontWeight}, not 600`);
    }
    return out.slice(0, 12);
  };

  // Every focusable element, focused from script with no pointer used (so :focus-visible
  // matches), must draw an outline on itself, on a pseudo-element or on an ancestor up to four
  // levels up (a row that rings when its link is focused) that had none before, or that shows
  // the focused look on purpose (data-force="focus", a specimen of it).
  const FOCUSABLE = "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex='-1']), [contenteditable='true']";
  const rings = async () => {
    const out: string[] = [];
    const drawn = (el: Element, pseudo?: string) => {
      const cs = getComputedStyle(el, pseudo);
      return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 1;
    };
    for (const el of document.body.querySelectorAll<HTMLElement>(FOCUSABLE)) {
      if (!vis(el) || (el as HTMLButtonElement).disabled || el.closest("[aria-hidden='true']")) continue;
      // A specimen may open with its input focused; its ring is then already drawn, and a ring set
      // by script (CodeMirror's .cm-focused) goes a frame or two after the blur.
      // Closing a popup on blur can hand focus back to its opener, so blur until focus stays out.
      for (let i = 0; i < 6 && document.activeElement && document.activeElement !== document.body; i++) {
        (document.activeElement as HTMLElement).blur();
        for (let j = 0; j < 3; j++) await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      const near: HTMLElement[] = [];
      for (let a = el.parentElement; a && near.length < 4; a = a.parentElement) near.push(a);
      const was = near.map((a) => drawn(a));
      el.focus({ preventScroll: true });
      if (document.activeElement !== el) continue;
      const ok = () => !el.matches(":focus-visible") || drawn(el) || drawn(el, "::before") || drawn(el, "::after") || near.some((a, i) => (!was[i] || a.dataset.force === "focus") && drawn(a));
      // A ring set by script on focus lands a frame or two later.
      for (let i = 0; i < 6 && !ok(); i++) await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (!ok()) out.push(`${label(el)} shows no outline on focus`);
      el.blur();
    }
    return out.slice(0, 15);
  };

  // The React side and the contract side of the parity check: each own class with its tag,
  // role and whether it is named.
  // The role an element has, written or implied by its tag (a <summary> is a button).
  const IMPLIED: Record<string, string> = { a: "link", button: "button", summary: "button", nav: "navigation", ul: "list", ol: "list", li: "listitem", dialog: "dialog", table: "table", select: "combobox", textarea: "textbox", h1: "heading", h2: "heading", h3: "heading", h4: "heading", form: "form", main: "main", header: "banner", footer: "contentinfo" };
  const roleOf = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (el.getAttribute("role")) return el.getAttribute("role") as string;
    if (tag === "input") return ({ checkbox: "checkbox", radio: "radio", range: "slider", search: "searchbox", button: "button", submit: "button" } as Record<string, string>)[(el as HTMLInputElement).type] ?? "textbox";
    if (tag === "a" && !el.hasAttribute("href")) return "generic";
    return IMPLIED[tag] ?? "generic";
  };
  const shape = (root: ParentNode, own: string[], skip: string) => {
    const out: { cls: string; tag: string; role: string; named: boolean }[] = [];
    for (const el of root.querySelectorAll("[class]")) {
      if (skip && el.closest(skip)) continue;
      for (const cls of el.classList) if (own.includes(cls)) out.push({ cls, tag: el.tagName.toLowerCase(), role: roleOf(el), named: named(el) });
    }
    return out;
  };
  const reactShape = (own: string[], roots: string) => [...document.querySelectorAll(roots)].flatMap((m) => shape(m, own, ""));
  const contractShape = (html: string[], own: string[], roots: string) => html.flatMap((h) => shape(new DOMParser().parseFromString(h, "text/html").body, own, roots));

  Object.assign(window, { __sweep: { reflow, rtl, spacing, links, targets, rings, reactShape, contractShape } });
}

type Sweep = {
  reflow(): string[];
  rtl(phase: "ltr" | "rtl"): string[];
  spacing(phase: "before" | "after"): string[];
  links(): string[];
  targets(): string[];
  rings(): Promise<string[]>;
  reactShape(own: string[], roots: string): Shape[];
  contractShape(html: string[], own: string[], roots: string): Shape[];
};
type Shape = { cls: string; tag: string; role: string; named: boolean };
declare global {
  interface Window {
    __sweep: Sweep;
  }
}

// Opens a page, waits for React mounts and finite animations, and installs the checks.
async function open(page: Page, s: Spot, theme: (typeof THEMES)[number] = "light"): Promise<void> {
  await visitStates(page, s.name, theme, s.only);
  await page.waitForFunction(() => [...document.querySelectorAll("[data-mount]")].every((m) => m.childElementCount > 0), undefined, { timeout: 5_000 }).catch(() => undefined);
  await settled(page);
  await page.evaluate(install);
}
const tag = (s: Spot, found: string[]) => found.map((f) => `${where(s)}: ${f}`);

for (const name of NAMES) {
  const pages = spots(name);
  test.describe(name, () => {
    test.describe.configure({ timeout: 30_000 + pages.length * 15_000 });

    test("accessibility: sweep: reflows at 320px, and right to left nothing sticks out", async ({ page }) => {
      const found: string[] = [];
      for (const s of pages) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await open(page, s);
        await page.evaluate(() => window.__sweep.rtl("ltr"));
        found.push(...tag(s, await page.evaluate(() => window.__sweep.rtl("rtl"))));
        await page.setViewportSize({ width: 320, height: 640 });
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        found.push(...tag(s, await page.evaluate(() => window.__sweep.reflow())));
        await page.evaluate(() => window.__sweep.rtl("ltr"));
        found.push(...tag(s, await page.evaluate(() => window.__sweep.rtl("rtl"))));
      }
      expect(found).toEqual([]);
    });

    test("accessibility: sweep: text spacing clips no text (WCAG 1.4.12), and links are told by weight", async ({ page }) => {
      const found: string[] = [];
      for (const s of pages) {
        await open(page, s);
        found.push(...tag(s, await page.evaluate(() => window.__sweep.links())));
        await page.evaluate(() => window.__sweep.spacing("before"));
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        found.push(...tag(s, await page.evaluate(() => window.__sweep.spacing("after"))));
      }
      expect(found).toEqual([]);
    });

    test.describe(() => {
      test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
      test("accessibility: sweep: targets on a coarse pointer (WCAG 2.5.8)", async ({ page }) => {
        const found: string[] = [];
        for (const s of pages) {
          await open(page, s);
          expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
          found.push(...tag(s, await page.evaluate(() => window.__sweep.targets())));
        }
        expect(found).toEqual([]);
      });
    });

    for (const theme of THEMES) {
      test.describe(`${theme} theme`, () => {
        test.use({ colorScheme: theme, forcedColors: "active" });
        test("accessibility: sweep: forced colors: no axe violations, and focus shows an outline", async ({ page }) => {
          const found: string[] = [];
          for (const s of pages) {
            await open(page, s, theme);
            // Not color-contrast: in forced colors the person's palette paints every color, and axe
            // reads the author's colors the browser no longer paints (it read a primary button as
            // #fdfdfe on #ffffff, 1.01:1, painted black on white). Contrast is scanned in both
            // themes by every component's own axe test.
            const misread = AXE_EXCLUDE[`${s.name}/${s.only}`];
            if (misread) await page.evaluate((sel) => document.querySelector(sel)?.closest(".cap-admin-tile")?.setAttribute("data-tip-open", ""), misread);
            await expectNoAxeViolations(page, undefined, { baseUi: true, exclude: misread ? "[data-tip-open]" : undefined, disableRules: ["color-contrast"] });
            found.push(...tag(s, await page.evaluate(() => window.__sweep.rings())));
            // A person's look at what no check reads: a state drawn only by a background or a
            // shadow, which forced colors removes. Kept with the run (ci.yml), never compared.
            if (theme === "light" && !s.only) {
              mkdirSync("test-results/forced-colors", { recursive: true });
              await page.screenshot({ path: `test-results/forced-colors/${name}.png`, fullPage: true });
            }
          }
          expect(found).toEqual([]);
        });
      });
    }

    const fixture = FIXTURES[name];
    if (existsSync(`components/${name}/examples.tsx`) || fixture) {
      test("behavior: sweep: the React wrapper renders the HTML contract's elements, roles and names", async ({ page }) => {
        const css = readFileSync(`components/${name}/${name}.css`, "utf8");
        const own = [...new Set([...css.matchAll(/\.(cap-[\w-]+)/g)].map((m) => m[1] as string))];
        const md = readFileSync(`components/${name}/${name}.md`, "utf8");
        const contract = [readFileSync(`components/${name}/examples.html`, "utf8").replace(/<template\b[^>]*>|<\/template>/g, ""), ...[...md.matchAll(/```html\n([\s\S]*?)```/g)].map((m) => m[1] as string)];
        const rendered: (Shape & { at: string })[] = [];
        let html: Shape[] = [];
        if (fixture) {
          await open(page, { name });
          html = await page.evaluate(([h, o]) => window.__sweep.contractShape(h, o, ""), [contract, own] as const);
          const markup = renderToStaticMarkup(fixture());
          rendered.push(...(await page.evaluate(([m, o]) => window.__sweep.contractShape(m, o, ""), [[markup] as string[], own] as const)).map((r) => ({ ...r, at: `${name} fixture` })));
        } else {
          // Where React renders: every data-mount, and each element examples.tsx finds by id.
          const tsx = readFileSync(`components/${name}/examples.tsx`, "utf8");
          const ids = [...new Set([...tsx.matchAll(/"([a-z][\w-]*)"/g)].map((m) => m[1] as string))].filter((id) => contract[0]?.includes(`id="${id}"`));
          const roots = ["[data-mount]", ...ids.map((id) => `#${id}`)].join(", ");
          for (const s of pages) {
            await open(page, s);
            if (!html.length) html = await page.evaluate(([h, o, r]) => window.__sweep.contractShape(h, o, r), [contract, own, roots] as const);
            rendered.push(...(await page.evaluate(([o, r]) => window.__sweep.reactShape(o, r), [own, roots] as const)).map((r) => ({ ...r, at: where(s) })));
          }
        }
        expect(rendered.length, "the React specimens rendered").toBeGreaterThan(0);
        const found = new Set<string>();
        for (const r of rendered) {
          const same = html.filter((h) => h.cls === r.cls);
          if (!same.length) continue; // a class the HTML contract never shows: nothing to compare
          const match = same.filter((h) => h.role === r.role);
          if (!match.length) found.add(`${r.at}: React renders .${r.cls} as <${r.tag}> (${r.role}), the contract as ${[...new Set(same.map((h) => `<${h.tag}> (${h.role})`))].join(" or ")}`);
          else if (match.every((h) => h.named) && !r.named) found.add(`${r.at}: React's .${r.cls} has no aria-label or aria-labelledby; the contract's always has one`);
        }
        expect([...found]).toEqual([]);
      });
    }
  });
}
