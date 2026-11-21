// Mounts the specimens over the markup drawn when the page was built (examples.build.ts), so the
// page reads with scripts off; the live component replaces it.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { mounts } from "./specimen/mounts.tsx";

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
