// The table's behavior: a sort button in a column header sorts the body rows by that
// column, toggling ascending and descending, and moves aria-sort to its header cell. Screen
// readers announce aria-sort themselves, so nothing else is announced. No framework.
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
// The value a cell sorts by: its data-sort attribute when it has one (a timestamp, a raw
// count), else its text. A plain number, with or without thousands separators, sorts as a
// number.
export function sortValue(cell) {
    const raw = (cell?.getAttribute("data-sort") ?? cell?.textContent ?? "").trim();
    if (/^-?\d[\d,]*(\.\d+)?$/.test(raw))
        return Number(raw.replaceAll(",", ""));
    return raw;
}
export function compareValues(a, b) {
    if (typeof a === "number" && typeof b === "number")
        return a - b;
    // Text, and a number against text, compare as text with digits read as numbers. An
    // empty cell sorts first ascending; give it a data-sort to place it elsewhere.
    return collator.compare(String(a), String(b));
}
// Sorts every tbody's rows of `table` by column `index`. Stable: equal rows keep their order.
export function sortRows(table, index, direction) {
    const sign = direction === "ascending" ? 1 : -1;
    for (const body of Array.from(table.tBodies)) {
        const rows = Array.from(body.rows);
        const keyed = rows.map((row) => ({ row, key: sortValue(row.cells[index]) }));
        keyed.sort((x, y) => sign * compareValues(x.key, y.key));
        body.append(...keyed.map((k) => k.row));
    }
}
// The column a header cell heads, counting the colspans before it.
export function columnIndex(th) {
    let i = 0;
    for (let c = th.previousElementSibling; c; c = c.previousElementSibling)
        i += c.colSpan || 1;
    return i;
}
// Sorts by the column of `th`: ascending first, then toggling. Only one header carries
// aria-sort at a time (APG sortable table). Returns the new direction.
export function sortByHeader(th, direction) {
    const table = th.closest("table");
    const next = direction ?? (th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending");
    if (!table)
        return next;
    for (const other of Array.from(table.querySelectorAll("thead th[aria-sort]")))
        if (other !== th)
            other.removeAttribute("aria-sort");
    th.setAttribute("aria-sort", next);
    sortRows(table, columnIndex(th), next);
    return next;
}
// Attaches to every [data-cap="table"] under root that is not attached yet. Returns a
// function that detaches them all. A table already marked sorted (aria-sort in its
// markup) is expected to arrive in that order; it is not re-sorted on attach.
export function enhance(root = document) {
    const undo = [];
    for (const wrap of Array.from(root.querySelectorAll("[data-cap='table']:not([data-cap-ready])"))) {
        wrap.dataset.capReady = "";
        const onClick = (e) => {
            const button = e.target.closest(".cap-table-sort");
            const th = button?.closest("th");
            if (button && th && wrap.contains(th))
                sortByHeader(th);
        };
        wrap.addEventListener("click", onClick);
        undo.push(() => {
            wrap.removeEventListener("click", onClick);
            delete wrap.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
