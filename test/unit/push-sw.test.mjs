// The push worker (components/web-push/push-sw.js): a tapped alert opens the url its push named only
// when that url is on the worker's own scope. Any other url, or none, opens the scope itself, so a
// push can never send the phone to another site. Moved from the Capsid Portal's portal-sw test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const SCOPE = "https://portal.example.com/";
const source = readFileSync(
  new URL("../../components/web-push/push-sw.js", import.meta.url),
  "utf8",
);

function win(url) {
  const w = { url, focused: 0, went: [] };
  w.focus = async () => (w.focused++, w);
  w.navigate = async (u) => (w.went.push(u), (w.url = u), w);
  return w;
}

async function tap(data, windows = []) {
  const handlers = {};
  const opened = [];
  const self = {
    registration: { scope: SCOPE },
    clients: {
      matchAll: async () => windows,
      openWindow: async (u) => opened.push(u),
      claim: async () => {},
    },
    skipWaiting: () => {},
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
  };
  vm.runInNewContext(source, { self, URL });
  let done = Promise.resolve();
  handlers.notificationclick({
    notification: { data, close: () => {} },
    waitUntil: (p) => (done = p),
  });
  await done;
  const moved = windows.flatMap((w) => w.went);
  assert.equal(opened.length + moved.length, 1, "a tap opened or moved more than one page");
  return opened[0] ?? moved[0];
}

test("an alert's url on the scope opens as sent, in an open tab of the site when there is one", async () => {
  assert.equal(await tap({ url: `${SCOPE}#/attention` }), `${SCOPE}#/attention`);
  assert.equal(await tap({ url: "/queue" }), `${SCOPE}queue`);
  const other = win("https://elsewhere.example.com/");
  const site = win(`${SCOPE}health`);
  assert.equal(
    await tap({ url: `${SCOPE}queue/job/job_1` }, [other, site]),
    `${SCOPE}queue/job/job_1`,
  );
  assert.deepEqual(other.went, [], "a tab off the scope was moved");
  assert.equal(site.focused, 1);
});

test("PLANT: a url off the scope, or none, opens the scope itself", async () => {
  for (const url of [
    "https://evil.example.com/",
    "//evil.example.com/x",
    "javascript:alert(1)",
    "https://portal.example.com.evil.example.com/",
    "http://[",
    42,
  ]) {
    assert.equal(await tap({ url }), SCOPE, String(url));
  }
  assert.equal(await tap(null), SCOPE);
  assert.equal(await tap({ url: "https://evil.example.com/" }, [win(`${SCOPE}prs`)]), SCOPE);
});
