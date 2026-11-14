import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCount } from "@drdustinedwards/site-helpers/text";
import { Icon } from "../icons/icons.react.js";
import { iconHeart } from "../icons/icons.js";
// The HTML contract in like-button.md. Pending keeps focus on the button (aria-disabled, not
// disabled, which would drop it) and ignores presses.
export function LikeButton({ liked, count, onChange, label, pending, disabled, error, }) {
    return (_jsxs("div", { className: "cap-like", children: [_jsxs("button", { type: "button", className: "cap-like-button", "aria-pressed": liked, "aria-busy": pending ? "true" : undefined, "aria-disabled": pending ? "true" : undefined, disabled: disabled, onClick: () => {
                    if (!pending)
                        onChange?.(!liked);
                }, children: [_jsx(Icon, { d: iconHeart }), _jsxs("span", { className: "cap-sr-only", children: [label ? `Like ${label}` : "Like", ", "] }), _jsx("span", { children: formatCount(count) })] }), error ? (_jsx("p", { className: "cap-like-error", role: "alert", children: error })) : null] }));
}
