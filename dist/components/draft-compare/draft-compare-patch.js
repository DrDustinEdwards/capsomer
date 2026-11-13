// Draft compare's unified-diff view: parsePatch and renderPatch (draft-compare.ts).
import { plural } from "../hooks/hooks.js";
import { commonSubsequence } from "./draft-compare-diff.js";
import { escapeHtml as esc } from "@dustinedwards/site-runtime/html";
import { sr } from "./draft-compare-render.js";
const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@ ?(.*)$/;
const stripPrefix = (p) => (p === "/dev/null" ? p : p.replace(/^[ab]\//, ""));
// Reads a unified patch (git diff, git show, git format-patch) into files, hunks and lines.
// Pure and forgiving: text it does not understand (commit headers, index lines) is skipped.
export function parsePatch(patch) {
    const files = [];
    let file;
    let hunk;
    let oldNo = 0;
    let newNo = 0;
    const open = (oldPath = "", newPath = "") => {
        const f = { oldPath, newPath, hunks: [], added: 0, removed: 0 };
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
        if (!file)
            continue;
        if (!hunk) {
            if (/^(Binary files|GIT binary patch)/.test(raw))
                file.note = "Binary file changed; no text to show.";
            else if (raw.startsWith("rename from "))
                file.note = "Renamed.";
            continue;
        }
        if (raw.startsWith("\\")) {
            const last = hunk.lines[hunk.lines.length - 1];
            if (last)
                last.noEol = true;
        }
        else if (raw.startsWith("+")) {
            hunk.lines.push({ op: "ins", text: raw.slice(1), oldNo: null, newNo: newNo++ });
            file.added++;
        }
        else if (raw.startsWith("-")) {
            hunk.lines.push({ op: "del", text: raw.slice(1), oldNo: oldNo++, newNo: null });
            file.removed++;
        }
        else if (raw.startsWith(" ")) {
            hunk.lines.push({ op: "same", text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ });
        }
    }
    return files.filter((f) => f.hunks.length || f.note);
}
export function patchCounts(files) {
    return {
        files: files.length,
        added: files.reduce((n, f) => n + f.added, 0),
        removed: files.reduce((n, f) => n + f.removed, 0),
    };
}
export function patchCountsText(c) {
    return `${plural(c.files, "file", "files")} changed, ${plural(c.added, "line", "lines")} added, ${c.removed} removed`;
}
const SIGN = { same: "", ins: "+", del: "−" };
const SIGN_WORD = { same: "", ins: "added", del: "removed" };
// A revision label, `id@v1` against `id@v2`: the same thing at two revisions, not a rename.
// Returns the shared name and the two revisions, or null for any other pair of paths.
const REVISION = /^(.+)@([^@/]+)$/;
export function revisionPair(oldPath, newPath) {
    const a = REVISION.exec(oldPath);
    const b = REVISION.exec(newPath);
    if (!a || !b || a[1] !== b[1] || a[2] === b[2])
        return null;
    return { name: a[1], from: a[2], to: b[2] };
}
function patchPath(f) {
    if (f.oldPath === "/dev/null")
        return f.newPath;
    if (f.newPath === "/dev/null")
        return f.oldPath;
    const rev = revisionPair(f.oldPath, f.newPath);
    if (rev)
        return rev.name;
    return f.oldPath && f.newPath && f.oldPath !== f.newPath
        ? `${f.oldPath} → ${f.newPath}`
        : f.newPath || f.oldPath;
}
function patchLine(l) {
    const sign = l.op === "same" ? "" : `<span aria-hidden="true">${SIGN[l.op]}</span>${sr(SIGN_WORD[l.op])}`;
    const eol = l.noEol
        ? `<span class="cap-patch-eol">${sr("no newline at end of file")}<span aria-hidden="true">∅</span></span>`
        : "";
    return `<tr class="cap-patch-line" data-op="${l.op}"><td class="cap-patch-no">${l.oldNo ?? ""}</td><td class="cap-patch-no">${l.newNo ?? ""}</td><td class="cap-patch-sign">${sign}</td><td class="cap-patch-code"><code>${esc(l.text)}</code>${eol}</td></tr>`;
}
function patchFile(f, id, n) {
    const path = patchPath(f);
    const heading = `${id}-file-${n}`;
    const rev = revisionPair(f.oldPath, f.newPath);
    const kind = f.oldPath === "/dev/null"
        ? "new file"
        : f.newPath === "/dev/null"
            ? "deleted"
            : rev
                ? `${rev.from} to ${rev.to}`
                : "";
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
export function renderPatch(patch, options = {}) {
    const id = options.id ?? "patch";
    const files = parsePatch(patch);
    const name = options.title ? `Patch: ${options.title}` : "Patch";
    const attrs = `class="cap-compare cap-patch" data-mode="patch" id="${id}" aria-label="${esc(name)}"`;
    if (!files.length)
        return `<section ${attrs}><p class="cap-compare-none" role="status"><strong>No changes.</strong> This patch has no lines to show.</p></section>`;
    const key = `<ul class="cap-compare-key" aria-label="Key to the marks"><li><span class="cap-compare-key-mark" data-kind="ins">Added</span> a plus opens the line</li><li><span class="cap-compare-key-mark" data-kind="del">Removed</span> a minus opens the line</li></ul>`;
    return `<section ${attrs}><div class="cap-compare-bar"><div class="cap-compare-legend">${key}<p class="cap-compare-counts">${esc(patchCountsText(patchCounts(files)))}</p></div></div>${files.map((f, i) => patchFile(f, id, i + 1)).join("")}</section>`;
}
// A text's lines, each with its newline; the last has none when the text does not end in one.
function linesOf(text) {
    const t = text.replace(/\r\n?/g, "\n");
    if (t === "")
        return [];
    const out = t.split(/(?<=\n)/);
    return out;
}
function steps(a, b, maxEdits) {
    const pairs = commonSubsequence(a, b, maxEdits) ?? [];
    const out = [];
    let i = 0;
    let j = 0;
    for (const [x, y] of [...pairs, [a.length, b.length]]) {
        while (i < x)
            out.push({ op: "del", line: a[i++] ?? "" });
        while (j < y)
            out.push({ op: "ins", line: b[j++] ?? "" });
        if (x < a.length && y < b.length) {
            out.push({ op: "same", line: a[x] ?? "" });
            i = x + 1;
            j = y + 1;
        }
    }
    return out;
}
const MARK = { same: " ", ins: "+", del: "-" };
// The patch from `before` to `after`. Both sides carry the same name, so a viewer shows one file
// changed, not a rename; what each side is goes in its label. Two texts that are the same give a
// patch with no hunks, which DraftPatch says in words. Pure, so a server builds it.
export function unifiedPatch(name, before, after, options = {}) {
    const context = options.context ?? 3;
    const all = steps(linesOf(before.text), linesOf(after.text), options.maxEdits ?? 5000);
    const head = (sign, side) => `${sign} ${name}${side.label === undefined ? "" : `\t${side.label}`}`;
    const out = [
        `Index: ${name}`,
        "===================================================================",
        head("---", before),
        head("+++", after),
    ];
    // The line numbers each step starts at, on both sides.
    const oldAt = [];
    const newAt = [];
    let o = 1;
    let n = 1;
    for (const s of all) {
        oldAt.push(o);
        newAt.push(n);
        if (s.op !== "ins")
            o++;
        if (s.op !== "del")
            n++;
    }
    const changed = all.flatMap((s, k) => (s.op === "same" ? [] : [k]));
    let k = 0;
    while (k < changed.length) {
        const first = changed[k] ?? 0;
        let last = first;
        // Changes closer than two contexts apart share a hunk.
        while (k + 1 < changed.length && (changed[k + 1] ?? 0) - last - 1 <= context * 2)
            last = changed[++k] ?? last;
        k++;
        const from = Math.max(0, first - context);
        const to = Math.min(all.length - 1, last + context);
        const part = all.slice(from, to + 1);
        const oldLines = part.filter((s) => s.op !== "ins").length;
        const newLines = part.filter((s) => s.op !== "del").length;
        const oldStart = (oldAt[from] ?? 1) - (oldLines === 0 ? 1 : 0);
        const newStart = (newAt[from] ?? 1) - (newLines === 0 ? 1 : 0);
        out.push(`@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`);
        for (const s of part) {
            out.push(MARK[s.op] + s.line.replace(/\n$/, ""));
            if (!s.line.endsWith("\n"))
                out.push("\\ No newline at end of file");
        }
    }
    return `${out.join("\n")}\n`;
}
// True when a patch carries at least one changed line.
export function hasChanges(patch) {
    return /^@@ /m.test(patch);
}
