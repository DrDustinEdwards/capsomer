// Mounts the React record facts: the same contract as the HTML specimens, one fact without a value.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RecordFacts } from "./record-facts.react.tsx";

const host = document.querySelector<HTMLElement>('[data-mount="react"]');
if (host)
  createRoot(host).render(
    <StrictMode>
      <RecordFacts
        facts={[
          { label: "Year", value: "2026" },
          { label: "Stage", value: "submitted" },
          { label: "Journal", value: null },
          {
            label: "DOI",
            value: "10.5555/example.2026.014",
            href: "https://doi.org/10.5555/example.2026.014",
            mono: true,
          },
          { label: "Kind", value: "annual report" },
        ]}
      />
    </StrictMode>,
  );
