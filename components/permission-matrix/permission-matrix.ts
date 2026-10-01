// The permission matrix's behaviour: the view switch (By agent, By permission), and the
// pure helpers that turn a matrix into each view's sentences. No framework; the React
// wrapper uses the same helpers.

export type PermView = "agent" | "permission";

export interface PermAgent {
  name: string;
  // The permissions this agent holds, by name.
  holds: readonly string[];
}

export interface PermMatrix {
  // The permissions, in the order the columns show them.
  permissions: readonly string[];
  agents: readonly PermAgent[];
}

export interface Holding {
  agent: string;
  held: string[];
  text: string;
}

export interface Holders {
  permission: string;
  agents: string[];
  text: string;
}

// One entry per agent: what it holds, in column order, and the card's sentence.
export function holdings(m: PermMatrix): Holding[] {
  return m.agents.map((a) => {
    const held = m.permissions.filter((p) => a.holds.includes(p));
    return { agent: a.name, held, text: held.length ? `Holds: ${held.join(", ")}` : "Holds no permissions" };
  });
}

// One entry per permission: who holds it, in row order, and the card's sentence.
export function holders(m: PermMatrix): Holders[] {
  return m.permissions.map((p) => {
    const agents = m.agents.filter((a) => a.holds.includes(p)).map((a) => a.name);
    return { permission: p, agents, text: agents.length ? `Held by: ${agents.join(", ")}` : "Nobody holds this" };
  });
}

// Shows one view of one matrix and hides the other with the hidden attribute, so the
// hidden view leaves the accessibility tree too.
export function showView(root: HTMLElement, view: PermView): void {
  for (const el of root.querySelectorAll<HTMLElement>(".cap-perms-view[data-view]")) {
    if (el.closest("[data-cap='permission-matrix']") !== root) continue;
    el.hidden = el.dataset.view !== view;
  }
  root.dataset.current = view;
}

function isView(v: string): v is PermView {
  return v === "agent" || v === "permission";
}

// Attaches to every [data-cap="permission-matrix"] under root that is not attached yet.
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const matrix of root.querySelectorAll<HTMLElement>("[data-cap='permission-matrix']:not([data-cap-ready])")) {
    matrix.dataset.capReady = "";
    const checked = matrix.querySelector<HTMLInputElement>(".cap-perms-bar input[type='radio']:checked");
    if (checked && isView(checked.value)) showView(matrix, checked.value);

    const onChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.type !== "radio" || !input.closest(".cap-perms-bar") || !isView(input.value)) return;
      showView(matrix, input.value);
    };
    matrix.addEventListener("change", onChange);
    undo.push(() => {
      matrix.removeEventListener("change", onChange);
      delete matrix.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
