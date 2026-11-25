// Mounts the React specimen of a form action's result: the button answers with an error or a success and the line that says it takes focus.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { FormStatus, useActionStatus } from "../form-status/form-status.react.tsx";

type Answer = { error: string } | { ok: string } | { ok: true } | undefined;

function Form() {
  const [answer, setAnswer] = useState<Answer>(undefined);
  return (
    <div className="message-sample">
      <FormStatus status={useActionStatus(answer)} />
      <div className="message-sample-row">
        {/* A new object each time, as every action answer is, so the same words are said again. */}
        <button
          type="button"
          className="cap-btn"
          onClick={() => setAnswer({ ok: "Session saved." })}
        >
          Save session
        </button>
        <button
          type="button"
          className="cap-btn"
          onClick={() => setAnswer({ error: "Choose a room for the session." })}
        >
          Save without a room
        </button>
        <button type="button" className="cap-btn" onClick={() => setAnswer({ ok: true })}>
          Move session up
        </button>
      </div>
    </div>
  );
}

const mount = document.querySelector("[data-mount='action']");
if (mount)
  createRoot(mount).render(
    <StrictMode>
      <Form />
    </StrictMode>,
  );
