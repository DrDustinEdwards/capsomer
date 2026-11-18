import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useSyncExternalStore } from "react";
import { PushRefused, pushSupported, subscribePush } from "./web-push.js";
// For useSyncExternalStore: support never changes once known, so nothing to subscribe to.
const noSubscribe = () => () => { };
// The HTML contract in web-push.md.
export function PushDevices({ publicKey, worker, scope, devices, busy = false, note, problem, onTurnOn, onTurnOff, onTest, }) {
    // Support is known only in the browser; the server renders the button.
    const supported = useSyncExternalStore(noSubscribe, pushSupported, () => true);
    const [turning, setTurning] = useState(false);
    const [failed, setFailed] = useState(null);
    const shown = failed ?? note ?? null;
    const wait = busy || turning;
    const turnOn = async () => {
        if (!publicKey)
            return;
        setTurning(true);
        setFailed(null);
        try {
            const { subscription, label } = await subscribePush({ worker, scope, publicKey });
            await onTurnOn(subscription, label);
        }
        catch (e) {
            setFailed({
                kind: "crit",
                text: e instanceof PushRefused
                    ? e.message
                    : `Alerts were not turned on: ${e instanceof Error ? e.message : String(e)}`,
            });
        }
        finally {
            setTurning(false);
        }
    };
    return (_jsxs("div", { className: "cap-web-push", children: [_jsxs("div", { className: "cap-web-push-live", role: "status", children: [problem ? (_jsxs("div", { className: "cap-web-push-note", "data-tone": "warn", children: ["Not set up yet: ", problem] })) : null, shown && shown.kind !== "crit" ? (_jsx("div", { className: "cap-web-push-note", children: shown.text })) : null] }), shown?.kind === "crit" ? (_jsx("div", { className: "cap-web-push-note", "data-tone": "crit", role: "alert", children: shown.text })) : null, _jsxs("div", { className: "cap-web-push-actions", children: [supported ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "primary", disabled: wait || !publicKey, onClick: () => void turnOn(), children: "Turn on for this device" })) : (_jsx("span", { className: "cap-web-push-unsupported", children: "This browser cannot receive Web Push." })), _jsx("button", { type: "button", className: "cap-btn", disabled: wait || devices.length === 0 || !publicKey, onClick: onTest, children: "Send a test alert" })] }), devices.length > 0 ? (_jsx("ul", { className: "cap-web-push-devices", "aria-label": "Devices with alerts on", children: devices.map((d) => (_jsxs("li", { className: "cap-web-push-device", children: [_jsxs("span", { className: "cap-web-push-device-name", children: [d.label, " ", d.detail ? _jsx("span", { className: "cap-web-push-device-detail", children: d.detail }) : null] }), _jsxs("button", { type: "button", className: "cap-btn", disabled: wait, onClick: () => onTurnOff(d.id), children: ["Turn off", _jsxs("span", { className: "cap-sr-only", children: [" ", d.label] })] })] }, d.id))) })) : null] }));
}
