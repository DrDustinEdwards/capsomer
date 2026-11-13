// Mounts the form status specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { FormStatus } from "./form-status.react.tsx";

const SPECIMENS: Record<string, () => ReactNode> = {
  ok: () => <FormStatus focus={false} status={{ ok: true, message: "Your abstract was saved." }} />,
  fail: () => (
    <FormStatus
      focus={false}
      status={{ ok: false, message: "The title is empty. Write a title, then save again." }}
    />
  ),
  none: () => <FormStatus status={null} />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
