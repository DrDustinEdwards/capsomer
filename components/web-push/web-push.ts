// Phone alerts in the browser: whether this browser can take Web Push, a short name for the
// device, and turning it on (permission, the service worker, the subscription). The site's server
// keeps the subscriptions and sends the alerts; push-sw.js beside this file shows them.
import { guessPlatform } from "../tabs/tabs.ts";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

const SYSTEM_NAMES = {
  ios: "iOS",
  android: "Android",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  none: "this device",
} as const;

// "Chrome on Android": enough to tell two devices apart, and nothing more.
export function deviceLabel(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "A browser";
  const os = SYSTEM_NAMES[guessPlatform(ua) ?? "none"];
  return `${browser} on ${os}`;
}

export class PushRefused extends Error {}

// Asks for permission, registers the worker and subscribes (or returns the subscription this
// browser already has). Throws PushRefused when the person or the browser said no.
export async function subscribePush(opts: {
  worker: string;
  scope: string;
  publicKey: string;
}): Promise<{ subscription: PushSubscriptionJSON; label: string }> {
  if ((await Notification.requestPermission()) !== "granted")
    throw new PushRefused(
      "This browser did not allow notifications. Allow them for this site in the browser's settings, then try again.",
    );
  const reg = await navigator.serviceWorker.register(opts.worker, { scope: opts.scope });
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: opts.publicKey,
    }));
  return { subscription: sub.toJSON(), label: deviceLabel(navigator.userAgent) };
}
