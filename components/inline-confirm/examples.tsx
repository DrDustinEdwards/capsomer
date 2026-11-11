// Mounts the inline confirm specimens.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InlineConfirm } from "./inline-confirm.react.tsx";

const row = (name: string, open: boolean) => (
  <li key={name} className="cap-row-specimen">
    <span>{name}</span>
    <InlineConfirm
      label="Remove member"
      labelDetail={` ${name}`}
      question={`Remove ${name}?`}
      confirmLabel="Yes, remove member"
      openHref={`?confirm=${encodeURIComponent(name)}`}
      closeHref="?"
      defaultOpen={open}
      action="#"
    >
      <input type="hidden" name="_action" value="remove" />
    </InlineConfirm>
  </li>
);

const MOUNTS = {
  rows: <>{[row("Alex Rivera", false), row("Sam Lee", true)]}</>,
  pending: (
    <InlineConfirm
      label="Accept dispute"
      question="Accepting concedes the dispute and cannot be undone."
      confirmLabel="Yes, accept"
      pendingLabel="Accepting…"
      openHref="?confirm=accept"
      closeHref="?"
      defaultOpen
      pending
      action="#"
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = MOUNTS[el.dataset.mount as keyof typeof MOUNTS];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
