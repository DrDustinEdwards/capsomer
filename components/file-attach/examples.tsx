// Mounts the file attach specimens.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FileAttach } from "./file-attach.react.tsx";

const FILES = [
  { id: "f1", name: "shipping-receipt.pdf", href: "#f1", meta: "Nov 3" },
  { id: "f2", name: "customer-emails.png", href: "#f2", meta: "Nov 4" },
];
const remove = (f: { name: string }) => (
  <button type="button" className="cap-btn" data-size="sm" data-variant="quiet">
    Remove file<span className="cap-sr-only"> {f.name}</span>
  </button>
);

const MOUNTS = {
  files: (
    <FileAttach
      files={FILES}
      accept=".pdf,.png,.jpg"
      maxBytes={4_500_000}
      maxFiles={5}
      renderRemove={remove}
    />
  ),
  pending: <FileAttach files={[]} accept=".pdf" pending />,
  off: (
    <FileAttach
      files={FILES.slice(0, 1)}
      unavailable="Files cannot be changed once the evidence is submitted."
      error="The file could not be removed. Try again."
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = MOUNTS[el.dataset.mount as keyof typeof MOUNTS];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
