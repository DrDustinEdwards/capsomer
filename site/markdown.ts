// A small Markdown renderer for the repo's own doc pages: headings, paragraphs, lists,
// tables, fenced code, inline code, bold, italics and links. Every character is escaped
// first, so the output holds only the markup this file writes.

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s: string): string {
  const codes: string[] = [];
  let out = escape(s).replace(/`([^`]+)`/g, (_, c: string) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, href: string) => {
      const safe = /^(https?:|#|\.{0,2}\/)/.test(href) ? href : "#";
      return `<a href="${safe}">${text}</a>`;
    });
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)] ?? "");
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

// headingOffset shifts heading levels, so a doc page's "#" sits under the site's own h1.
export function renderMarkdown(src: string, headingOffset = 1): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^```/.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i] ?? "")) body.push(lines[i++] ?? "");
      i++;
      out.push(`<pre class="site-code"><code>${escape(body.join("\n"))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(6, (h[1]?.length ?? 1) + headingOffset);
      const text = h[2] ?? "";
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      out.push(`<h${level} id="doc-${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }
    if (/^\|/.test(line) && /^\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i] ?? "")) rows.push(cells(lines[i++] ?? ""));
      out.push(
        `<div class="cap-table-wrap" role="region" tabindex="0" aria-label="Table"><table class="cap-table"><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i] ?? "") || /^\s*\d+\.\s+/.test(lines[i] ?? "") || /^\s{2,}\S/.test(lines[i] ?? ""))) {
        const l = lines[i++] ?? "";
        if (/^\s{2,}\S/.test(l) && !/^\s*([-*]|\d+\.)\s+/.test(l) && items.length) items[items.length - 1] += " " + l.trim();
        else items.push(l.replace(/^\s*([-*]|\d+\.)\s+/, ""));
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`);
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() !== "" && !/^(#{1,6}\s|```|\||\s*[-*]\s|\s*\d+\.\s)/.test(lines[i] ?? "")) para.push(lines[i++] ?? "");
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

// Doc-page frontmatter: `key: value`, `key: [a, b]`, and `key:` followed by `- item` lines.
export function frontmatter(src: string): { data: Record<string, string | string[]>; body: string } {
  const m = src.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string | string[]> = {};
  let key = "";
  for (const raw of (m[1] ?? "").split("\n")) {
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && key) {
      const list = Array.isArray(data[key]) ? (data[key] as string[]) : [];
      list.push(unquote(item[1] ?? ""));
      data[key] = list;
      continue;
    }
    const kv = raw.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1] ?? "";
    const v = (kv[2] ?? "").trim();
    if (v.startsWith("[") && v.endsWith("]")) data[key] = v.slice(1, -1).split(",").map((s) => unquote(s.trim())).filter(Boolean);
    else data[key] = v === "" ? [] : unquote(v);
  }
  return { data, body: src.slice(m[0].length) };
}

const unquote = (s: string) => s.replace(/^(['"])(.*)\1$/, "$2");
