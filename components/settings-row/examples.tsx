// Mounts the settings-row specimens.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { SettingsLayout, SettingsRow, SwitchRow } from "./settings-row.react.tsx";

function Rows() {
  const [digest, setDigest] = useState(true);
  return (
    <section className="cap-panel">
      <div className="cap-panel-body">
        <form id="sr-toggle" method="post" action="#" onSubmit={(e) => e.preventDefault()} />
        <SwitchRow
          label="Weekly digest"
          help="A summary of the week every Monday."
          checked={digest}
          onCheckedChange={setDigest}
        />
        <SwitchRow
          name="alerts"
          label="Failure alerts"
          help="An email the moment a check fails."
          defaultChecked
          form="sr-toggle"
          submitOnChange
        />
        <SwitchRow
          name="auto"
          label="Send without review"
          help="Sends drafts the checks pass."
          disabledReason="Only the account owner can change this."
        />
        <SettingsRow label="Time zone" help="Dates in emails use it.">
          {({ labelId, helpId }) => (
            <select className="cap-input" aria-labelledby={labelId} aria-describedby={helpId}>
              <option>UTC</option>
              <option>America/Chicago</option>
            </select>
          )}
        </SettingsRow>
      </div>
    </section>
  );
}

const MOUNTS = {
  rows: <Rows />,
  page: (
    <SettingsLayout
      title="Notifications"
      lead="What we email you, and when."
      back={{ href: "#settings", label: "Settings" }}
    >
      <p>The page's rows.</p>
    </SettingsLayout>
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = MOUNTS[el.dataset.mount as keyof typeof MOUNTS];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
