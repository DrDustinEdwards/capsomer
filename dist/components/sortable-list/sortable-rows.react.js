// useRows: stable ids for a plain array of rows, so a sortable list of a form's repeatable rows keeps their fields and focus.
import { useId, useState } from "react";
// Stable ids for rows a host keeps as a plain array (a form's repeatable rows, with no id of their
// own). The ids follow each row as the list moves and removes them, so a row keeps its fields and its
// focus; a row the host adds gets a new one. Give `rows.items` to the list with `rows.getId`,
// `rows.onReorder` and `rows.onRemove`; `onChange` receives the new array.
export function useRows(value, onChange) {
    const prefix = useId();
    const [state, setState] = useState(() => ({
        ids: value.map((_, i) => `${prefix}-${i}`),
        next: value.length,
    }));
    let ids = state.ids;
    // The host may add or drop rows itself (Add, a reset): ids grow at the end and shrink from it.
    if (ids.length !== value.length) {
        const kept = ids.slice(0, value.length);
        let next = state.next;
        while (kept.length < value.length)
            kept.push(`${prefix}-${next++}`);
        ids = kept;
        setState({ ids: kept, next });
    }
    const items = value.map((v, index) => ({ id: ids[index] ?? "", value: v, index }));
    const onReorder = (order) => {
        const byId = new Map(ids.map((id, i) => [id, value[i]]));
        setState((s) => ({ ...s, ids: [...order] }));
        onChange(order.map((id) => byId.get(id)));
    };
    const onRemove = (id) => {
        const i = ids.indexOf(id);
        if (i < 0)
            return;
        setState((s) => ({ ...s, ids: ids.filter((x) => x !== id) }));
        onChange(value.filter((_, j) => j !== i));
    };
    return { items, getId: (r) => r.id, onReorder, onRemove };
}
