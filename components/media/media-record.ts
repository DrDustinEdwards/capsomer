// The media library's records: the facts of one file and the plain functions that read them.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { formatBytes } from "../format/format.ts";

export type AltState = "missing" | "decorative" | "set";
export type TileState = "ready" | "uploading" | "failed" | "binned";

export interface UsedIn {
  title: string;
  href: string;
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
  // The site's version of the file's metadata; a form posts back the version it last saw.
  version?: string;
  // Where it is used was not read (a list's rows have no usedBy): no Unattached flag, and the inspector says so.
  usedUnknown?: boolean;
  // The point a site's crops are cut around, "XxY" from 0 to 1 from the top left; null or absent for none.
  focus?: string | null;
  // Where the site keeps them: how many places use the file (so a tile can say Unattached), who made it and the terms,
  // its source, the day the license runs out (YYYY-MM-DD), when the picture was taken, and files with identical bytes.
  usedCount?: number;
  credit?: string;
  license?: string;
  sourceUrl?: string | null;
  licenseExpires?: string | null;
  takenAt?: string | null;
  twins?: Array<{ key: string; name: string }>;
  // Which way a picture lies, from the site's kit; never worked out from the size (the rule is site-api's orientationOf).
  orientation?: "landscape" | "portrait" | "square";
}

export interface MediaFields {
  alt: string;
  decorative: boolean;
  title: string;
  caption: string;
  tags: string[];
}

// A tile's id from its file's key; the markup a server draws and the one a page builds must agree.
export const tileId = (key: string): string =>
  `tile-${key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

export const LARGE_BYTES = 1024 * 1024;

// Alt text state: missing is a to-do, decorative is a decision the author made.
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

export interface Flag {
  tone: "warn" | "info" | "nodata";
  word: string;
}
export const unattached = (r: Pick<MediaRecord, "used" | "usedUnknown" | "usedCount">): boolean =>
  r.usedUnknown ? r.usedCount === 0 : r.used.length === 0;

export function flagsFor(
  r: Pick<MediaRecord, "kind" | "altState" | "used" | "state" | "usedUnknown" | "usedCount">,
): Flag[] {
  const out: Flag[] = [];
  if (r.state === "binned") out.push({ tone: "nodata", word: "In Trash" });
  if (r.state === "uploading" || r.state === "failed") return out;
  if (r.kind === "image" && r.altState === "missing")
    out.push({ tone: "warn", word: "No alt text" });
  if (r.kind === "image" && r.altState === "decorative")
    out.push({ tone: "info", word: "Decorative" });
  if (r.state !== "binned" && unattached(r)) out.push({ tone: "nodata", word: "Unattached" });
  return out;
}

export function describeRecord(
  r: Pick<MediaRecord, "kind" | "type" | "bytes" | "state" | "progress" | "error">,
): string {
  const kind = r.type.split("/").pop()?.toUpperCase() || (r.kind === "image" ? "Image" : "File");
  if (r.state === "uploading")
    return `${kind}, uploading${r.progress != null ? ` ${Math.round(r.progress)} percent` : ""}`;
  if (r.state === "failed") return `${kind}, upload failed${r.error ? `: ${r.error}` : ""}`;
  return `${kind}, ${formatBytes(r.bytes)}`;
}

// Markdown link or alt text: the brackets and backslash that would end it early.
const mdText = (text: string): string => text.replace(/[\\[\]]/g, "\\$&");

// The three things a person copies. An image goes in as an image and a document as a link: an <img> for a PDF breaks the page.
export function copySnippets(
  r: Pick<MediaRecord, "url" | "kind" | "alt" | "name"> & { decorative?: boolean },
): Array<{ id: string; label: string; name: string; value: string }> {
  const alt = r.alt.trim();
  // Prelum refuses ![](x) as missing alt text; ![""](x) is how Markdown says decorative.
  const mdAlt = !alt && r.decorative ? '""' : mdText(alt);
  // A document's link text ("uptime-report.pdf" gives "uptime report"). Never an image's alt text: a file's name says nothing of the picture.
  const title = r.name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const url = escapeHtml(r.url);
  if (r.kind === "image") {
    return [
      { id: "address", label: "Copy address", name: "Copy address", value: r.url },
      {
        id: "markdown",
        label: "Markdown",
        name: "Copy the Markdown image",
        value: `![${mdAlt}](${r.url})`,
      },
      {
        id: "html",
        label: "HTML tag",
        name: "Copy the HTML tag",
        value: `<img src="${url}" alt="${escapeHtml(alt)}">`,
      },
    ];
  }
  return [
    { id: "address", label: "Copy address", name: "Copy address", value: r.url },
    {
      id: "markdown",
      label: "Markdown",
      name: "Copy the Markdown link",
      value: `[${mdText(title)}](${r.url})`,
    },
    {
      id: "html",
      label: "HTML link",
      name: "Copy the HTML link",
      value: `<a href="${url}">${escapeHtml(title)}</a>`,
    },
  ];
}
