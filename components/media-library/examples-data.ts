import type { ContentCan, MediaData, MediaQuery, MediaRevision } from "../content/content.ts";
import type { MediaRecord } from "../media/media.ts";

const ALL: ContentCan = {
  edit: true,
  publish: true,
  deleteContent: true,
  deleteMedia: true,
  decideMentions: true,
};
export const NONE: ContentCan = {
  edit: false,
  publish: false,
  deleteContent: false,
  deleteMedia: false,
  decideMentions: false,
};
export const thumb = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><rect width='320' height='320' fill='${fill}'/><circle cx='160' cy='160' r='70' fill='white' opacity='.6'/></svg>`)}`;

export const file = (
  key: string,
  fill: string | null,
  over: Partial<MediaRecord>,
): MediaRecord => ({
  key,
  name: key.split("/").pop() ?? key,
  url: `https://example.com/media/${key}`,
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

export const USES: Record<string, MediaRecord["used"]> = {
  "2026/09/launch-hero.png": [
    { title: "Notes on the spring release", href: "/editor/spring-release", how: "cover image" },
  ],
  "2026/09/mention-queue.png": [
    {
      title: "What a mention queue is for",
      href: "/editor/mention-queue",
      how: "image in the body",
    },
  ],
  "2026/08/old-logo.png": [{ title: "About", href: "/editor/about", how: "image in the body" }],
  "2026/10/bay-dusk.png": [
    { title: "A walk along the bay", href: "/editor/bay-walk", how: "cover image" },
    {
      title: "Field notes, October",
      href: "/editor/field-notes-october",
      how: "image in the body",
    },
  ],
};

export const FILES: MediaRecord[] = [
  file("2026/09/launch-hero.png", "#b29ae3", {
    alt: "The status dashboard with three sites reporting healthy",
    altState: "set",
    tags: ["release", "dashboard"],
    bytes: 421888,
    focus: "0.3x0.4",
    caption: "Three sites, all green.",
  }),
  file("2026/09/uptime-strip.png", "#7fc4c0", { tags: ["capsid"], bytes: 98304 }),
  file("2026/09/mention-queue.png", "#d8c9f5", {
    alt: "The mention queue with four mentions waiting",
    altState: "set",
    tags: ["capsid"],
    bytes: 207872,
  }),
  file("2026/09/divider.png", "#cfc8dc", { altState: "decorative", bytes: 4096 }),
  file("2026/09/uptime-report.pdf", null, { tags: ["reports"], bytes: 1887436 }),
  file("2026/08/old-logo.png", "#e9defa", {
    alt: "The previous logo",
    altState: "set",
    state: "binned",
    bytes: 40960,
  }),
  file("2026/08/scan-0042.png", "#ece5ff", { state: "binned", bytes: 6291456 }),
];

// Two more, in another month and another folder, for the grouped specimens.
export const GROUPED: MediaRecord[] = [
  ...FILES,
  file("2026/08/plot-notebook.png", "#c9b8ef", {
    alt: "A field notebook open to a page of sketches",
    altState: "set",
    tags: ["notes"],
    bytes: 1572864,
    uploaded: "2026-08-03",
  }),
  file("brand/mark.png", "#a98fdc", {
    alt: "The site's mark",
    altState: "set",
    bytes: 8192,
    uploaded: "2026-07-01",
  }),
];

export const OFFERS: MediaData["offers"] = {
  upload: {
    maxBytes: 5 * 1024 * 1024,
    types: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
  },
  alt: true,
  tags: true,
  trash: true,
  delete: true,
  lenses: ["unattached", "no-alt", "large"],
  focus: true,
  caption: true,
  replace: true,
};

// A file's own bytes, as a host serves them on its own origin for the crop editor: a PNG drawn here,
// since the tiles' pictures are SVG, which a canvas does not crop.
const pngs = new Map<string, string>();
export function bytesOf(key: string): string {
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
  unattached: (f) => (f.usedCount != null ? f.usedCount === 0 : !USES[f.key]?.length),
  "no-alt": (f) => f.kind === "image" && f.altState === "missing",
  large: (f) => f.bytes > 1024 * 1024,
  duplicates: (f) => !!f.twins?.length,
  "license-expired": (f) =>
    !!f.licenseExpires && f.licenseExpires < new Date().toISOString().slice(0, 10),
  oversized: (f) => f.kind === "image" && Math.max(f.width ?? 0, f.height ?? 0) > 2048,
};
const BY: Record<string, (a: MediaRecord, b: MediaRecord) => number> = {
  added: (a, b) => (b.uploaded ?? "").localeCompare(a.uploaded ?? ""),
  name: (a, b) => a.name.localeCompare(b.name),
  size: (a, b) => b.bytes - a.bytes,
  used: (a, b) => (b.usedCount ?? 0) - (a.usedCount ?? 0),
};

// This specimen site's orientation for its files, which have exact sizes (a real site's kit uses
// site-api's orientationOf).
export const lies = (f: Pick<MediaRecord, "width" | "height">): MediaRecord["orientation"] =>
  !f.width || !f.height
    ? undefined
    : f.width === f.height
      ? "square"
      : f.width > f.height
        ? "landscape"
        : "portrait";
const placed = (f: MediaRecord): MediaRecord => ({
  ...f,
  ...(lies(f) ? { orientation: lies(f) } : {}),
});

// What the kit's loader would give for a query over these files.
export function load(
  files: MediaRecord[],
  query: MediaQuery,
  over: Partial<MediaData> = {},
): MediaData {
  const trash = query.view === "trash";
  const inView = files.filter((f) => (trash ? f.state === "binned" : f.state !== "binned"));
  const natural = query.sort === "name" ? "asc" : "desc";
  const flip = (query.dir ?? natural) === natural ? 1 : -1;
  const rows = inView
    .map(placed)
    .filter(
      (f) =>
        (!query.q || f.name.includes(query.q)) &&
        (!query.tag || f.tags.includes(query.tag)) &&
        (!query.lens || !LENS[query.lens] || LENS[query.lens]!(f)),
    )
    .filter(
      (f) =>
        (!query.kind || f.kind === query.kind) &&
        (!query.orientation || f.orientation === query.orientation),
    )
    .sort((a, b) => flip * (BY[query.sort ?? "added"] ?? BY.added!)(a, b));
  const tagCounts = new Map<string, number>();
  for (const f of inView) for (const t of f.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const inspect = files.find((f) => f.key === query.inspect);
  return {
    site: { name: "example.com" },
    query,
    rows,
    page: { nextCursor: null },
    counts: {
      library: files.filter((f) => f.state !== "binned").length,
      trash: files.filter((f) => f.state === "binned").length,
    },
    tags: [...tagCounts].sort().map(([tag, count]) => ({ tag, count })),
    offers: OFFERS,
    can: ALL,
    inspected: inspect
      ? { ...placed(inspect), used: USES[inspect.key] ?? [], usedUnknown: false }
      : null,
    extra: {
      lenses: [
        {
          id: "no-alt",
          label: "No alt text",
          count: inView.filter((f) => f.kind === "image" && f.altState === "missing").length,
        },
      ],
    },
    ...over,
  };
}

// site-api v0.13.0: a site that offers every one of the media library's ideas, and whose addresses
// carry the size (a quarter turn of a picture that is not square is saved as a new file).
export const IDEA_OFFERS: MediaData["offers"] = {
  ...OFFERS,
  lenses: ["unattached", "no-alt", "duplicates", "license-expired", "oversized"],
  replaceKeepsSize: true,
  duplicates: true,
  usage: true,
  filters: true,
  import: true,
  credit: true,
  transform: true,
  history: true,
  live: true,
  resize: { maxEdge: 2048, quality: 82 },
  resizePass: true,
  embedded: true,
  suggestions: true,
};

export const IDEAS: MediaRecord[] = [
  file("2026/10/bay-dusk.png", "#e0b4a8", {
    width: 4000,
    height: 3000,
    bytes: 3145728,
    uploaded: "2026-10-20",
    caption: "The bay at dusk, from the old suspension bridge.",
    credit: "Ada Example",
    license: "CC BY 4.0",
    sourceUrl: "https://photos.example.com/r/1",
    licenseExpires: "2026-10-01",
    takenAt: "2026-05-01T09:30:00Z",
    usedCount: 2,
    twins: [{ key: "2026/10/bay-copy.png", name: "bay-copy.png" }],
    tags: ["river"],
  }),
  file("2026/10/bay-copy.png", "#e0b4a8", {
    width: 4000,
    height: 3000,
    bytes: 3145728,
    uploaded: "2026-10-21",
    usedCount: 0,
    twins: [{ key: "2026/10/bay-dusk.png", name: "bay-dusk.png" }],
  }),
  file("2026/10/workbench.png", "#a8d0c8", {
    width: 1600,
    height: 1600,
    alt: "A workbench with three open notebooks",
    altState: "set",
    uploaded: "2026-10-12",
    usedCount: 1,
    credit: "",
    license: "",
  }),
  file("2026/10/field-notes.pdf", null, { uploaded: "2026-10-02", usedCount: 3 }),
];

const HISTORY: MediaRevision[] = [
  {
    rev: "r2",
    at: "2026-10-22T15:04:00Z",
    bytes: 3145728,
    width: 4000,
    height: 3000,
    reason: "transform",
    current: true,
  },
  {
    rev: "r1",
    at: "2026-10-20T09:12:00Z",
    bytes: 3140000,
    width: 3000,
    height: 4000,
    reason: "upload",
    current: false,
  },
];

export const loadIdeas = (files: MediaRecord[], query: MediaQuery): MediaData =>
  load(files, query, {
    offers: IDEA_OFFERS,
    page: { nextCursor: null, changeCursor: "c0" },
    extra: undefined,
    ...(query.inspect === "2026/10/bay-dusk.png" ? { history: HISTORY } : {}),
    ...(query.inspect && query.suggest
      ? {
          suggestions: {
            tags: ["dusk", "bridge"],
            alt: "The bay at dusk under a pink sky, the suspension bridge in silhouette",
            model: "@cf/example/vision",
          },
        }
      : {}),
  });
