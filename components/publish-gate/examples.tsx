// Mounts the React specimen: <PublishGate> holding its own checks and destination, with the
// page's own <PublishButton> beside it, as an editor bar would.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { PublishButton, PublishGate, gateStates, publishWithPreview, type GateCheck, type GateSite } from "./publish-gate.react.tsx";

const CHECKS: GateCheck[] = [
  { id: "alt", name: "Alt text", required: true, ok: false, cause: "The cover image has no alt text", pass: "Every image has alt text", href: "#react-field-alt", fix: "Describe what the image shows." },
  { id: "title", name: "Title", required: true, ok: true, cause: "The title is empty", pass: "The post has a title", href: "#react-field-title" },
  { id: "length", name: "Title length", required: false, ok: false, cause: "The title is 78 characters; the feed cuts it at 60", pass: "The title fits the feed", href: "#react-field-title", fix: "Shorten it." },
];

function Held() {
  const [checks, setChecks] = useState(CHECKS);
  const [site, setSite] = useState<GateSite>({ id: "dustinedwards", name: "dustinedwards.info" });
  const { sites } = gateStates([site], checks);
  const state = sites[site.id] ?? "ready";
  const [busy, setBusy] = useState(false);
  const publish = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 200));
    setBusy(false);
    setSite((s) => ({ ...s, published: { at: "2026-10-02T09:12:00Z", url: "https://dustinedwards.info/blog/react-post" } }));
  };
  const unpublish = async () => {
    await new Promise((r) => setTimeout(r, 200));
    setSite((s) => ({ ...s, published: undefined }));
  };
  return (
    <div className="cap-gate-bar">
      <PublishButton gateId="react-gate" site={site} state={state} busy={busy} summaryId="react-gate-sum" size="default" onPublish={() => void publishWithPreview(site, publish)} onUnpublish={() => void unpublish()} />
      <PublishGate id="react-gate" summaryId="react-gate-sum" label="Publish checks (React)" sites={[site]} checks={checks} actions="none" publish={publish} unpublish={unpublish} />
      <button type="button" className="cap-btn" data-size="sm" id="react-fix" onClick={() => setChecks((cs) => cs.map((c) => (c.id === "alt" ? { ...c, ok: !c.ok } : c)))}>
        Toggle the alt text check
      </button>
    </div>
  );
}

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='react']")) {
  createRoot(el).render(
    <StrictMode>
      <Held />
    </StrictMode>,
  );
}
