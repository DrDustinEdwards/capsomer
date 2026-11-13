// The QR code's drawing: each row's runs of dark modules as one rectangle, offset by the quiet zone.
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkQrUrl, qrPath, qrSize } from "../../components/qr/qr.ts";

test("qrPath draws each run of dark modules once, past the quiet zone", () => {
  const modules = [
    [true, true, false, true],
    [false, false, false, false],
    [false, true, true, true],
  ];
  assert.equal(qrPath(modules, 2), "M2 2h2v1h-2zM5 2h1v1h-1zM3 4h3v1h-3z");
  assert.equal(qrSize(modules, 2), 7);
});

test("only an absolute http(s) address is encoded", () => {
  assert.equal(checkQrUrl("https://example.com/a"), "https://example.com/a");
  assert.throws(() => checkQrUrl("/relative"), /absolute address/);
  assert.throws(() => checkQrUrl("javascript:alert(1)"), /absolute address/);
});
