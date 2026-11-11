// The React Calculator, embedded: typing recomputes from React state and leaves the address alone.
import { createRoot } from "react-dom/client";
import { Calculator } from "./calculator.react.tsx";
import { FIELDS, runTransfer } from "./specimen/transfer.ts";

const host = document.querySelector<HTMLElement>("[data-mount='react']");
if (host) {
  createRoot(host).render(
    <Calculator
      id="react"
      action="./states.html"
      fields={FIELDS}
      values={{ visits: "40000", weight: "900" }}
      run={runTransfer}
      embedded
    >
      <p>
        <a href="https://example.com/tools/transfer">
          Open the transfer calculator on its own page
        </a>
      </p>
    </Calculator>,
  );
}
