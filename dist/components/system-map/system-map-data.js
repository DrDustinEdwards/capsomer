// The system map's data shape, its hexagonal layout and the arrow keys' neighbors (system-map.ts).
// The word under a system and the group it is drawn in, in a stranger's words (Dustin,
// 2026-10-23: like goes with like, and the map should explain itself). An admin MCP sits in
// its app's group and says so.
const FAMILY_WORD = { system: "tool", writing: "writing", product: "app", plumbing: "tool", site: "site" };
const FAMILY_GROUP = { system: "Tools", writing: "Writing", product: "Apps", plumbing: "Tools", site: "Websites" };
/**
 * What the map draws from Capsid's public model, the same on every host: each system with its
 * word and, for what people use, its group, every line, and the parts with their kind (the box
 * under a part's name is sized for a word). `href` is where a system's "Open" goes.
 */
export function modelMapData(model, href) {
    return {
        systems: model.systems.map((s) => ({
            id: s.id,
            name: s.name,
            short: s.short,
            ring: s.ring,
            private: s.private,
            tag: s.ring === "core" ? undefined : s.ring === "shared" ? "shared" : s.id.endsWith("-mcp") ? "admin" : (FAMILY_WORD[s.family] ?? s.family),
            group: s.ring === "used" ? FAMILY_GROUP[s.family] : undefined,
            description: s.description,
            domain: s.domain || undefined,
            href: href?.(s.id),
        })),
        relationships: model.relationships.map(({ from, to, kind }) => ({ from, to, kind })),
        containers: model.containers.map(({ id, system, name, kind }) => ({ id, system, name, kind })),
    };
}
// ---------------------------------------------------------------------------------------
// Geometry. Flat-top hexagons in axial coordinates, ring by ring: ring 0 is one cell,
// ring k has 6k. A capsid seen down its three-fold axis has a hexagonal outline, which is
// why the disc reads as a shell.
export const R = 46;
const SQRT3 = Math.sqrt(3);
// Kinds drawn dashed: a line that coordinates or watches rather than carries.
export const LOOSE_KINDS = new Set(["coordinates", "watches"]);
export const STORE_KINDS = new Set(["database", "bucket", "kv", "queue"]);
export const EXTERNAL = "external";
export const BOX_W = 104;
export function ringCells(k) {
    if (k === 0)
        return [[0, 0]];
    const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    const out = [];
    let q = -k;
    let r = k;
    for (const [dq, dr] of dirs) {
        for (let j = 0; j < k; j++) {
            out.push([q, r]);
            q += dq;
            r += dr;
        }
    }
    return out;
}
const toXY = (q, r) => [Math.round(1.5 * R * q * 100) / 100, Math.round(SQRT3 * R * (r + q / 2) * 100) / 100];
const NEIGHBORS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const ringOf = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const key = (q, r) => `${q},${r}`;
// The size of a group's name, for room around the map: 11 px capitals, spaced.
const LABEL_CHAR = 8.4;
const LABEL_GAP = R + 12;
/**
 * The systems people use, in groups (Dustin, 2026-10-23: like goes with like, and a
 * stranger reads named groups, not rings): from the ring after the shared ones, each group
 * grows from its own direction, as near the middle as it can, its systems chained in the
 * order given, so each touches the one before it (a site beside its admin). No cell of
 * one group touches another group's, so the gaps say where a group ends. The groups go
 * round in the order they first appear, each given an arc in proportion to its size.
 */
function placeGroups(outer, start, taken) {
    const names = [...new Set(outer.map((s) => s.group ?? ""))];
    const total = outer.length;
    const owner = new Map();
    const out = new Map();
    let before = 0;
    names.forEach((name, gi) => {
        const members = outer.filter((s) => (s.group ?? "") === name);
        // The middle of its arc, from the lower left round, as a reader's eye goes.
        const angle = (3 * Math.PI) / 4 - (2 * Math.PI * (before + members.length / 2)) / total;
        before += members.length;
        const [ax, ay] = [Math.cos(angle) * (start + 0.6) * 1.5 * R, Math.sin(angle) * (start + 0.6) * 1.5 * R];
        let last = null;
        for (const s of members) {
            const candidates = [];
            const reach = start + members.length;
            for (let q = -reach; q <= reach; q++) {
                for (let r = -reach; r <= reach; r++) {
                    if (ringOf(q, r) < start || taken.has(key(q, r)))
                        continue;
                    const near = NEIGHBORS.map(([dq, dr]) => [q + dq, r + dr]);
                    if (near.some(([nq, nr]) => owner.has(key(nq, nr)) && owner.get(key(nq, nr)) !== gi))
                        continue;
                    const mine = near.filter(([nq, nr]) => owner.get(key(nq, nr)) === gi).length;
                    const touchesLast = last !== null && near.some(([nq, nr]) => nq === last[0] && nr === last[1]);
                    if (last !== null && mine === 0)
                        continue;
                    const [x, y] = toXY(q, r);
                    // Beside the one before it first, then near the group's direction and the middle,
                    // then among more of its own.
                    const score = (touchesLast || last === null ? 0 : 1e4) + Math.hypot(x - ax, y - ay) + ringOf(q, r) * 20 - mine * 10;
                    candidates.push({ q, r, score });
                }
            }
            candidates.sort((a, b) => a.score - b.score || a.q - b.q || a.r - b.r);
            const best = candidates[0];
            if (!best)
                throw new Error(`no room for ${s.id} in its group`);
            out.set(s.id, [best.q, best.r]);
            owner.set(key(best.q, best.r), gi);
            taken.set(key(best.q, best.r), s.id);
            last = [best.q, best.r];
        }
    });
    return out;
}
/**
 * Places the systems: the first core system in the middle; shared parts from ring 1,
 * spilling outward if there are more than fit; what people use from the ring after the
 * last shared one, or in their groups when they have them (placeGroups). Ungrouped,
 * every cell of every ring up to the last filled one is drawn, the unused ones as empty
 * shell. Systems keep the order they are given in.
 */
export function layoutMap(systems) {
    const core = systems.filter((s) => s.ring === "core");
    const inner = [...core.slice(1), ...systems.filter((s) => s.ring === "shared")];
    const outer = systems.filter((s) => s.ring === "used");
    const placed = [];
    const fill = (ids, startRing) => {
        let ring = startRing;
        let i = 0;
        while (i < ids.length) {
            for (const [q, r] of ringCells(ring))
                placed.push({ id: i < ids.length ? ids[i++] : null, ring, q, r });
            if (i < ids.length)
                ring++;
        }
        return ring;
    };
    placed.push({ id: core[0]?.id ?? null, ring: 0, q: 0, r: 0 });
    const lastInner = inner.length ? fill(inner.map((s) => s.id), 1) : 0;
    const grouped = outer.some((s) => s.group);
    if (!grouped) {
        const rings = outer.length ? fill(outer.map((s) => s.id), lastInner + 1) : lastInner;
        const cells = placed.map(({ id, ring, q, r }) => {
            const [x, y] = toXY(q, r);
            return { id, ring, x, y };
        });
        const halfW = 1.5 * R * rings + R + 6;
        const halfH = SQRT3 * R * rings + (SQRT3 * R) / 2 + 6;
        return { cells, rings, viewBox: [-halfW, -halfH, halfW * 2, halfH * 2], labels: [], grouped: false };
    }
    // The inner rings' leftover cells stay empty: the groups start outside them.
    const taken = new Map(placed.filter((p) => p.id).map((p) => [key(p.q, p.r), p.id]));
    const at = placeGroups(outer, lastInner + 1, taken);
    const rings = Math.max(lastInner, ...[...at.values()].map(([q, r]) => ringOf(q, r)));
    // Every cell to the outermost ring is in the layout, empty or not, as the lines walk
    // the seams of the gaps too; grouped, the empty ones are not drawn.
    const byCell = new Map([...at].map(([id, [q, r]]) => [key(q, r), id]));
    const cells = [];
    for (let k = 0; k <= rings; k++) {
        for (const [q, r] of ringCells(k)) {
            const [x, y] = toXY(q, r);
            const id = k <= lastInner ? (placed.find((p) => p.q === q && p.r === r)?.id ?? null) : (byCell.get(key(q, r)) ?? null);
            cells.push({ id, ring: k, x, y });
        }
    }
    // Each group's name just outside it, on the line from the middle through the group.
    const where = new Map(cells.filter((c) => c.id).map((c) => [c.id, c]));
    const labels = [...new Set(outer.map((s) => s.group ?? ""))].filter(Boolean).map((text) => {
        const pts = outer.filter((s) => s.group === text).map((s) => where.get(s.id));
        const cx = pts.reduce((n, p) => n + p.x, 0) / pts.length;
        const cy = pts.reduce((n, p) => n + p.y, 0) / pts.length;
        const len = Math.hypot(cx, cy) || 1;
        const far = Math.max(...pts.map((p) => (p.x * cx + p.y * cy) / len));
        // Clear of the outermost hexagon, and of it sideways by half the name.
        const d = far + LABEL_GAP + ((text.length * LABEL_CHAR) / 2) * Math.abs(cx / len);
        return { text, x: Math.round(((cx / len) * d) * 10) / 10, y: Math.round(((cy / len) * d + 4) * 10) / 10 };
    });
    let halfW = 1.5 * R * rings + R + 6;
    let halfH = SQRT3 * R * rings + (SQRT3 * R) / 2 + 6;
    for (const l of labels) {
        halfW = Math.max(halfW, Math.abs(l.x) + (l.text.length * LABEL_CHAR) / 2 + 6);
        halfH = Math.max(halfH, Math.abs(l.y) + 12);
    }
    return { cells, rings, viewBox: [-halfW, -halfH, halfW * 2, halfH * 2], labels, grouped: true };
}
const VECTORS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
/** The capsomer an arrow key moves to: the nearest one within 60 degrees of the arrow's
 *  direction, preferring the straight line; null at the edge of the map. */
export function spatialNext(tiles, from, dir) {
    const here = tiles.find((t) => t.id === from);
    if (!here)
        return null;
    const [dx, dy] = VECTORS[dir];
    let best = null;
    for (const t of tiles) {
        if (t.id === from)
            continue;
        const vx = t.x - here.x;
        const vy = t.y - here.y;
        const along = vx * dx + vy * dy;
        if (along <= 0)
            continue;
        const across = Math.abs(vx * dy - vy * dx);
        if (across > along * SQRT3)
            continue;
        const score = along + 2 * across;
        if (!best || score < best.score)
            best = { id: t.id, score };
    }
    return best?.id ?? null;
}
/** The lines a chosen capsomer shows: every relationship touching it whose other end is
 *  on the map. */
export function linksOf(links, id, onMap) {
    return links.filter((l) => (l.from === id || l.to === id) && onMap.has(l.from) && onMap.has(l.to) && l.from !== l.to);
}
/** The words the detail line ends with. */
export function connectionText(n) {
    return n === 0 ? "No connections drawn" : n === 1 ? "1 connection drawn" : `${n} connections drawn`;
}
