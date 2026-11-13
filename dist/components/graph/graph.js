// A directed graph drawn once, at build time or on a server, as an SVG string: boxes linked to
// their pages and wires from one box to another, laid out by dagre (a layered layout, so wires
// run one way). Each box can carry status lines (the status component's glyph and a word) and a
// dashed ring that marks it (a module in an import cycle). The drawing is aria-hidden: the page
// puts the same facts in a table or list beside it, and the links are out of the tab order.
import dagre from "@dagrejs/dagre";
import { glyphParts } from "../status/status.js";
import { escapeHtml as esc } from "@dustinedwards/site-runtime/html";
// Sizes before any browser measures: an average character of 13 px text, padding and line height.
const CHAR = 7.4;
const PAD = 14;
const LINE = 18;
const f = (n) => n.toFixed(1);
// A wire through dagre's points as one smooth curve (Catmull-Rom as cubic Béziers), so wires that
// share a rank read as separate strands rather than a tangle of corners.
export function smoothPath(pts) {
    if (pts.length === 0)
        return "";
    let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        d += ` C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
    }
    return d;
}
function layout(boxes, wires, rankdir) {
    const g = new dagre.graphlib.Graph({ multigraph: false });
    g.setGraph({
        rankdir,
        nodesep: rankdir === "TB" ? 24 : 14,
        ranksep: rankdir === "TB" ? 44 : 64,
        marginx: 12,
        marginy: 22,
    });
    g.setDefaultEdgeLabel(() => ({}));
    for (const b of boxes) {
        const lines = b.lines ?? [];
        const chars = Math.max(b.label.length, (b.sub ?? "").length * 0.9, ...lines.map((l) => l.text.length + 3));
        g.setNode(b.id, {
            width: Math.ceil(chars * CHAR + PAD * 2),
            height: PAD * 2 + LINE * (1 + lines.length + (b.sub ? 1 : 0)) - 4,
        });
    }
    // A wire to a box not drawn, or to itself, is left out; two wires between the same boxes are one.
    const ids = new Set(boxes.map((b) => b.id));
    for (const w of wires)
        if (ids.has(w.from) && ids.has(w.to) && w.from !== w.to)
            g.setEdge(w.from, w.to);
    dagre.layout(g);
    return g;
}
export function graphSvg(o) {
    const column = o.column ?? 1150;
    const tb = layout(o.boxes, o.wires, "TB");
    const tbWidth = tb.graph().width ?? 0;
    const lr = tbWidth > column ? layout(o.boxes, o.wires, "LR") : null;
    const g = lr && (lr.graph().width ?? 0) < tbWidth ? lr : tb;
    const id = esc(o.id);
    const edges = g
        .edges()
        .map((e) => `<path class="cap-graph-wire" d="${smoothPath(g.edge(e).points ?? [])}" marker-end="url(#${id}-arrow)"/>`);
    const nodes = o.boxes.map((b) => {
        const n = g.node(b.id);
        const x = n.x - n.width / 2;
        const y = n.y - n.height / 2;
        const lines = b.lines ?? [];
        const text = lines
            .map((line, i) => {
            const ty = y + PAD + LINE * (i + 1 + (b.sub ? 1 : 0)) + 9;
            return `<g class="cap-graph-status" data-tone="${line.tone}"><svg x="${f(x + PAD)}" y="${f(ty - 11)}" width="12" height="12" viewBox="0 0 16 16">${glyphParts(line.tone)}</svg><text x="${f(x + PAD + 17)}" y="${f(ty)}">${esc(line.text)}</text></g>`;
        })
            .join("");
        const sub = b.sub
            ? `<text class="cap-graph-sub" x="${f(x + PAD)}" y="${f(y + PAD + LINE + 9)}">${esc(b.sub)}</text>`
            : "";
        const ring = b.ring
            ? `<rect class="cap-graph-ring" x="${f(x - 5)}" y="${f(y - 5)}" width="${f(n.width + 10)}" height="${f(n.height + 10)}" rx="10"/>`
            : "";
        const ringWord = b.ring
            ? `<text class="cap-graph-ring-label" x="${f(x + n.width - 2)}" y="${f(y - 8)}" text-anchor="end">${esc(o.ringLabel ?? "cycle")}</text>`
            : "";
        return `<a href="${esc(b.href)}" tabindex="-1"><g class="cap-graph-box" data-tone="${lines[0]?.tone ?? "nodata"}"${b.ring ? " data-ring" : ""}>${ring}<rect class="cap-graph-card" x="${f(x)}" y="${f(y)}" width="${n.width}" height="${n.height}" rx="6"/><text class="cap-graph-name" x="${f(x + PAD)}" y="${f(y + PAD + 9)}">${esc(b.label)}</text>${sub}${text}${ringWord}</g></a>`;
    });
    // The frame is every box and every wire's points with a margin: dagre can route a wire outside
    // the size it reports.
    let [x0, y0, x1, y1] = [0, 0, g.graph().width ?? 0, g.graph().height ?? 0];
    for (const e of g.edges())
        for (const p of g.edge(e).points ?? [])
            [x0, y0, x1, y1] = [
                Math.min(x0, p.x - 8),
                Math.min(y0, p.y - 8),
                Math.max(x1, p.x + 8),
                Math.max(y1, p.y + 8),
            ];
    const w = Math.ceil(x1 - x0);
    const h = Math.ceil(y1 - y0);
    return `<figure class="cap-graph"><figcaption id="${id}-caption">${esc(o.title)}</figcaption><div class="cap-graph-scroller" role="region" aria-labelledby="${id}-caption" tabindex="0"><svg class="cap-graph-svg" viewBox="${Math.floor(x0)} ${Math.floor(y0)} ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false"><defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="cap-graph-head"/></marker></defs>${edges.join("")}${nodes.join("")}</svg></div></figure>`;
}
