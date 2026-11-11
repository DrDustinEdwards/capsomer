// Mounts the sample ad at both sizes.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorAd } from "./error-ad.react.tsx";
import { SAMPLE } from "./specimen/sample-ad.ts";

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  createRoot(el).render(
    <StrictMode>
      <ErrorAd ad={SAMPLE} size={el.dataset.mount === "large" ? "large" : "corner"} />
    </StrictMode>,
  );
}
