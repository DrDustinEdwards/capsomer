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
        <SwitchRow label="Weekly digest" checked={digest} onCheckedChange={setDigest} />
        <SwitchRow
          name="alerts"
          label="Failure alerts"
          defaultChecked
          form="sr-toggle"
          submitOnChange
        />
        <SwitchRow
          name="auto"
          label="Send without review"
          disabledReason="Only the account owner can change this."
        />
        <SettingsRow label="Time zone">
          {({ labelId }) => (
            <select className="cap-input" aria-labelledby={labelId}>
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
    <SettingsLayout title="Notifications" back={{ href: "#settings", label: "Settings" }}>
      <p>The page's rows.</p>
    </SettingsLayout>
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = MOUNTS[el.dataset.mount as keyof typeof MOUNTS];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
