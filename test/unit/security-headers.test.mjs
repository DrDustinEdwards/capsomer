// The site's security headers: the generated _headers passes site-runtime's check against the
// set the site declared (the shared standard with its written-down deviations), keeps the hashed
// assets' cache rule, and the Worker's report endpoint carries the same set. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkSecurityHeaders, failures } from "@dustinedwards/site-runtime/check";
import { headersFile, REPORT_PATH, securityHeaders, standardHeaders } from "../../scripts/security-headers.ts";
import worker from "../../worker/index.ts";

// Each rule of a _headers file: its path pattern and the headers it sets.
function parseHeadersFile(text) {
  return text
    .trimEnd()
    .split("\n\n")
    .map((block) => {
      const [path, ...lines] = block.split("\n");
      const headers = new Headers();
      for (const line of lines) {
        const match = /^ {2}([A-Za-z-]+): (.+)$/.exec(line);
        assert.ok(match, `not a header line: ${JSON.stringify(line)}`);
        headers.append(match[1], match[2]);
      }
      return { path, headers };
    });
}

const check = (headers) =>
  failures(checkSecurityHeaders(headers, { standard: standardHeaders, cloudflareWebAnalytics: true }));

const assets = {
  async fetch() {
    return new Response("asset", { status: 200 });
  },
};

test("the generated _headers passes checkSecurityHeaders on every path", () => {
  const rules = parseHeadersFile(headersFile());
  assert.deepEqual(rules.map((r) => r.path), ["/*", "/assets/*"]);
  assert.deepEqual(check(rules[0].headers), []);
  assert.equal(rules[1].headers.get("Cache-Control"), "public, max-age=31536000, immutable");
});

test("the policy allows only what the site loads, and its own origin to frame it", () => {
  const policy = securityHeaders["Content-Security-Policy"];
  assert.match(policy, /style-src 'self';/);
  assert.match(policy, /img-src 'self' data:;/);
  assert.match(policy, /connect-src 'self' https:\/\/raw\.githubusercontent\.com;/);
  assert.match(policy, /frame-ancestors 'self';/);
  assert.doesNotMatch(policy, /'unsafe-/);
  assert.doesNotMatch(policy, /style-src-attr/);
  assert.match(policy, new RegExp(`report-uri ${REPORT_PATH}`));
  assert.equal(securityHeaders["X-Frame-Options"], "sameorigin");
});

test("the report endpoint answers 204 with the set and passes the check", async (t) => {
  const log = t.mock.method(console, "log", () => {});
  const response = await worker.fetch(
    new Request(`https://capsomer.dustinedwards.info${REPORT_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/reports+json" },
      body: JSON.stringify([
        {
          type: "csp-violation",
          body: {
            documentURL: "https://capsomer.dustinedwards.info/?q=private",
            blockedURL: "https://evil.example.com/x.js?token=1",
            effectiveDirective: "script-src-elem",
            disposition: "enforce",
          },
        },
      ]),
    }),
    { ASSETS: assets },
  );
  assert.equal(response.status, 204);
  assert.deepEqual(check(response.headers), []);
  assert.equal(log.mock.callCount(), 1);
  assert.doesNotMatch(JSON.stringify(log.mock.calls[0].arguments), /token=1|q=private/);
});

test("the Worker refuses other methods at the endpoint and hands every other path to the assets", async () => {
  const get = await worker.fetch(new Request(`https://capsomer.dustinedwards.info${REPORT_PATH}`), { ASSETS: assets });
  assert.equal(get.status, 405);
  const page = await worker.fetch(new Request("https://capsomer.dustinedwards.info/"), { ASSETS: assets });
  assert.equal(await page.text(), "asset");
});
