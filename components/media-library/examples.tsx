// Mounts the specimens: MediaLibrary as a host would hold it, with a small in-memory site standing
// in for the content kit, and a stand-in router (links and GET forms inside a specimen change its
// query in place), so every action can be tried on one page. The kit's words here are a
// specimen's, not a contract.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { MediaRecord } from "../media/media.ts";
import { MessageProvider } from "../message/message.react.tsx";
import { MediaLibrary } from "./media-library.react.tsx";
import { ImageField } from "./media-picker.react.tsx";
import { type KitMediaChanges, type KitMediaRow } from "./media-library.ts";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";
import {
  NONE,
  thumb,
  FILES,
  GROUPED,
  OFFERS,
  bytesOf,
  load,
  IDEA_OFFERS,
  IDEAS,
  loadIdeas,
} from "./examples-data.ts";
import { useRouter, useSite } from "./examples-site.tsx";

function Editor() {
  const { files, submit } = useSite();
  const { query, Form, onClickCapture } = useRouter({});
  return (
    <div onClickCapture={onClickCapture}>
      <MediaLibrary
        data={load(files, query)}
        action="/media"
        Form={Form}
        submit={submit}
        inspector="autosave"
        search={async (text) =>
          files.filter(
            (f) => f.state !== "binned" && f.name.toLowerCase().includes(text.toLowerCase()),
          )
        }
        bytesHref={bytesOf}
      />
    </div>
  );
}

// A site whose replace must keep the picture's size (site-api v0.11.0 mediaReplaceKeepsSize), in form
// mode as Carrel shows it: replace asks for the same size, and a crop is only ever a new file.
function KeepsSize() {
  const { files, submit } = useSite();
  const { query, Form, onClickCapture } = useRouter({ inspect: "2026/09/launch-hero.png" });
  return (
    <div onClickCapture={onClickCapture}>
      <MediaLibrary
        data={load(files, query, { offers: { ...OFFERS, replaceKeepsSize: true } })}
        action="/media"
        Form={Form}
        submit={submit}
        bytesHref={bytesOf}
        shortcuts={false}
      />
    </div>
  );
}

// The picked file with the site's model asked (`suggest`): the host loaded the kit's detail for it.
function PickerSuggest() {
  const key = "2026/09/uptime-strip.png";
  const suggestions = {
    tags: [],
    alt: "A row of green bars with two short red gaps",
    model: "@cf/example/vision",
  };
  return (
    <MediaLibrary
      data={load(
        FILES,
        { pick: key, inspect: key, suggest: true },
        { extra: undefined, offers: IDEA_OFFERS, suggestions },
      )}
      action="/media"
      mode="picker"
      onPick={() => {}}
    />
  );
}

function Picker() {
  const { query, Form, onClickCapture } = useRouter({});
  return (
    <div onClickCapture={onClickCapture}>
      <MediaLibrary
        data={load(FILES, query, { extra: undefined })}
        action="/media"
        Form={Form}
        mode="picker"
        onPick={(p) => {
          const out = document.getElementById("picked");
          if (out) out.textContent = `Picked ${p.id} with alt text “${p.alt}”.`;
        }}
      />
    </div>
  );
}

// What the site would answer to loadMediaChanges: the test (or a person at the console) queues a
// change with mediaChange(key, alt) or mediaRemove(key).
const pending: KitMediaChanges = { rows: [], removed: [], changeCursor: "c0", more: false };
const kitRow = (r: MediaRecord): KitMediaRow => ({
  id: r.key,
  url: r.url,
  src: r.thumb ?? r.url,
  filename: r.name,
  contentType: r.type,
  bytes: r.bytes,
  width: r.width ?? null,
  height: r.height ?? null,
  alt: r.alt,
  uploadedAt: r.uploaded ?? null,
  version: `${r.version}-live`,
  tags: r.tags,
  trashedAt: null,
  ...(r.usedCount != null ? { usedCount: r.usedCount } : {}),
});
Object.assign(window, {
  mediaChange: (key: string, alt: string) => {
    const r = IDEAS.find((f) => f.key === key);
    if (r) pending.rows.push({ ...kitRow(r), alt });
  },
  mediaRemove: (key: string) => pending.removed.push(key),
});

function Ideas() {
  const { files, submit } = useSite(IDEAS, true);
  const { query, Form, onClickCapture } = useRouter({ inspect: "2026/10/bay-dusk.png" });
  return (
    <div onClickCapture={onClickCapture}>
      <MediaLibrary
        data={loadIdeas(files, query)}
        action="/media"
        Form={Form}
        submit={submit}
        shortcuts={false}
        changes={async (cursor) => {
          const answer: KitMediaChanges = {
            rows: pending.rows.splice(0),
            removed: pending.removed.splice(0),
            changeCursor: `${cursor}+`,
            more: false,
          };
          return answer;
        }}
      />
    </div>
  );
}

const reader = load(
  FILES,
  {},
  {
    offers: { upload: null, alt: false, tags: false, trash: false, delete: false },
    can: NONE,
    extra: undefined,
  },
);

const mounts: Record<string, () => ReactNode> = {
  editor: () => (
    <MessageProvider>
      <Editor />
    </MessageProvider>
  ),
  form: () => (
    <MediaLibrary
      data={load(FILES, { inspect: "2026/09/uptime-strip.png" })}
      action="/media"
      shortcuts={false}
    />
  ),
  trash: () => (
    <MediaLibrary
      data={load(FILES, { view: "trash", layout: "list" })}
      action="/media"
      shortcuts={false}
    />
  ),
  grouped: () => (
    <MediaLibrary
      data={load(GROUPED, { group: "folder", size: "s" })}
      action="/media"
      shortcuts={false}
    />
  ),
  "keeps-size": () => <KeepsSize />,
  "by-month": () => (
    <MediaLibrary
      data={load(
        GROUPED,
        { group: "month", layout: "list", sort: "size" },
        { page: { nextCursor: null, sortedOnPage: true } },
      )}
      action="/media"
      shortcuts={false}
    />
  ),
  limited: () => <MediaLibrary data={reader} action="/media" shortcuts={false} />,
  picker: () => <Picker />,
  "picker-suggest": () => <PickerSuggest />,
  "picker-step": () => (
    <MediaLibrary
      data={load(FILES, { pick: "2026/09/uptime-strip.png" }, { extra: undefined })}
      action="/media"
      mode="picker"
    />
  ),
  "empty-trash": () => (
    <MediaLibrary
      data={load(
        FILES.filter((f) => f.state !== "binned"),
        { view: "trash" },
        { extra: undefined },
      )}
      action="/media"
      shortcuts={false}
    />
  ),
  ideas: () => (
    <MessageProvider>
      <Ideas />
    </MessageProvider>
  ),
  "empty-match": () => (
    <MediaLibrary
      data={load(FILES, { q: "lighthouse" }, { extra: undefined })}
      action="/media"
      shortcuts={false}
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("media-static");
if (staticHost)
  setStaticHtml(
    staticHost,
    renderToStaticMarkup(
      <MediaLibrary
        data={load(FILES, { inspect: "2026/09/launch-hero.png" })}
        action="/media"
        shortcuts={false}
      />,
      { identifierPrefix: "static" },
    ),
  );

const ideasHost = document.getElementById("media-ideas-static");
if (ideasHost)
  setStaticHtml(
    ideasHost,
    renderToStaticMarkup(
      <MediaLibrary
        data={loadIdeas(IDEAS, { inspect: "2026/10/bay-dusk.png", lens: "oversized" })}
        action="/media"
        shortcuts={false}
      />,
      { identifierPrefix: "ideas" },
    ),
  );

const uploadHost = document.getElementById("media-upload-static");
if (uploadHost)
  setStaticHtml(
    uploadHost,
    renderToStaticMarkup(
      <MediaLibrary data={loadIdeas(IDEAS, { upload: true })} action="/media" shortcuts={false} />,
      { identifierPrefix: "upload" },
    ),
  );

const fieldHost = document.getElementById("media-image-field");
if (fieldHost)
  createRoot(fieldHost).render(
    <StrictMode>
      <div style={{ display: "grid", gap: "var(--space-6)" }}>
        <ImageField
          label="Share image"
          value="/media/2026/09/launch-hero.png"
          src={thumb("#4a6b8a")}
          alt="A blue tile with a pale circle"
          picker={{ endpoint: "/media/api" }}
          onPick={() => {}}
          onRemove={() => {}}
        />
        <ImageField
          label="Feature image"
          value=""
          none="No feature image"
          picker={{ endpoint: "/media/api" }}
          onPick={() => {}}
        />
      </div>
    </StrictMode>,
  );
