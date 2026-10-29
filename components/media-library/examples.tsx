// Mounts the specimens: MediaLibrary as a host would hold it, with a small in-memory site standing
// in for the content kit, and a stand-in router (links and GET forms inside a specimen change its
// query in place), so every action can be tried on one page. The kit's words here are a
// specimen's, not a contract.
import { StrictMode, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentCan, IntentResult, MediaData, MediaQuery } from "../content/content.ts";
import type { FormComponent } from "../content/content.react.tsx";
import type { MediaRecord } from "../media/media.ts";
import { MessageProvider } from "../message/message.react.tsx";
import { MediaLibrary } from "./media-library.react.tsx";

const ALL: ContentCan = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };
const NONE: ContentCan = { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false };
const thumb = (fill: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><rect width='320' height='320' fill='${fill}'/><circle cx='160' cy='160' r='70' fill='white' opacity='.6'/></svg>`)}`;

const file = (key: string, fill: string | null, over: Partial<MediaRecord>): MediaRecord => ({
  key,
  name: key.split("/").pop() ?? key,
  url: `https://dustinedwards.info/media/${key}`,
  thumb: fill ? thumb(fill) : undefined,
  kind: fill ? "image" : "document",
  type: fill ? "image/png" : "application/pdf",
  bytes: 204800,
  width: fill ? 1600 : undefined,
  height: fill ? 900 : undefined,
  uploaded: "2026-09-30",
  alt: "",
  altState: "missing",
  title: "",
  caption: "",
  tags: [],
  used: [],
  state: "ready",
  version: "v1",
  usedUnknown: true,
  ...over,
});

const USES: Record<string, MediaRecord["used"]> = {
  "2026/09/foxhound-hero.png": [{ title: "Notes on the Foxhound release", href: "/editor/foxhound-release", how: "cover image" }],
  "2026/09/mention-queue.png": [{ title: "What a mention queue is for", href: "/editor/mention-queue", how: "image in the body" }],
  "2026/08/old-logo.png": [{ title: "About", href: "/editor/about", how: "image in the body" }],
};

const FILES: MediaRecord[] = [
  file("2026/09/foxhound-hero.png", "#b29ae3", { alt: "The Foxhound dashboard with three sites reporting healthy", altState: "set", tags: ["release", "foxhound"], bytes: 421888, focus: "0.3x0.4", caption: "Three sites, all green." }),
  file("2026/09/uptime-strip.png", "#7fc4c0", { tags: ["capsid"], bytes: 98304 }),
  file("2026/09/mention-queue.png", "#d8c9f5", { alt: "The mention queue with four mentions waiting", altState: "set", tags: ["capsid"], bytes: 207872 }),
  file("2026/09/divider.png", "#cfc8dc", { altState: "decorative", bytes: 4096 }),
  file("2026/09/uptime-report.pdf", null, { tags: ["reports"], bytes: 1887436 }),
  file("2026/08/old-logo.png", "#e9defa", { alt: "The previous logo", altState: "set", state: "binned", bytes: 40960 }),
  file("2026/08/scan-0042.png", "#ece5ff", { state: "binned", bytes: 6291456 }),
];

// Two more, in another month and another folder, for the grouped specimens.
const GROUPED: MediaRecord[] = [
  ...FILES,
  file("2026/08/phage-plaques.png", "#c9b8ef", { alt: "Clear plaques on a lawn of bacteria", altState: "set", tags: ["phage"], bytes: 1572864, uploaded: "2026-08-03" }),
  file("brand/mark.png", "#a98fdc", { alt: "The site's mark", altState: "set", bytes: 8192, uploaded: "2026-07-01" }),
];

const OFFERS: MediaData["offers"] = { upload: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp", "application/pdf"] }, alt: true, tags: true, trash: true, delete: true, lenses: ["unattached", "no-alt", "large"], focus: true, caption: true, replace: true };

// A file's own bytes, as a host serves them on its own origin for the crop editor: a PNG drawn here,
// since the tiles' pictures are SVG, which a canvas does not crop.
const pngs = new Map<string, string>();
function bytesOf(key: string): string {
  const made = pngs.get(key);
  if (made) return made;
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 900;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#b29ae3";
    ctx.fillRect(0, 0, 1600, 900);
    ctx.fillStyle = "#7fc4c0";
    ctx.fillRect(160, 120, 520, 520);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(1100, 450, 260, 0, Math.PI * 2);
    ctx.fill();
  }
  const url = c.toDataURL("image/png");
  pngs.set(key, url);
  return url;
}

// The contract's lenses and sorts, as the site would answer them (site-api v0.6.0).
const LENS: Record<string, (f: MediaRecord) => boolean> = {
  unattached: (f) => !USES[f.key]?.length,
  "no-alt": (f) => f.kind === "image" && f.altState === "missing",
  large: (f) => f.bytes > 1024 * 1024,
};
const BY: Record<string, (a: MediaRecord, b: MediaRecord) => number> = {
  added: (a, b) => (b.uploaded ?? "").localeCompare(a.uploaded ?? ""),
  name: (a, b) => a.name.localeCompare(b.name),
  size: (a, b) => b.bytes - a.bytes,
};

// What the kit's loader would give for a query over these files.
function load(files: MediaRecord[], query: MediaQuery, over: Partial<MediaData> = {}): MediaData {
  const trash = query.view === "trash";
  const inView = files.filter((f) => (trash ? f.state === "binned" : f.state !== "binned"));
  const natural = query.sort === "name" ? "asc" : "desc";
  const flip = (query.dir ?? natural) === natural ? 1 : -1;
  const rows = inView
    .filter((f) => (!query.q || f.name.includes(query.q)) && (!query.tag || f.tags.includes(query.tag)) && (!query.lens || !LENS[query.lens] || LENS[query.lens]!(f)))
    .sort((a, b) => flip * (BY[query.sort ?? "added"] ?? BY.added!)(a, b));
  const tagCounts = new Map<string, number>();
  for (const f of inView) for (const t of f.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const inspect = files.find((f) => f.key === query.inspect);
  return {
    site: { name: "dustinedwards.info" },
    query,
    rows,
    page: { nextCursor: null },
    counts: { library: files.filter((f) => f.state !== "binned").length, trash: files.filter((f) => f.state === "binned").length },
    tags: [...tagCounts].sort().map(([tag, count]) => ({ tag, count })),
    offers: OFFERS,
    can: ALL,
    inspected: inspect ? { ...inspect, used: USES[inspect.key] ?? [], usedUnknown: false } : null,
    extra: { lenses: [{ id: "no-alt", label: "No alt text", count: inView.filter((f) => f.kind === "image" && f.altState === "missing").length }] },
    ...over,
  };
}

interface Win {
  mediaLog: Array<Record<string, string | string[]>>;
}
const win = window as unknown as Win;
win.mediaLog = [];

const queryOf = (params: URLSearchParams): MediaQuery => Object.fromEntries([...params].filter(([, v]) => v)) as MediaQuery;

// The stand-in router: a GET form or a link to the library's own address changes the specimen's
// query instead of leaving the page.
function useRouter(initial: MediaQuery) {
  const [query, setQuery] = useState(initial);
  // One component for the specimen's life, so a re-render never remounts a form.
  const [Form] = useState<FormComponent>(() => (props: ComponentProps<FormComponent>) => (
    <form
      {...props}
      onSubmit={(e) => {
        props.onSubmit?.(e);
        if (e.defaultPrevented || (props.method ?? "get") !== "get") return;
        e.preventDefault();
        setQuery(queryOf(new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>)));
      }}
    />
  ));
  const onClickCapture = (e: MouseEvent) => {
    const a = (e.target as Element).closest("a[href]");
    const href = a?.getAttribute("href") ?? "";
    if (!href.startsWith("/media")) return;
    e.preventDefault();
    setQuery(queryOf(new URL(href, location.origin).searchParams));
  };
  return { query, Form, onClickCapture };
}

const fileWord = (n: number) => (n === 1 ? "file" : "files");

// The in-memory site: what the content kit would do through site-api.
function useSite() {
  const live = useRef(FILES.map((f) => ({ ...f })));
  const [, setTick] = useState(0);
  const change = (f: (fs: MediaRecord[]) => MediaRecord[]) => {
    live.current = f(live.current);
    setTick((t) => t + 1);
  };
  const submit = async (form: FormData): Promise<IntentResult> => {
    const entry: Record<string, string | string[]> = {};
    for (const k of new Set(form.keys())) {
      const all = form.getAll(k).map((v) => (v instanceof File ? `file:${v.name}` : String(v)));
      entry[k] = all.length > 1 ? all : (all[0] ?? "");
    }
    win.mediaLog.push(entry);
    await new Promise((r) => setTimeout(r, 40));
    const intent = String(form.get("intent"));
    const ids = form.getAll("ids").map(String);
    const tag = String(form.get("tag") ?? "").trim();
    const name = (id: string) => live.current.find((f) => f.key === id)?.name ?? id;
    const some = (n: number) => (n === 1 ? `“${name(ids[0] ?? "")}”` : `${n} files`);
    switch (intent) {
      case "trash":
      case "restore": {
        const to = intent === "trash" ? "binned" : "ready";
        change((fs) => fs.map((f) => (ids.includes(f.key) ? { ...f, state: to } : f)));
        return intent === "trash" ? { ok: true, message: `Moved ${some(ids.length)} to Trash.`, undo: { intent: "restore", fields: { ids } } } : { ok: true, message: `Restored ${some(ids.length)}.`, undo: { intent: "trash", fields: { ids } } };
      }
      case "add-tags":
      case "remove-tags": {
        if (!tag) return { ok: false, message: "Type a tag first. Nothing was changed." };
        const adding = intent === "add-tags";
        const changed = ids.filter((id) => live.current.find((f) => f.key === id)?.tags.includes(tag) !== adding);
        change((fs) => fs.map((f) => (changed.includes(f.key) ? { ...f, tags: adding ? [...f.tags, tag] : f.tags.filter((t) => t !== tag) } : f)));
        return {
          ok: true,
          message: `${adding ? "Added" : "Removed"} the tag ${tag} ${adding ? "to" : "from"} ${changed.length} ${fileWord(changed.length)}.`,
          outcomes: ids.map((id) => ({ id, ok: true, message: changed.includes(id) ? undefined : adding ? "Already had it." : "Did not have it." })),
          undo: changed.length ? { intent: adding ? "remove-tags" : "add-tags", fields: { ids: changed, tag } } : undefined,
        };
      }
      case "delete": {
        if (String(form.get("confirm") ?? "") !== String(ids.length)) {
          return { ok: false, message: "Confirm first.", confirm: { intent: "delete", title: `Delete ${ids.length} ${fileWord(ids.length)} for good?`, lead: "A file deleted for good cannot be brought back. The site refuses one that a post still uses.", items: ids.map(name), action: `Delete ${ids.length} ${fileWord(ids.length)}`, typeToConfirm: String(ids.length), fields: { ids } } };
        }
        const refused = ids.filter((id) => USES[id]?.length);
        change((fs) => fs.filter((f) => !ids.includes(f.key) || refused.includes(f.key)));
        return {
          ok: refused.length === 0,
          message: `Deleted ${ids.length - refused.length} ${fileWord(ids.length - refused.length)} for good${refused.length ? `; ${refused.length} refused` : ""}.`,
          outcomes: ids.map((id) => (refused.includes(id) ? { id, ok: false, message: "Still used, so the site kept it.", usedBy: (USES[id] ?? []).map((u) => ({ type: "post", id: u.href, title: u.title, detail: u.how ?? "" })) } : { id, ok: true })),
        };
      }
      case "save":
      case "alt":
      case "tags":
      case "caption": {
        const id = ids[0] ?? "";
        const decorative = form.get("decorative") === "on";
        const alt = String(form.get("alt") ?? "");
        const tags = form.has("tags") ? String(form.get("tags")).split(",").map((t) => t.trim()).filter(Boolean) : undefined;
        const caption = form.has("caption") ? String(form.get("caption")) : undefined;
        change((fs) => fs.map((f) => (f.key !== id ? f : { ...f, ...(form.has("alt") || decorative ? { alt: decorative ? "" : alt, altState: decorative ? "decorative" : alt.trim() ? "set" : "missing" } : {}), ...(tags ? { tags } : {}), ...(caption !== undefined ? { caption } : {}), version: `v${Date.now()}` })));
        return { ok: true, message: `Saved ${some(1)}.` };
      }
      case "focus": {
        const id = ids[0] ?? "";
        const focus = form.get("clear") === "yes" ? null : `${Number(form.get("x")) / 100}x${Number(form.get("y")) / 100}`;
        change((fs) => fs.map((f) => (f.key !== id ? f : { ...f, focus, version: `v${Date.now()}` })));
        return { ok: true, message: focus ? "Focal point saved." : "Focal point cleared." };
      }
      case "replace": {
        const id = ids[0] ?? "";
        const f = form.get("file");
        if (!(f instanceof File) || !f.name) return { ok: false, message: "Choose the new file." };
        change((fs) => fs.map((x) => (x.key !== id ? x : { ...x, bytes: f.size, focus: null, thumb: thumb("#bfe3d0"), version: `v${Date.now()}` })));
        return { ok: true, message: `Replaced ${some(1)}. Every page that shows it shows the new one.` };
      }
      case "upload": {
        const f = form.get("file");
        if (!(f instanceof File) || !f.name) return { ok: false, message: "Choose a file first. Nothing was uploaded." };
        const key = `2026/10/${f.name}`;
        change((fs) => [file(key, "#bfe3d0", { alt: String(form.get("alt") ?? ""), altState: form.get("alt") ? "set" : "missing", bytes: f.size }), ...fs]);
        return { ok: true, message: `Uploaded “${f.name}”.`, outcomes: [{ id: key, ok: true }] };
      }
      default:
        return { ok: false, message: `Nothing here runs “${intent}”.` };
    }
  };
  return { files: live.current, submit };
}

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
        search={async (text) => files.filter((f) => f.state !== "binned" && f.name.toLowerCase().includes(text.toLowerCase()))}
        bytesHref={bytesOf}
      />
    </div>
  );
}

// A site whose replace must keep the picture's size (site-api v0.11.0 mediaReplaceKeepsSize), in form
// mode as Carrel shows it: replace asks for the same size, and a crop is only ever a new file.
function KeepsSize() {
  const { files, submit } = useSite();
  const { query, Form, onClickCapture } = useRouter({ inspect: "2026/09/foxhound-hero.png" });
  return (
    <div onClickCapture={onClickCapture}>
      <MediaLibrary data={load(files, query, { offers: { ...OFFERS, replaceKeepsSize: true } })} action="/media" Form={Form} submit={submit} bytesHref={bytesOf} shortcuts={false} />
    </div>
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

const reader = load(FILES, {}, { offers: { upload: null, alt: false, tags: false, trash: false, delete: false }, can: NONE, extra: undefined });

const mounts: Record<string, () => ReactNode> = {
  editor: () => (
    <MessageProvider>
      <Editor />
    </MessageProvider>
  ),
  form: () => <MediaLibrary data={load(FILES, { inspect: "2026/09/uptime-strip.png" })} action="/media" shortcuts={false} />,
  trash: () => <MediaLibrary data={load(FILES, { view: "trash", layout: "list" })} action="/media" shortcuts={false} />,
  grouped: () => <MediaLibrary data={load(GROUPED, { group: "folder", size: "s" })} action="/media" shortcuts={false} />,
  "keeps-size": () => <KeepsSize />,
  "by-month": () => <MediaLibrary data={load(GROUPED, { group: "month", layout: "list", sort: "size" }, { page: { nextCursor: null, sortedOnPage: true } })} action="/media" shortcuts={false} />,
  limited: () => <MediaLibrary data={reader} action="/media" shortcuts={false} />,
  picker: () => <Picker />,
  "picker-step": () => <MediaLibrary data={load(FILES, { pick: "2026/09/uptime-strip.png" }, { extra: undefined })} action="/media" mode="picker" />,
  "empty-trash": () => <MediaLibrary data={load(FILES.filter((f) => f.state !== "binned"), { view: "trash" }, { extra: undefined })} action="/media" shortcuts={false} />,
  "empty-match": () => <MediaLibrary data={load(FILES, { q: "lysogeny" }, { extra: undefined })} action="/media" shortcuts={false} />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("media-static");
if (staticHost) staticHost.innerHTML = renderToStaticMarkup(<MediaLibrary data={load(FILES, { inspect: "2026/09/foxhound-hero.png" })} action="/media" shortcuts={false} />, { identifierPrefix: "static" });
