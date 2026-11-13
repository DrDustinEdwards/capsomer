import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in leaderboard.md. The rank is the list's own order, drawn by CSS.
export function Leaderboard({ entries, label = "Leaderboard", empty = "No scores yet.", format = (n) => n.toLocaleString("en-US"), }) {
    if (!entries.length)
        return _jsx("p", { className: "cap-leaderboard-empty", children: empty });
    return (_jsx("ol", { className: "cap-leaderboard", "aria-label": label, children: entries.map((e) => (_jsxs("li", { className: "cap-leaderboard-row", "aria-current": e.mine ? "true" : undefined, children: [_jsx("span", { className: "cap-leaderboard-name", children: e.name }), _jsx("span", { className: "cap-leaderboard-score", children: format(e.score) })] }, e.id))) }));
}
