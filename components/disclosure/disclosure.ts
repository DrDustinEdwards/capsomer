// Show and hide. A <details class="cap-disclosure"> needs no JavaScript. This module runs
// the group rows (.cap-group): a button with aria-expanded and aria-controls that shows or
// hides the rows it groups. Two levels at most, and a critical item is never inside a
// collapsed group. No framework; the React wrapper uses the same rules.

// Shows or hides one group's rows and keeps its button's state true.
export function setGroup(button: HTMLElement, expanded: boolean): void {
  button.setAttribute("aria-expanded", String(expanded));
  const rows = document.getElementById(button.getAttribute("aria-controls") ?? "");
  if (rows) rows.hidden = !expanded;
}

export function toggleGroup(button: HTMLElement): void {
  setGroup(button, button.getAttribute("aria-expanded") !== "true");
}

// How deep a group sits: 1 for a group at the top, 2 for one inside another.
export function groupDepth(group: Element): number {
  let depth = 0;
  for (let n: Element | null = group; n; n = n.parentElement?.closest(".cap-group") ?? null) depth += 1;
  return depth;
}

// Attaches to every [data-cap="disclosure"] group under root. A collapsed group that holds
// a critical item ([data-tone="crit"]) is opened, because critical items are never hidden.
// Returns a function that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>(".cap-group[data-cap='disclosure']:not([data-cap-ready])")) {
    group.dataset.capReady = "";
    const button = group.querySelector<HTMLElement>(":scope > .cap-group-toggle");
    if (!button) continue;
    if (groupDepth(group) > 2) console.warn("Capsomer disclosure: groups go two levels deep at most.", group);
    const rows = document.getElementById(button.getAttribute("aria-controls") ?? "");
    const holdsCritical = !!rows?.querySelector("[data-tone='crit']");
    if (holdsCritical && button.getAttribute("aria-expanded") !== "true") {
      console.warn("Capsomer disclosure: a critical item was inside a collapsed group, so the group is open.", group);
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
