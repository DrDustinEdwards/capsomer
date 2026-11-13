// Mounts the row with a reply: a blocked job answered in place.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Status } from "../status/status.react.tsx";
import { Row, RowList, RowReply } from "./row-list.react.tsx";

function Blocked() {
  const [replying, setReplying] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <RowList label="Waiting for you">
      <Row
        title="Release sample/api 2.4.0"
        status={<Status tone="warn">Question</Status>}
        detail={sent ? `Sent: ${sent}` : "Asks: may it publish 2.4.0 to npm?"}
        meta="waiting 2 hours"
        actions={
          replying ? undefined : (
            <button
              type="button"
              className="cap-btn"
              aria-label="Answer Release sample/api 2.4.0"
              onClick={() => setReplying(true)}
            >
              Answer
            </button>
          )
        }
        reply={
          replying ? (
            <RowReply
              label="Your answer, sent to its driver"
              emptyHint="Write your answer first."
              onSend={(text) => {
                setSent(text);
                setReplying(false);
              }}
              onCancel={() => setReplying(false)}
            />
          ) : undefined
        }
      />
    </RowList>
  );
}

const el = document.querySelector<HTMLElement>("[data-mount='reply']");
if (el)
  createRoot(el).render(
    <StrictMode>
      <Blocked />
    </StrictMode>,
  );
