// The switch's behaviour: keeps the state word beside it true. The word is "On" and "Off"
// unless the .cap-switch-state element sets its own in data-on and data-off.

export function stateWord(checked: boolean, on = "On", off = "Off"): string {
  return checked ? on : off;
}

// Writes the word for one switch's current state.
export function syncWord(label: Element): void {
  const input = label.querySelector<HTMLInputElement>("input[role='switch']");
  const word = label.querySelector<HTMLElement>(".cap-switch-state");
  if (!input || !word) return;
  word.textContent = stateWord(input.checked, word.dataset.on, word.dataset.off);
}

// Moves a switch from code (an Undo, a value from the server) and keeps its word true.
// Fires no change event, so it cannot loop back into the app's own handler.
export function setSwitch(label: Element, checked: boolean): void {
  const input = label.querySelector<HTMLInputElement>("input[role='switch']");
  if (!input) return;
  input.checked = checked;
  syncWord(label);
}

// Marks a switch pending while a request for its change runs (aria-busy, drawn as a dashed
// outline), and clears it when the request has answered. The switch is not disabled, so
// focus stays where it is.
export function setBusy(label: Element, busy: boolean): void {
  const input = label.querySelector<HTMLInputElement>("input[role='switch']");
  if (!input) return;
  if (busy) input.setAttribute("aria-busy", "true");
  else input.removeAttribute("aria-busy");
}

// Attaches to every [data-cap="switch"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const label of root.querySelectorAll<HTMLElement>("[data-cap='switch']:not([data-cap-ready])")) {
    label.dataset.capReady = "";
    syncWord(label);
    const onChange = () => syncWord(label);
    label.addEventListener("change", onChange);
    undo.push(() => {
      label.removeEventListener("change", onChange);
      delete label.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
