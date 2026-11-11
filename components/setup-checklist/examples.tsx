// Mounts the setup checklist specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SetupChecklist, type SetupStep } from "./setup-checklist.react.tsx";

const go = (label: string) => (
  <a className="cap-btn" data-size="sm" href="#settings">
    {label}
  </a>
);
const steps = (done: boolean[]): SetupStep[] => [
  {
    id: "connect",
    title: "Connect your payment account",
    detail: "So failed payments are found as they happen",
    done: done[0],
    action: (
      <a className="cap-btn" data-variant="primary" data-size="sm" href="#connect">
        Connect
      </a>
    ),
  },
  {
    id: "sender",
    title: "Set your sender name",
    detail: "Customers see this name in your emails",
    done: done[1],
    action: go("Go to settings"),
  },
  {
    id: "alerts",
    title: "Set your notification email",
    detail: "You get an email when a payment is recovered",
    done: done[2],
    action: go("Go to settings"),
  },
];
const ready = {
  title: "You're ready",
  detail: "Failed payments are now found and recovered for you",
};

const SPECIMENS: Record<string, () => ReactNode> = {
  started: () => <SetupChecklist steps={steps([true, false, false])} ready={ready} />,
  done: () => <SetupChecklist steps={steps([true, true, true])} ready={ready} />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
