// Mounts the secret reveal specimen. The key is made up.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SecretReveal } from "./secret-reveal.react.tsx";

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='key']")) {
  createRoot(el).render(
    <StrictMode>
      <SecretReveal
        title="Your new API key"
        secret="sample_live_4f9c2a7e1b8d6035c4e2f1a9b7d3e5c8"
        focusOnShow={false}
        copy={
          <button type="button" className="cap-btn" data-size="sm">
            Copy key
          </button>
        }
      />
    </StrictMode>,
  );
}
