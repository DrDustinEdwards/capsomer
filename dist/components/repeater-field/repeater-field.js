// The repeater's pure parts, safe on the server: reading its rows back from a posted form. No DOM.
// The posted name of one row's field: `links[2][url]`.
export const rowFieldName = (name, index, key) => `${name}[${index}][${key}]`;
// The rows a form posted for `name`, with the keys asked for. With script the repeater can post
// them as one JSON array under `name` (its `json` prop); without, each field is posted on its own
// as `name[i][key]`. Either is read here. A row whose every value is empty is dropped (a spare
// row nobody filled), and values are trimmed. A JSON field that is not an array of objects is
// null, so the action answers with an error rather than saving an empty list over the old one.
export function rowsFromForm(form, name, keys) {
    const own = form.get(name);
    let rows;
    if (typeof own === "string") {
        let parsed;
        try {
            parsed = JSON.parse(own);
        }
        catch {
            return null;
        }
        if (!Array.isArray(parsed) || !parsed.every((r) => typeof r === "object" && r !== null))
            return null;
        rows = parsed.map((r) => Object.fromEntries(keys.map((k) => [k, typeof r[k] === "string" ? r[k].trim() : ""])));
    }
    else {
        const found = new Map();
        const pattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\[(\\d+)\\]\\[([^\\]]+)\\]$`);
        for (const [field, value] of form.entries()) {
            const m = pattern.exec(field);
            if (!m || typeof value !== "string" || !keys.includes(m[2]))
                continue;
            const i = Number(m[1]);
            const row = found.get(i) ?? Object.fromEntries(keys.map((k) => [k, ""]));
            row[m[2]] = value.trim();
            found.set(i, row);
        }
        rows = [...found.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
    }
    return rows.filter((r) => keys.some((k) => r[k] !== ""));
}
