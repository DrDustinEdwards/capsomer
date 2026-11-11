// The device name a phone alert subscription is stored under: browser and system, nothing more.
import assert from "node:assert/strict";
import { test } from "node:test";
import { deviceLabel } from "../../components/web-push/web-push.ts";

test("deviceLabel: browser and system from the user agent", () => {
  const chromeAndroid =
    "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36";
  const safariIos =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const edgeWindows =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 Edg/141.0";
  assert.equal(deviceLabel(chromeAndroid), "Chrome on Android");
  assert.equal(deviceLabel(safariIos), "Safari on iOS");
  assert.equal(deviceLabel(edgeWindows), "Edge on Windows");
  assert.equal(deviceLabel(""), "A browser on this device");
});
