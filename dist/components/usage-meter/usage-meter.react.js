import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { dataTableBlock } from "enarratio";
import { Meter } from "../meter/meter.react.js";
import { Glyph } from "../status/status.react.js";
import { assess, usageTable } from "./usage-meter.js";
function UsageRow({ item, a, stale }) {
    const spoken = `${item.amountSpoken ?? item.amount}, ${a.projection}${stale ? ", reading is stale" : ""}`;
    // The row is the shared meter (components/meter): its bar, tone word and amount; the why
    // line goes after the bar.
    return (_jsx(Meter, { as: "li", className: "cap-usage-item", label: item.name, value: item.used, max: item.limit, display: item.amount, valueText: spoken, tone: a.tone, words: { warn: a.label, crit: a.label }, projected: a.projectedAtReset == null ? undefined : Math.round(a.projectedAtReset), after: _jsxs("p", { className: "cap-usage-why", children: [_jsx("strong", { className: "cap-usage-lead", children: a.lead }), a.text.slice(a.lead.length)] }) }));
}
export function UsageMeter({ items, now = Date.now(), freshness, stale = false, legend = true, tableLabel = "Usage against free limits" }) {
    return (_jsxs("div", { className: "cap-usage", "data-cap": "usage-meter", "data-cap-ready": "", children: [freshness != null && (_jsxs("p", { className: "cap-usage-fresh", "data-stale": stale ? "" : undefined, children: [stale && (_jsxs("span", { className: "cap-status", "data-tone": "warn", children: [_jsx(Glyph, { name: "warn" }), "Stale"] })), _jsx("span", { children: freshness })] })), _jsx("ul", { className: "cap-usage-list", children: items.map((item) => (_jsx(UsageRow, { item: item, stale: stale, a: assess({ used: item.used, limit: item.limit, history: item.history, resetsAt: item.resetsAt, now, unit: item.unit, atLimit: item.atLimit }) }, item.id))) }), legend && (_jsxs("ul", { className: "cap-usage-legend", "aria-label": "Key", children: [_jsxs("li", { children: [_jsx("span", { className: "cap-usage-key", "data-key": "used", "aria-hidden": "true" }), "Solid: used"] }), _jsxs("li", { children: [_jsx("span", { className: "cap-usage-key", "data-key": "projected", "aria-hidden": "true" }), "Hatched: where the day ends at the current rate"] })] })), _jsx("div", { className: "cap-data", dangerouslySetInnerHTML: { __html: dataTableBlock(usageTable(items.map((item) => ({ ...item, now }))), tableLabel) } })] }));
}
