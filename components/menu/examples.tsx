// Mounts the menu specimens. Every element with data-mount="<state>" gets that state. The
// open states sit in <template data-specimen> frames of their own.
import { StrictMode, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Menu, type MenuEntry } from "./menu.react.tsx";

// A menu whose items write what was chosen beside it, so a test can read it.
function Logged({ entries, defaultOpen, label = "Actions" }: { entries: (log: (s: string) => void) => MenuEntry[]; defaultOpen?: boolean; label?: string }) {
  const [last, setLast] = useState("");
  return (
    <>
      <Menu label={label} items={entries(setLast)} defaultOpen={defaultOpen} />
      <p className="cap-muted" data-chosen={last}>
        Last chosen: {last || "nothing"}
      </p>
    </>
  );
}

const plain = (log: (s: string) => void): MenuEntry[] => [
  { label: "Open site", shortcut: "O", onSelect: () => log("Open site") },
  { label: "Copy address", onSelect: () => log("Copy address") },
  "separator",
  { label: "Run checks now", shortcut: "Shift+R", onSelect: () => log("Run checks now") },
  { label: "Pause checks", onSelect: () => log("Pause checks") },
];

// Every feature at once, in the order an app might write it: the danger item comes first
// here and the menu moves it to the end.
const full = (log: (s: string) => void): MenuEntry[] => [
  { label: "Delete site", danger: true, onSelect: () => log("Delete site") },
  { label: "Open site", shortcut: "O", onSelect: () => log("Open site") },
  { label: "Duplicate settings", onSelect: () => log("Duplicate settings") },
  "separator",
  { label: "Archive", disabled: true, reason: "Not while a deploy runs. Try again when it ends.", onSelect: () => log("Archive") },
  { label: "Run checks now", shortcut: "Shift+R", onSelect: () => log("Run checks now") },
];

const disabled = (log: (s: string) => void): MenuEntry[] => [
  { label: "Open site", onSelect: () => log("Open site") },
  { label: "Archive", disabled: true, reason: "Not while a deploy runs. Try again when it ends.", onSelect: () => log("Archive") },
  { label: "Run checks now", onSelect: () => log("Run checks now") },
];

const danger = (log: (s: string) => void): MenuEntry[] => [
  { label: "Open site", onSelect: () => log("Open site") },
  { label: "Remove from the watcher", danger: true, onSelect: () => log("Remove from the watcher") },
  { label: "Copy address", onSelect: () => log("Copy address") },
  { label: "Delete site", danger: true, onSelect: () => log("Delete site") },
];

// Highlights the first item the way a keyboard does, for the static picture. The spec
// checks the real keys.
function Highlighted() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const popup = document.querySelector<HTMLElement>(".cap-menu");
      popup?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div ref={ref}>
      <Logged entries={plain} defaultOpen />
    </div>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  closed: () => <Logged entries={full} label="Actions for foxhound.app" />,
  open: () => <Logged entries={plain} defaultOpen />,
  highlighted: () => <Highlighted />,
  disabled: () => <Logged entries={disabled} defaultOpen />,
  danger: () => <Logged entries={danger} defaultOpen />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
