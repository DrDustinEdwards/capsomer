// Mounts the read-only form specimen.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReadOnlyForm } from "./read-only-form.react.tsx";

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='demo']")) {
  createRoot(el).render(
    <StrictMode>
      <ReadOnlyForm
        readOnly
        message="This is a demo: changes are not saved."
        method="post"
        action="#"
      >
        <div className="cap-field">
          <label className="cap-field-label" htmlFor="ro-name">
            Display name
          </label>
          <input className="cap-input" id="ro-name" name="name" defaultValue="Example Co" />
        </div>
        <p>
          <button type="submit" className="cap-btn" data-variant="primary">
            Save
          </button>
        </p>
      </ReadOnlyForm>
    </StrictMode>,
  );
}
