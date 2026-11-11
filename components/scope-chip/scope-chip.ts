// The scope chip's behavior for a page with no React: choosing submits the form at once, and the
// Show button (there for a page with no script) is hidden. React's ScopeChip does the same itself.

export function enhance(root: ParentNode = document): () => void {
  const off: Array<() => void> = [];
  for (const form of root.querySelectorAll<HTMLFormElement>(
    'form[data-cap="scope-chip"]:not([data-cap-ready])',
  )) {
    const select = form.querySelector<HTMLSelectElement>("select");
    if (!select) continue;
    const change = () => form.requestSubmit();
    select.addEventListener("change", change);
    form.dataset.capReady = "";
    off.push(() => {
      select.removeEventListener("change", change);
      delete form.dataset.capReady;
    });
  }
  return () => off.forEach((f) => f());
}
