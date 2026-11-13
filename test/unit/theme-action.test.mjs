// The theme's server route and the cookie-aware pre-paint script: an open redirect or a stale choice overruling the
// server's answer are the mistakes these guard.
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import {
  themeAction,
  themeReturnTo,
  themeScript,
} from "../../components/theme-switch/theme-server.ts";

const post = (body, headers = {}) =>
  new Request("https://example.com/theme", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
  });

test("themeReturnTo: only this site's own page; another host, a protocol-relative path or junk is home", () => {
  const at = (referer) =>
    themeReturnTo(
      new Request("https://example.com/theme", { headers: referer ? { referer } : {} }),
    );
  assert.equal(at("https://example.com/field-notes?page=2"), "/field-notes?page=2");
  assert.equal(at("https://evil.example/x"), "/");
  assert.equal(at("https://example.com//evil.example/x"), "/");
  assert.equal(at("not a url"), "/");
  assert.equal(at(null), "/");
});

test("themeAction: a form post sets the cookie and goes back; a fetch gets 204; a bad choice is 400; save runs first", async () => {
  const saved = [];
  const form = await themeAction(
    post("theme=dark", { referer: "https://example.com/release-notes" }),
    {
      cookie: "site_theme",
      save: (c) => void saved.push(c),
    },
  );
  assert.equal(form.status, 303);
  assert.equal(form.headers.get("location"), "/release-notes");
  assert.match(form.headers.get("set-cookie"), /^site_theme=dark; Path=\/;/);
  assert.equal(form.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(saved, ["dark"]);

  const json = await themeAction(
    post(JSON.stringify({ theme: "light" }), { "content-type": "application/json" }),
    {
      cookie: false,
    },
  );
  assert.equal(json.status, 204);
  assert.equal(json.headers.get("set-cookie"), null);

  for (const body of ["theme=system", "", `theme=dark&x=${"a".repeat(2000)}`])
    assert.equal((await themeAction(post(body))).status, 400, body.slice(0, 20));
});

// Runs the pre-paint script against a page whose server wrote `served`, with this cookie and this browser memory.
function boot(script, { served = null, cookie = "", stored = null }) {
  const attrs = new Map(served ? [["data-theme", served]] : []);
  const documentElement = {
    hasAttribute: (n) => attrs.has(n),
    setAttribute: (n, v) => attrs.set(n, v),
  };
  vm.runInNewContext(script, {
    document: { documentElement, cookie },
    localStorage: { getItem: () => stored },
  });
  return attrs.get("data-theme") ?? null;
}

test("themeScript with a cookie: the server's answer stands; else the cookie's; else this browser's", () => {
  const script = themeScript("site-theme", { cookie: "site_theme" });
  assert.equal(
    boot(script, { served: "dark", cookie: "site_theme=light", stored: "light" }),
    "dark",
  );
  assert.equal(boot(script, { cookie: "a=1; site_theme=dark; b=2", stored: "light" }), "dark");
  assert.equal(boot(script, { cookie: "xsite_theme=dark", stored: "light" }), "light");
  assert.equal(boot(script, { cookie: "site_theme=system" }), null);
  // The 0.1.0 script, unchanged with no options: sites allow it by its hash.
  assert.equal(boot(themeScript("site-theme"), { served: "dark", stored: "light" }), "light");
});
