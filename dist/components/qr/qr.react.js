import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { checkQrUrl, qrLabel, qrPath, qrSize } from "./qr.js";
// The HTML contract in qr.md.
export function Qr(props) {
    const { url, modules, quiet = 2, caption, showUrl = true, label = qrLabel(url), size } = props;
    checkQrUrl(url);
    const box = qrSize(modules, quiet);
    return (_jsxs("figure", { className: "cap-qr", "data-size": size, children: [_jsxs("svg", { className: "cap-qr-code", viewBox: `0 0 ${box} ${box}`, role: "img", "aria-label": label, shapeRendering: "crispEdges", children: [_jsx("rect", { width: box, height: box, fill: "#ffffff" }), _jsx("path", { d: qrPath(modules, quiet), fill: "#000000" })] }), caption || showUrl ? (_jsxs("figcaption", { className: "cap-qr-caption", children: [caption, showUrl ? _jsx("span", { className: "cap-qr-url", children: url }) : null] })) : null] }));
}
