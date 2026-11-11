// Mounts the React specimen of the result of a form action: a form whose button answers with an
// error or a success, as a React Router action would, and the line that says it, which takes
// focus. The page holds the answer, as useActionData() would.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ActionResult } from "./message.react.tsx";

type Answer = { error: string } | { ok: string } | { ok: true } | undefined;

function Form() {
  const [answer, setAnswer] = useState<Answer>(undefined);
  return (
    <div className="message-sample">
      <ActionResult data={answer} />
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
