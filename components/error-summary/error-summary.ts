// The error summary (GOV.UK Error summary): after a failed submit, a titled list of links to
// every field in error, at the top of the form. It takes focus, and the page title starts
// "Error: " until the form is sent. Field's submit check (field.ts) writes it; a page the
// server rendered with errors writes the same markup with `autofocus`, and enhance() wires its
// links. No framework; the React wrapper uses the same functions.

export interface SummaryItem {
  control: HTMLElement;
  text: string;
}

const PREFIX = "Error: ";
let serial = 0;

// Puts "Error: " at the start of the page title, or takes it off.
export function setTitleError(on: boolean): void {
  const has = document.title.startsWith(PREFIX);
  if (on && !has) document.title = PREFIX + document.title;
  else if (!on && has) document.title = document.title.slice(PREFIX.length);
}

// A link goes to its field: focus in the control, and the field's label or legend scrolled
// into view with it, so the question is seen as well as the box.
function onClick(e: MouseEvent): void {
  const link = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href^='#']");
  const target = link ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null;
  if (!target) return;
  e.preventDefault();
  const head = target.closest(".cap-field")?.querySelector(":scope > .cap-field-label") ?? target;
  head.scrollIntoView({ block: "start" });
  focusTarget(target).focus({ preventScroll: true });
}

const CONTROL =
  "input:not([type='hidden']):not(:disabled), select:not(:disabled), textarea:not(:disabled)";

// Where a link to a field lands. A control is itself. A group (a fieldset, a repeater, a date
// input) lands on the control in it that is in error, else the first one left empty, else its
// first control, so the person is put where the answer goes, not on the group's edge.
export function focusTarget(target: HTMLElement): HTMLElement {
  if (target.matches(CONTROL)) return target;
  const controls = [...target.querySelectorAll<HTMLElement>(CONTROL)];
  return (
    controls.find((c) => c.getAttribute("aria-invalid") === "true") ??
    controls.find(
      (c) =>
        (c instanceof HTMLInputElement ||
          c instanceof HTMLTextAreaElement ||
          c instanceof HTMLSelectElement) &&
        !(c instanceof HTMLInputElement && (c.type === "checkbox" || c.type === "radio")) &&
        c.value === "",
    ) ??
    controls[0] ??
    target
  );
}

export function wireSummary(summary: HTMLElement): () => void {
  summary.dataset.capReady = "";
  summary.addEventListener("click", onClick);
  return () => {
    summary.removeEventListener("click", onClick);
    delete summary.dataset.capReady;
  };
}

// The form's own .cap-error-summary, or a new one made as its first child.
export function summaryFor(form: HTMLFormElement): HTMLElement {
  const own = form.querySelector<HTMLElement>(".cap-error-summary");
  if (own) {
    if (own.dataset.capReady === undefined) wireSummary(own);
    return own;
  }
  const summary = document.createElement("div");
  const title = document.createElement("h2");
  const list = document.createElement("ul");
  summary.className = "cap-error-summary";
  summary.dataset.cap = "error-summary";
  summary.tabIndex = -1;
  summary.setAttribute("role", "alert");
  title.className = "cap-error-summary-title";
  title.id = `cap-error-summary-${++serial}`;
  title.textContent = "There is a problem";
  summary.setAttribute("aria-labelledby", title.id);
  list.className = "cap-error-summary-list";
  summary.append(title, list);
  summary.hidden = true;
  form.prepend(summary);
  wireSummary(summary);
  return summary;
}

// Lists the fields in error, each a link with the message beside its field, and moves focus
// to the summary.
export function showSummary(summary: HTMLElement, items: SummaryItem[]): void {
  const list = summary.querySelector(".cap-error-summary-list");
  list?.replaceChildren(
    ...items.map(({ control, text }) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      if (!control.id) control.id = `cap-error-field-${++serial}`;
      a.href = `#${control.id}`;
      a.textContent = text;
      li.append(a);
      return li;
    }),
  );
  summary.hidden = false;
  summary.focus();
}

export function hideSummary(summary: HTMLElement): void {
  summary.hidden = true;
  summary.querySelector(".cap-error-summary-list")?.replaceChildren();
}

// Wires every [data-cap="error-summary"] under root not yet wired (one the server rendered).
export function enhance(root: ParentNode = document): () => void {
  const undo = [
    ...root.querySelectorAll<HTMLElement>("[data-cap='error-summary']:not([data-cap-ready])"),
  ].map(wireSummary);
  return () => undo.forEach((f) => f());
}
