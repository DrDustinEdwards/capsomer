// Mounts the specimens: AiJobButtons with a stand-in route that answers in memory.
import { StrictMode, useMemo, useState, type FormEvent, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { AiJobButtons, type AiJobAnswer, type FormComponent } from "./ai-job-buttons.react.tsx";

const BUTTONS = [
  { job: "continue", label: "Continue my draft" },
  { job: "edit", label: "Suggest edits" },
];
const FIELDS = { path: "drafts/spring-update.md" };

function Live() {
  const [answer, setAnswer] = useState<AiJobAnswer | null>(null);
  // One form component for the life of the specimen, so a new answer does not remount the forms.
  const SpecimenForm = useMemo<FormComponent>(
    () => (props) => (
      <form
        {...props}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          const job = String(data.get("job"));
          const engine = data.get("engine") === "api" ? "api" : "subscription";
          setAnswer(
            engine === "api"
              ? { job, engine, message: "A draft is saved beside yours.", href: "#draft" }
              : {
                  job,
                  engine,
                  message:
                    "Sent to the subscription's routine. Its draft arrives in a few minutes.",
                },
          );
        }}
      />
    ),
    [],
  );
  return (
    <AiJobButtons
      action="#"
      buttons={BUTTONS}
      fields={FIELDS}
      Form={SpecimenForm}
      answer={answer}
    />
  );
}

const mounts: Record<string, () => ReactElement> = {
  live: () => <Live />,
  done: () => (
    <AiJobButtons
      action="#"
      buttons={BUTTONS}
      answer={{
        job: "continue",
        engine: "subscription",
        message: "A draft is saved beside yours.",
        href: "#draft",
      }}
    />
  ),
  error: () => (
    <AiJobButtons
      action="#"
      buttons={BUTTONS}
      answer={{
        job: "edit",
        engine: "api",
        error: "The API is at this month's cap, so it did not run.",
      }}
    />
  ),
  pending: () => <AiJobButtons action="#" buttons={BUTTONS} pending />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
