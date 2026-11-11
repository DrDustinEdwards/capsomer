// A mention's addresses were chosen by a stranger: httpHref is the one check on the value that
// reaches the href (moved from dustinedwards.info, test/webmention-href.test.mjs).
import assert from "node:assert/strict";
import { test } from "node:test";
import { httpHref, sitePath } from "../../components/related-links/related-links.ts";

test("http and https pass, as the parser's own output", () => {
  assert.equal(httpHref("https://a.example/post"), "https://a.example/post");
  assert.equal(httpHref("http://a.example/post"), "http://a.example/post");
  assert.equal(httpHref("https://a.example"), "https://a.example/");
});

test("every other scheme, a relative address and absence are refused", () => {
  const refused = [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "\tjavascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "mailto:someone@example.com",
    "ftp://a.example/x",
    "/relative/path",
    "//protocol-relative",
    "not a url",
    "",
    null,
    undefined,
  ];
  for (const value of refused) assert.equal(httpHref(value), null, `${value} was not refused`);
});

test("sitePath takes a path on this site, never a protocol-relative address", () => {
  assert.equal(sitePath("/writing/getting-started"), true);
  for (const value of [
    "//evil.example/x",
    "/\\evil.example",
    "https://a.example/",
    "writing/x",
    "",
    null,
  ]) {
    assert.equal(sitePath(value), false, `${value} passed`);
  }
});
