// Mounts the React specimen: Authorship and Run, whose summary counts the words under each Run.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Authorship, Run } from "./authorship.react.tsx";

function Sample() {
  return (
    <Authorship remember={false}>
      <Run kind="you" block>
        <p>The mention queue came first. I wrote the first version in one evening.</p>
      </Run>
      <p>
        <Run kind="you">I asked the agent for a tidier name, </Run>
        <Run kind="ai">and it suggested the queue be called the inbox. </Run>
        <Run kind="you">I kept queue.</Run>
      </p>
      <Run kind="quoted" block>
        <p>Every mention is untrusted until a person has looked at it.</p>
      </Run>
    </Authorship>
  );
}

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='react']")) {
  createRoot(el).render(
    <StrictMode>
      <Sample />
    </StrictMode>,
  );
}
