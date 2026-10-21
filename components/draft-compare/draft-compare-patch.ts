// Draft compare's unified-diff view: parsePatch and renderPatch (draft-compare.ts).

import { esc, plural, sr } from "./draft-compare-render.ts";

// ---------------------------------------------------------------------------------------
// The patch mode: a unified git patch shown as it is, by line
// ---------------------------------------------------------------------------------------

export type PatchOp = "same" | "ins" | "del";

export interface PatchLine {
  op: PatchOp;
  text: string;
  // The line's number in the old and new file; null on the side it is not in.
  oldNo: number | null;
  newNo: number | null;
  // A "\ No newline at end of file" note follows this line.
  noEol?: boolean;
}

export interface PatchHunk {
  header: string;
  context: string;
  lines: PatchLine[];
}

export interface PatchFile {
  oldPath: string;
  newPath: string;
  hunks: PatchHunk[];
  // "Binary file changed" and the like, in words, when there is no text to show.
  note?: string;
  added: number;
  removed: number;
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@ ?(.*)$/;
const stripPrefix = (p: string) => (p === "/dev/null" ? p : p.replace(/^[ab]\//, ""));

// Reads a unified patch (git diff, git show, git format-patch) into files, hunks and lines.
// Pure and forgiving: text it does not understand (commit headers, index lines) is skipped.
export function parsePatch(patch: string): PatchFile[] {
  const files: PatchFile[] = [];
  let file: PatchFile | undefined;
  let hunk: PatchHunk | undefined;
  let oldNo = 0;
  let newNo = 0;
  const open = (oldPath = "", newPath = ""): PatchFile => {
    const f: PatchFile = { oldPath, newPath, hunks: [], added: 0, removed: 0 };
    files.push(f);
    file = f;
    hunk = undefined;
    return f;
  };
  for (const raw of patch.replace(/\r\n?/g, "\n").split("\n")) {
    const git = /^diff --git a\/(.+?) b\/(.+)$/.exec(raw);
    if (git) {
      open(git[1] ?? "", git[2] ?? "");
      continue;
    }
    if (!hunk && raw.startsWith("--- ")) {
      const f = file && !file.hunks.length && !file.note ? file : open();
      f.oldPath = stripPrefix(raw.slice(4).split("\t")[0] ?? "");
      continue;
    }
    if (!hunk && raw.startsWith("+++ ") && file) {
      file.newPath = stripPrefix(raw.slice(4).split("\t")[0] ?? "");
      continue;
    }
    const h = HUNK.exec(raw);
    if (h) {
      const f = file ?? open();
      oldNo = Number(h[1]);
      newNo = Number(h[2]);
      hunk = { header: raw, context: h[3] ?? "", lines: [] };
      f.hunks.push(hunk);
      continue;
    }
    if (!file) continue;
    if (!hunk) {
      if (/^(Binary files|GIT binary patch)/.test(raw)) file.note = "Binary file changed; no text to show.";
      else if (/^rename from /.test(raw)) file.note = "Renamed.";
      continue;
    }
    if (raw.startsWith("\\")) {
      const last = hunk.lines[hunk.lines.length - 1];
      if (last) last.noEol = true;
    } else if (raw.startsWith("+")) {
      hunk.lines.push({ op: "ins", text: raw.slice(1), oldNo: null, newNo: newNo++ });
      file.added++;
    } else if (raw.startsWith("-")) {
      hunk.lines.push({ op: "del", text: raw.slice(1), oldNo: oldNo++, newNo: null });
      file.removed++;
    } else if (raw.startsWith(" ")) {
      hunk.lines.push({ op: "same", text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ });
    }
  }
  return files.filter((f) => f.hunks.length || f.note);
}

export interface PatchOptions {
  // The id of the region; give each patch on a page its own. Default "patch".
  id?: string;
  // What the patch is of: "Draft 4 against Draft 3". Names the region.
  title?: string;
}

export interface PatchCounts {
  files: number;
  added: number;
  removed: number;
}

export function patchCounts(files: readonly PatchFile[]): PatchCounts {
  return { files: files.length, added: files.reduce((n, f) => n + f.added, 0), removed: files.reduce((n, f) => n + f.removed, 0) };
}

export function patchCountsText(c: PatchCounts): string {
  return `${plural(c.files, "file", "files")} changed, ${plural(c.added, "line", "lines")} added, ${c.removed} removed`;
}

const SIGN: Record<PatchOp, string> = { same: "", ins: "+", del: "−" };
const SIGN_WORD: Record<PatchOp, string> = { same: "", ins: "added", del: "removed" };

// A revision label, `id@v1` against `id@v2`: the same thing at two revisions, not a rename.
// Returns the shared name and the two revisions, or null for any other pair of paths.
const REVISION = /^(.+)@([^@/]+)$/;
export function revisionPair(oldPath: string, newPath: string): { name: string; from: string; to: string } | null {
  const a = REVISION.exec(oldPath);
  const b = REVISION.exec(newPath);
  if (!a || !b || a[1] !== b[1] || a[2] === b[2]) return null;
  return { name: a[1] as string, from: a[2] as string, to: b[2] as string };
}

function patchPath(f: PatchFile): string {
  if (f.oldPath === "/dev/null") return f.newPath;
  if (f.newPath === "/dev/null") return f.oldPath;
  const rev = revisionPair(f.oldPath, f.newPath);
  if (rev) return rev.name;
  return f.oldPath && f.newPath && f.oldPath !== f.newPath ? `${f.oldPath} → ${f.newPath}` : f.newPath || f.oldPath;
}

function patchLine(l: PatchLine): string {
  const sign = l.op === "same" ? "" : `<span aria-hidden="true">${SIGN[l.op]}</span>${sr(SIGN_WORD[l.op])}`;
  const eol = l.noEol ? `<span class="cap-patch-eol">${sr("no newline at end of file")}<span aria-hidden="true">∅</span></span>` : "";
  return `<tr class="cap-patch-line" data-op="${l.op}"><td class="cap-patch-no">${l.oldNo ?? ""}</td><td class="cap-patch-no">${l.newNo ?? ""}</td><td class="cap-patch-sign">${sign}</td><td class="cap-patch-code"><code>${esc(l.text)}</code>${eol}</td></tr>`;
}

function patchFile(f: PatchFile, id: string, n: number): string {
  const path = patchPath(f);
  const heading = `${id}-file-${n}`;
  const rev = revisionPair(f.oldPath, f.newPath);
  const kind = f.oldPath === "/dev/null" ? "new file" : f.newPath === "/dev/null" ? "deleted" : rev ? `${rev.from} to ${rev.to}` : "";
  const counts = `${f.added} added, ${f.removed} removed`;
  const body = f.hunks
    .map((h) => `<tbody class="cap-patch-hunk"><tr class="cap-patch-hunk-head"><th scope="rowgroup" colspan="4"><code>${esc(h.header)}</code></th></tr>${h.lines.map(patchLine).join("")}</tbody>`)
    .join("");
  const table = f.hunks.length
    ? `<div class="cap-patch-scroll" role="region" aria-labelledby="${heading}" tabindex="0"><table class="cap-patch-table"><caption class="cap-sr-only">${esc(path)}, ${counts}</caption>${body}</table></div>`
    : "";
  return `<section class="cap-patch-file" aria-labelledby="${heading}"><h3 class="cap-patch-path" id="${heading}"><code>${esc(path)}</code>${kind ? ` <span class="cap-patch-kind">${kind}</span>` : ""}<span class="cap-patch-file-counts">${counts}</span></h3>${f.note ? `<p class="cap-patch-note">${esc(f.note)}</p>` : ""}${table}</section>`;
}

// A unified git patch as it is: one file at a time, one row per line, the old and new line
// numbers beside it and a literal plus or minus opening each changed line, so a change is
// never only a tint. Use it where the line is the unit (code, a configuration file, a commit);
// for prose, renderCompare compares by word.
export function renderPatch(patch: string, options: PatchOptions = {}): string {
  const id = options.id ?? "patch";
  const files = parsePatch(patch);
  const name = options.title ? `Patch: ${options.title}` : "Patch";
  const attrs = `class="cap-compare cap-patch" data-mode="patch" id="${id}" aria-label="${esc(name)}"`;
  if (!files.length) return `<section ${attrs}><p class="cap-compare-none" role="status"><strong>No changes.</strong> This patch has no lines to show.</p></section>`;
  const key = `<ul class="cap-compare-key" aria-label="Key to the marks"><li><span class="cap-compare-key-mark" data-kind="ins">Added</span> a plus opens the line</li><li><span class="cap-compare-key-mark" data-kind="del">Removed</span> a minus opens the line</li></ul>`;
  return `<section ${attrs}><div class="cap-compare-bar"><div class="cap-compare-legend">${key}<p class="cap-compare-counts">${esc(patchCountsText(patchCounts(files)))}</p></div></div>${files.map((f, i) => patchFile(f, id, i + 1)).join("")}</section>`;
}
