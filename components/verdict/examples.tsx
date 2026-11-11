// Mounts the verdict specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Verdict } from "./verdict.react.tsx";

const link = (href: string, words: string) => <a href={href}>{words}</a>;

const SPECIMENS: Record<string, () => ReactNode> = {
  ok: () => (
    <Verdict
      problems={[]}
      okNote="Sites, backups and default branches were fine on the last pass."
    />
  ),
  problems: () => (
    <Verdict
      problems={[
        {
          key: "a",
          tone: "crit",
          label: link("#backup", "No backup from example.com in 31 hours"),
        },
        { key: "b", label: link("#ci", "CI red on sample/api") },
        { key: "c", label: link("#cert", "A certificate renews in 6 days") },
        { key: "d", label: link("#d", "Queue waiting") },
        { key: "e", label: link("#e", "Drift on docs") },
      ]}
      more={(n) => link("#needs", `${n} more`)}
    />
  ),
  one: () => <Verdict problems={[{ key: "a", label: link("#ci", "CI red on sample/api") }]} />,
  unknown: () => <Verdict problems={[]} unknown="The watcher has not reported since 09:00." />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
