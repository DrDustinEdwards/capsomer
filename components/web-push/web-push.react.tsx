import { useState, useSyncExternalStore, type ReactNode } from "react";
import { PushRefused, pushSupported, subscribePush } from "./web-push.ts";

// For useSyncExternalStore: support never changes once known, so nothing to subscribe to.
const noSubscribe = () => () => {};

export interface PushDevice {
  id: string | number;
  label: ReactNode;
  // "turned on 3 days ago, last alert an hour ago"
  detail?: ReactNode;
}

export type PushNote = { kind: "ok" | "crit"; text: ReactNode };

export interface PushDevicesProps {
  // The server's VAPID public key; null while it is not set up.
  publicKey: string | null;
  // The worker to register (push-sw.js as the site serves it) and its scope.
  worker: string;
  scope: string;
  devices: PushDevice[];
  // A request is in flight: the controls wait.
  busy?: boolean;
  // The result of the last change, from the app (or set here when turning on fails).
  note?: PushNote | null;
  // What the setup still needs, in the server's words.
  problem?: ReactNode;
  // Send the new subscription to the server.
  onTurnOn: (subscription: PushSubscriptionJSON, label: string) => Promise<void> | void;
  onTurnOff: (id: PushDevice["id"]) => void;
  onTest: () => void;
}

// The HTML contract in web-push.md.
export function PushDevices({
  publicKey,
  worker,
  scope,
  devices,
  busy = false,
  note,
  problem,
  onTurnOn,
  onTurnOff,
  onTest,
}: PushDevicesProps) {
  // Support is known only in the browser; the server renders the button.
  const supported = useSyncExternalStore(noSubscribe, pushSupported, () => true);
  const [turning, setTurning] = useState(false);
  const [failed, setFailed] = useState<PushNote | null>(null);
  const shown = failed ?? note ?? null;
  const wait = busy || turning;
  const turnOn = async () => {
    if (!publicKey) return;
    setTurning(true);
    setFailed(null);
    try {
      const { subscription, label } = await subscribePush({ worker, scope, publicKey });
      await onTurnOn(subscription, label);
    } catch (e) {
      setFailed({
        kind: "crit",
        text:
          e instanceof PushRefused
            ? e.message
            : `Alerts were not turned on: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setTurning(false);
    }
  };
  return (
    <div className="cap-web-push">
      {/* Mounted from the start, so a note that appears in it is read (a region added with its
          text often is not). A failure is an alert, which is read as it is added. */}
      <div className="cap-web-push-live" role="status">
        {problem ? (
          <div className="cap-web-push-note" data-tone="warn">
            Not set up yet: {problem}
          </div>
        ) : null}
        {shown && shown.kind !== "crit" ? (
          <div className="cap-web-push-note">{shown.text}</div>
        ) : null}
      </div>
      {shown?.kind === "crit" ? (
        <div className="cap-web-push-note" data-tone="crit" role="alert">
          {shown.text}
        </div>
      ) : null}
      <div className="cap-web-push-actions">
        {supported ? (
          <button
            type="button"
            className="cap-btn"
            data-variant="primary"
            disabled={wait || !publicKey}
            onClick={() => void turnOn()}
          >
            Turn on for this device
          </button>
        ) : (
          <span className="cap-web-push-unsupported">This browser cannot receive Web Push.</span>
        )}
        <button
          type="button"
          className="cap-btn"
          disabled={wait || devices.length === 0 || !publicKey}
          onClick={onTest}
        >
          Send a test alert
        </button>
      </div>
      {devices.length > 0 ? (
        <ul className="cap-web-push-devices" aria-label="Devices with alerts on">
          {devices.map((d) => (
            <li key={d.id} className="cap-web-push-device">
              <span className="cap-web-push-device-name">
                {d.label}{" "}
                {d.detail ? <span className="cap-web-push-device-detail">{d.detail}</span> : null}
              </span>
              <button
                type="button"
                className="cap-btn"
                disabled={wait}
                onClick={() => onTurnOff(d.id)}
              >
                Turn off<span className="cap-sr-only"> {d.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
