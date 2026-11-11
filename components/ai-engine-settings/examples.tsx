// Mounts the specimens: AiEngineSettings on invented settings, jobs and spend. The forms post
// nowhere.
import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { FormComponent } from "../content/content.react.tsx";
import { AiEngineSettings, type EngineJob } from "./ai-engine-settings.react.tsx";

const JOBS: EngineJob[] = [
  {
    key: "social",
    label: "Social post drafts",
    note: "The subscription drafts every waiting post in one run. The API drafts them in the same pass.",
  },
  { key: "seo", label: "Search title and description" },
  {
    key: "continue",
    label: "Continue my draft",
    note: "A draft beside yours. Starts on the subscription and uses the API when it is refused.",
  },
];
const MODELS = [
  { value: "", label: "The job's own default" },
  { value: "fast", label: "Fast ($1 in / $5 out per million tokens)" },
  { value: "standard", label: "Standard ($3 in / $15 out per million tokens)" },
  { value: "deep", label: "Deep ($15 in / $75 out per million tokens)" },
];
const Quiet: FormComponent = (props) => <form {...props} onSubmit={(e) => e.preventDefault()} />;

const mounts: Record<string, () => ReactElement> = {
  settings: () => (
    <AiEngineSettings
      settings={{
        master: "auto",
        features: { social: "api" },
        override: null,
        apiCapMicros: 20_000_000,
      }}
      models={{ social: "fast" }}
      jobs={JOBS}
      modelOptions={MODELS}
      ready={{ subscription: true, api: true }}
      spentMicros={4_180_000}
      usage={[
        { job: "social", calls: 42, micros: 3_900_000 },
        { job: "seo", calls: 3, micros: 280_000 },
      ]}
      Form={Quiet}
    />
  ),
  override: () => (
    <AiEngineSettings
      settings={{
        master: "subscription",
        features: {},
        override: { engine: "api", until: "2026-11-14T12:00:00Z" },
        apiCapMicros: 0,
      }}
      models={{}}
      jobs={JOBS.slice(0, 1)}
      modelOptions={MODELS}
      ready={{ subscription: false, api: true }}
      readyNote="Until the subscription's routine is connected, Subscription drafts nothing and Automatic uses the API."
      spentMicros={0}
      usage={[]}
      Form={Quiet}
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
