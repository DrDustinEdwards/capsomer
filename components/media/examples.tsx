// Mounts the React specimen: MediaGrid and MediaInspector as an app would hold them, with the
// active file, the selection and the saves in state. Every element with data-mount="react" gets it.
import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MediaGrid, MediaInspector, useMediaMode, type MediaFields, type MediaRecord } from "./media.react.tsx";

const thumb = (fill: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><rect width='320' height='320' fill='${fill}'/><circle cx='160' cy='160' r='70' fill='white' opacity='.6'/></svg>`)}`;

const ITEMS: MediaRecord[] = [
  { key: "media/foxhound-hero.jpg", name: "foxhound-hero.jpg", url: "https://dustinedwards.info/media/foxhound-hero.jpg", thumb: thumb("#b29ae3"), kind: "image", type: "image/jpeg", bytes: 421888, width: 1600, height: 900, uploaded: "2026-09-18", alt: "The Foxhound dashboard", altState: "set", title: "", caption: "", tags: ["release"], used: [{ title: "Notes on the Foxhound release", href: "/admin/posts/foxhound-release/edit", how: "cover" }], state: "ready", suggestedTags: ["2026"] },
  { key: "media/uptime-strip.png", name: "uptime-strip.png", url: "https://dustinedwards.info/media/uptime-strip.png", thumb: thumb("#7fc4c0"), kind: "image", type: "image/png", bytes: 98304, width: 1200, height: 300, uploaded: "2026-09-16", alt: "", altState: "missing", title: "", caption: "", tags: [], used: [], state: "ready" },
  { key: "media/uptime-report-september.pdf", name: "uptime-report-september.pdf", url: "https://dustinedwards.info/media/uptime-report-september.pdf", kind: "document", type: "application/pdf", bytes: 1887436, uploaded: "2026-09-30", alt: "", altState: "missing", title: "", caption: "", tags: ["reports"], used: [{ title: "What a mention queue is for", href: "/admin/posts/mention-queue/edit", how: "linked" }], state: "ready" },
  { key: "media/capsid-walkthrough.png", name: "capsid-walkthrough.png", url: "", thumb: thumb("#d8c9f5"), kind: "image", type: "image/png", bytes: 3355443, alt: "", altState: "missing", title: "", caption: "", tags: [], used: [], state: "uploading", progress: 62 },
  { key: "media/scan-0042.png", name: "scan-0042.png", url: "", kind: "image", type: "image/png", bytes: 6291456, alt: "", altState: "missing", title: "", caption: "", tags: [], used: [], state: "failed", error: "The file is 6 MB and the limit is 5 MB." },
  { key: "media/old-logo.png", name: "old-logo.png", url: "https://dustinedwards.info/media/old-logo.png", thumb: thumb("#cfc8dc"), kind: "image", type: "image/png", bytes: 40960, width: 512, height: 512, uploaded: "2026-08-02", alt: "The previous logo", altState: "set", title: "", caption: "", tags: [], used: [], state: "binned" },
];

interface Win {
  failReactSave?: boolean;
  reactSaves: Array<{ key: string; fields: MediaFields }>;
}

function Demo() {
  const [items, setItems] = useState(ITEMS);
  const [active, setActive] = useState(ITEMS[0]?.key ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [inspecting, setInspecting] = useState(true);
  const layout = useRef<HTMLDivElement>(null);
  const inspector = useRef<{ focus: () => void }>(null);
  const mode = useMediaMode(layout);
  const current = items.find((i) => i.key === active) ?? null;
  const ready = items.filter((i) => i.state === "ready");
  const w = window as unknown as Win;
  w.reactSaves ??= [];

  const save = async (key: string, fields: MediaFields) => {
    await new Promise((r) => setTimeout(r, 60));
    w.reactSaves.push({ key, fields });
    if (w.failReactSave) throw new Error("The server answered 502.");
    setItems((all) => all.map((i) => (i.key === key ? { ...i, alt: fields.alt, altState: fields.decorative ? "decorative" : fields.alt ? "set" : "missing", title: fields.title, caption: fields.caption, tags: fields.tags } : i)));
  };

  return (
    <div className="cap-media" data-size="m">
      <div className="cap-media-layout" ref={layout}>
        <div className="cap-media-main">
          <MediaGrid items={items.filter((i) => i.state !== "binned")} activeKey={active} onActiveChange={setActive} selected={selected} onSelectedChange={setSelected} onOpen={() => {
              setInspecting(true);
              requestAnimationFrame(() => inspector.current?.focus());
            }} inspecting={inspecting} label="Files" onRestore={() => undefined} />
          <p className="cap-media-count" role="status">
            {ready.length} files, {selected.length} selected
          </p>
        </div>
        <MediaInspector
          ref={inspector}
          id="react-ins"
          item={current}
          open={inspecting}
          mode={mode}
          onSave={save}
          onClose={() => setInspecting(false)}
          onStep={(dir) => {
            const keys = items.filter((i) => i.state === "ready").map((i) => i.key);
            const at = keys.indexOf(active);
            const next = keys[at + (dir === "next" ? 1 : -1)];
            if (next) setActive(next);
          }}
        />
      </div>
    </div>
  );
}

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='react']")) {
  createRoot(el).render(
    <StrictMode>
      <Demo />
    </StrictMode>,
  );
}
