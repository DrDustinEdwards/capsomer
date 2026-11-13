// Mounts the read-only form specimen.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InlineConfirm } from "../inline-confirm/inline-confirm.react.tsx";
import { ReadOnlyForm, type FormComponent } from "./read-only-form.react.tsx";

// The read-only form bound once as an inline confirm's form: the confirm opens, and its last
// step is refused in place.
const DemoForm: FormComponent = (props) => (
  <ReadOnlyForm readOnly message="This is a demo: changes are not saved." {...props} />
);

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

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='confirm']")) {
  createRoot(el).render(
    <StrictMode>
      <InlineConfirm
        form={DemoForm}
        label="Delete account"
        question="Delete this account and everything in it?"
        confirmLabel="Delete"
        tone="danger"
        openHref="?confirm=delete"
        closeHref="?"
        defaultOpen
        action="#"
      />
    </StrictMode>,
  );
}
