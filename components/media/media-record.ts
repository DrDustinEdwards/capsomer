// The media library's records: the facts of one file and the plain functions that read them.

// ---------------------------------------------------------------------------------------
// The records, pure.

export type AltState = "missing" | "decorative" | "set";
export type TileState = "ready" | "uploading" | "failed" | "binned";

export interface UsedIn {
  title: string;
  href: string;
  // How the post uses it: "image in the body", "cover".
  how?: string;
}

export interface MediaRecord {
  key: string;
  name: string;
  url: string;
  thumb?: string;
  kind: "image" | "document";
  type: string;
  bytes: number;
  width?: number;
  height?: number;
  uploaded?: string;
  alt: string;
  altState: AltState;
  title: string;
  caption: string;
  tags: string[];
  used: UsedIn[];
  state: TileState;
  suggestedTags?: string[];
  progress?: number;
  error?: string;
  // The site's version of the file's metadata (site-api v0.4): a form posts it back as the
  // version it last saw.
  version?: string;
  // Where it is used was not read (a list of files has no usedBy; the inspected one does): no
  // Unattached flag, and the inspector says it was not checked.
  usedUnknown?: boolean;
  // The point a site's crops are cut around, "XxY" from 0 to 1 from the top left (site-api v0.10.0
  // MediaFocus); null or absent for none, when the crop is the site's guess.
  focus?: string | null;
  // site-api v0.13.0, each where the site keeps it: how many places use the file (a list's rows carry
  // it, so a tile can say Unattached without reading every use), who made it and the terms it is used
  // under, where it came from, the day the license runs out (YYYY-MM-DD), when the picture was taken
  // (from the file's own metadata), and the other files holding exactly its bytes.
  usedCount?: number;
  credit?: string;
  license?: string;
  sourceUrl?: string | null;
  licenseExpires?: string | null;
  takenAt?: string | null;
  twins?: Array<{ key: string; name: string }>;
}

// What the inspector edits.
export interface MediaFields {
  alt: string;
  decorative: boolean;
  title: string;
  caption: string;
  tags: string[];
}

// Decimal unit names, binary division: the site's own rule, so a size reads the same on both.
export function byteSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const LARGE_BYTES = 1024 * 1024;

// "foxhound-hero.jpg" gives "foxhound hero": offered as alt text, never applied (alt text nobody
// read is worse than a visibly empty field).
export function suggestedAlt(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

// The state of a file's alt text. Missing and decorative are different: missing is a to-do,
// decorative is a decision the author made.
export function altStateOf(alt: string, decorative: boolean): AltState {
  if (decorative) return "decorative";
  return alt.trim() ? "set" : "missing";
}

export function parseTags(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(",")) {
    const t = raw.trim().toLowerCase();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

// What a tile says about the file besides its name: the things a person should not miss.
export interface Flag {
  tone: "warn" | "info" | "nodata";
  word: string;
}
export function flagsFor(r: Pick<MediaRecord, "kind" | "altState" | "used" | "state" | "usedUnknown" | "usedCount">): Flag[] {
  const out: Flag[] = [];
  if (r.state === "binned") out.push({ tone: "nodata", word: "In Trash" });
  if (r.state === "uploading" || r.state === "failed") return out;
  if (r.kind === "image" && r.altState === "missing") out.push({ tone: "warn", word: "No alt text" });
  if (r.kind === "image" && r.altState === "decorative") out.push({ tone: "info", word: "Decorative" });
  if (r.state !== "binned" && (r.usedUnknown ? r.usedCount === 0 : r.used.length === 0)) out.push({ tone: "nodata", word: "Unattached" });
  return out;
}

// What a tile's controls are called, in one line a screen reader reads after the file's name.
export function describeRecord(r: Pick<MediaRecord, "kind" | "type" | "bytes" | "state" | "progress" | "error">): string {
  const kind = r.type.split("/").pop()?.toUpperCase() || (r.kind === "image" ? "Image" : "File");
  if (r.state === "uploading") return `${kind}, uploading${r.progress != null ? ` ${Math.round(r.progress)} percent` : ""}`;
  if (r.state === "failed") return `${kind}, upload failed${r.error ? `: ${r.error}` : ""}`;
  return `${kind}, ${byteSize(r.bytes)}`;
}

// The three things a person copies: the address, the Markdown, the HTML. An image goes in as an
// image and a document as a link: an <img> for a PDF breaks the page.
export function copySnippets(r: Pick<MediaRecord, "url" | "kind" | "alt" | "name">): Array<{ id: string; label: string; name: string; value: string }> {
  const alt = r.alt.trim();
  const title = suggestedAlt(r.name);
  if (r.kind === "image") {
    return [
      { id: "address", label: "Copy address", name: "Copy address", value: r.url },
      { id: "markdown", label: "Markdown", name: "Copy the Markdown image", value: `![${alt}](${r.url})` },
      { id: "html", label: "HTML tag", name: "Copy the HTML tag", value: `<img src="${r.url}" alt="${alt}">` },
    ];
  }
  return [
    { id: "address", label: "Copy address", name: "Copy address", value: r.url },
    { id: "markdown", label: "Markdown", name: "Copy the Markdown link", value: `[${title}](${r.url})` },
    { id: "html", label: "HTML link", name: "Copy the HTML link", value: `<a href="${r.url}">${title}</a>` },
  ];
}

