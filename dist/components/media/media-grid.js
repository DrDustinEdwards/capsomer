// The media grid's two-dimensional arrow keys.
// Visual rows: tiles within 6 px of one another share a row. A box with no width is not laid out.
export function bands(boxes) {
    const out = [];
    for (const r of boxes) {
        if (!r.width)
            continue;
        const entry = { id: r.id, mid: r.left + r.width / 2 };
        const band = out.find((b) => Math.abs(b.top - r.top) < 6);
        if (band)
            band.items.push(entry);
        else
            out.push({ top: r.top, items: [entry] });
    }
    out.sort((a, b) => a.top - b.top);
    for (const b of out)
        b.items.sort((x, y) => x.mid - y.mid);
    return out;
}
// The tile an arrow key moves to, or null to stay put. With nothing active, or an active id no
// longer on the page, the first tile. Left and right wrap across rows in reading order; up and
// down take the nearest tile by center in the next row, and stop at the edges. First and last
// are Home and End; prev and next step in reading order (the inspector's Alt+arrows).
export function nextTile(rows, active, dir) {
    const flat = rows.flatMap((b) => b.items.map((i) => i.id));
    const first = flat[0];
    if (first === undefined)
        return null;
    if (dir === "first")
        return first;
    if (dir === "last")
        return flat[flat.length - 1] ?? null;
    if (!active)
        return first;
    const at = flat.indexOf(active);
    if (at < 0)
        return first;
    if (dir === "prev")
        return flat[at - 1] ?? null;
    if (dir === "next")
        return flat[at + 1] ?? null;
    let ri = -1;
    let ci = -1;
    rows.forEach((b, i) => b.items.forEach((it, j) => {
        if (it.id === active) {
            ri = i;
            ci = j;
        }
    }));
    const row = rows[ri];
    const current = row?.items[ci];
    if (!row || !current)
        return null;
    if (dir === "left" || dir === "right") {
        const next = row.items[ci + (dir === "right" ? 1 : -1)];
        if (next)
            return next.id;
        return flat[at + (dir === "right" ? 1 : -1)] ?? null;
    }
    const band = rows[ri + (dir === "down" ? 1 : -1)];
    if (!band)
        return null;
    let best = band.items[0];
    let bestD = Infinity;
    for (const it of band.items) {
        const d = Math.abs(it.mid - current.mid);
        if (d < bestD) {
            bestD = d;
            best = it;
        }
    }
    return best?.id ?? null;
}
