// Show and hide. A <details class="cap-disclosure"> needs no JavaScript; this module runs the group rows
// (.cap-group): a button with aria-expanded and aria-controls. Two levels at most, and a critical item is
// never inside a collapsed group.

// Shows or hides what one button controls (a group's rows, a step's email, the warnings past the
// cap) and keeps the button's state true. A button with data-open-label says that while open
// ("Fewer warnings") and its own words again when closed (data-closed-label, else the words it
// had); an expand toggle's words are its .cap-expand-label.
export function setGroup(button: HTMLElement, expanded: boolean): void {
  button.setAttribute("aria-expanded", String(expanded));
  const openLabel = button.dataset.openLabel;
  if (openLabel) {
    const words = button.querySelector<HTMLElement>(".cap-expand-label") ?? button;
    button.dataset.closedLabel ??= words.textContent ?? "";
    words.textContent = expanded ? openLabel : button.dataset.closedLabel;
  }
  const rows = button.ownerDocument.getElementById(button.getAttribute("aria-controls") ?? "");
  if (rows) rows.hidden = !expanded;
}

export function toggleGroup(button: HTMLElement): void {
  setGroup(button, button.getAttribute("aria-expanded") !== "true");
}

export function groupDepth(group: Element): number {
  let depth = 0;
  for (let n: Element | null = group; n; n = n.parentElement?.closest(".cap-group") ?? null)
    depth += 1;
  return depth;
}

// Attaches to every expand toggle ([data-cap="expand"]) under root. Returns a function that detaches them.
export function enhanceExpand(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const button of root.querySelectorAll<HTMLElement>(
    "[data-cap='expand']:not([data-cap-ready])",
  )) {
    button.dataset.capReady = "";
    setGroup(button, button.getAttribute("aria-expanded") === "true");
    const onClick = () => toggleGroup(button);
    button.addEventListener("click", onClick);
    undo.push(() => {
      button.removeEventListener("click", onClick);
      delete button.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}

// Attaches to every [data-cap="disclosure"] group under root. A collapsed group that holds a critical
// item is opened, because critical items are never hidden. Returns a function that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  undo.push(enhanceExpand(root));
  for (const group of root.querySelectorAll<HTMLElement>(
    ".cap-group[data-cap='disclosure']:not([data-cap-ready])",
  )) {
    group.dataset.capReady = "";
    const button = group.querySelector<HTMLElement>(
      ":scope > .cap-group-toggle, :scope > .cap-group-heading > .cap-group-toggle",
    );
    if (!button) continue;
    if (groupDepth(group) > 2)
      console.warn("Capsomer disclosure: groups go two levels deep at most.", group);
    const rows = document.getElementById(button.getAttribute("aria-controls") ?? "");
    const holdsCritical = !!rows?.querySelector("[data-tone='crit']");
    if (holdsCritical && button.getAttribute("aria-expanded") !== "true") {
      console.warn(
        "Capsomer disclosure: a critical item was inside a collapsed group, so the group is open.",
        group,
      );
      setGroup(button, true);
    } else setGroup(button, button.getAttribute("aria-expanded") === "true");
    const onClick = () => toggleGroup(button);
    button.addEventListener("click", onClick);
    undo.push(() => {
      button.removeEventListener("click", onClick);
      delete group.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
