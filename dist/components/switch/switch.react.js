import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { stateWord } from "./switch.js";
export function Switch(props) {
    const { label, checked, defaultChecked = false, onCheckedChange, onWord, offWord, busy, className, ...rest } = props;
    const [own, setOwn] = useState(defaultChecked);
    const on = checked ?? own;
    return (_jsxs("label", { className: className ? `cap-switch ${className}` : "cap-switch", children: [_jsx("input", { ...rest, type: "checkbox", role: "switch", "aria-busy": busy || undefined, checked: on, onChange: (e) => {
                    setOwn(e.target.checked);
                    onCheckedChange?.(e.target.checked);
                } }), " ", label, " ", _jsx("span", { className: "cap-switch-state", "aria-hidden": "true", children: stateWord(on, onWord, offWord) })] }));
}
