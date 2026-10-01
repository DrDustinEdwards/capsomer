// Filter chips' behaviour: a chip toggles aria-pressed; Clear shows while any chip is
// pressed and releases them all; the pressed values go into the address
// (?status=blocked,running) with history.replaceState, so a reload or a shared link keeps
// the filter; and every change dispatches `cap:filter-change` with { param, values }. The
// app filters, then writes the count with setCount.

export const EVENT = "cap:filter-change";

export interface FilterChangeDetail {
  // The address parameter, from data-param, or null when the group keeps out of the address.
  param: string | null;
  values: string[];
}

function chips(group: Element): HTMLButtonElement[] {
  return [...group.querySelectorAll<HTMLButtonElement>(".cap-chip")];
}

export function valueOf(chip: HTMLElement): string {
  return chip.dataset.value ?? chip.textContent?.trim().toLowerCase() ?? "";
}

export function pressedValues(group: Element): string[] {
  return chips(group)
    .filter((c) => c.getAttribute("aria-pressed") === "true")
    .map(valueOf);
}

// Shows Clear while any chip is pressed.
export function syncClear(group: Element): void {
  const clear = group.querySelector<HTMLElement>("[data-cap-part='clear']");
  if (clear) clear.hidden = pressedValues(group).length === 0;
}

export function setPressed(group: Element, values: string[]): void {
  for (const c of chips(group)) c.setAttribute("aria-pressed", String(values.includes(valueOf(c))));
  syncClear(group);
}

// The values in an address's search string, or null when the parameter is absent.
export function readParam(search: string, param: string): string[] | null {
  const raw = new URLSearchParams(search).get(param);
  return raw === null ? null : raw.split(",").filter(Boolean);
}

// The address with the parameter set to the values, comma-separated and readable
// (?status=blocked,running), or removed when there are none. Values must not hold commas.
export function writeParam(href: string, param: string, values: string[]): string {
  const url = new URL(href);
  if (values.length > 0) url.searchParams.set(param, values.join(","));
  else url.searchParams.delete(param);
  url.search = url.searchParams.toString().replace(/%2C/gi, ",");
  return url.toString();
}

// Writes the result count into the group's live region: "3 of 14 jobs".
export function setCount(group: Element, text: string): void {
  const count = group.querySelector<HTMLElement>(".cap-chips-count");
  if (count && count.textContent !== text) count.textContent = text;
}

function changed(group: HTMLElement): void {
  syncClear(group);
  const param = group.dataset.param ?? null;
  const values = pressedValues(group);
  if (param) {
    try {
      history.replaceState(history.state, "", writeParam(location.href, param, values));
    } catch {
      // A sandboxed frame may refuse; the filter still works, it is just not in the address.
    }
  }
  group.dispatchEvent(new CustomEvent<FilterChangeDetail>(EVENT, { bubbles: true, detail: { param, values } }));
}

// Presses or releases one chip, as a click does.
export function toggle(group: HTMLElement, chip: HTMLElement): void {
  chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
  changed(group);
}

// Releases every chip, as Clear does. Clear hides itself, so focus goes to the first chip
// rather than being lost. An empty result's own Clear button calls this too.
export function clearAll(group: HTMLElement): void {
  setPressed(group, []);
  chips(group)[0]?.focus();
  changed(group);
}

// Attaches to every [data-cap="chips"] under root that is not attached yet. With
// data-param, the group reads its starting state from the address and writes it back.
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>("[data-cap='chips']:not([data-cap-ready])")) {
    group.dataset.capReady = "";
    const param = group.dataset.param;
    const fromAddress = param ? readParam(location.search, param) : null;
    if (fromAddress) setPressed(group, fromAddress);
    else syncClear(group);

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const chip = target.closest<HTMLButtonElement>(".cap-chip");
      if (chip && group.contains(chip)) {
        toggle(group, chip);
        return;
      }
      const clear = target.closest<HTMLElement>("[data-cap-part='clear']");
      if (clear && group.contains(clear)) clearAll(group);
    };
    group.addEventListener("click", onClick);
    undo.push(() => {
      group.removeEventListener("click", onClick);
      delete group.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
