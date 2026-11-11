// Mounts the share row with every service.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShareRow } from "./share-row.react.tsx";

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  createRoot(el).render(
    <StrictMode>
      <ShareRow
        url="https://example.com/spring-update"
        title="Spring update"
        targets={["x", "linkedin", "bluesky", "facebook", "email"]}
      />
    </StrictMode>,
  );
}
