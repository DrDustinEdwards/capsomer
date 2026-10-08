// Email templates: correctness and security only. Nothing here pins a design value.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FAMILIES, contrast } from "../../tokens/palette.mjs";
import { emailColours } from "../../components/email/colours.ts";
import { alert, checkUrl, escapeHtml, magicLink, notice, renderEmail, reset, verification } from "../../components/email/email.ts";

const FAKE = "https://carrel.example/auth/verify?t=EXAMPLE-NOT-A-TOKEN&x=1";
const common = { brand: { name: "Carrel", family: "purple" }, to: "reader@example.com" };
const link = { url: FAKE, expiresIn: "15 minutes" };
const all = [
  [magicLink, link],
  [verification, link],
  [reset, link],
  [alert, { level: "warn", what: "Disk is 91% full", when: "08:15 UTC", details: ["Free space: 9 GB."], url: FAKE }],
  [notice, { title: "Terms changed", body: ["First.", "Second."], action: { label: "Read", url: FAKE } }],
];

test("every template renders a subject, HTML and text from the same data", () => {
  for (const [t, data] of all) {
    const r = renderEmail(t, { ...common, ...data });
    assert.ok(r.subject.length > 0, t.name);
    assert.match(r.html, /^<!doctype html>/i);
    assert.match(r.html, /<html lang="en">/);
    assert.equal((r.html.match(/<h1\b/g) ?? []).length, 1, t.name);
    assert.ok(r.html.includes(`<title>${escapeHtml(r.subject)}</title>`));
    assert.ok(r.text.includes("reader@example.com"), `${t.name} text says who it was sent to`);
    assert.ok(r.text.startsWith("Carrel"));
  }
});

test("the text part holds the full link on its own line, and the HTML holds it once as the button", () => {
  for (const [t, data] of all.filter(([, d]) => d.url || d.action)) {
    const r = renderEmail(t, { ...common, ...data });
    assert.ok(r.text.split("\n").includes(FAKE), t.name);
    assert.equal(r.html.split(escapeHtml(FAKE)).length - 1, 1, t.name);
  }
});

test("a token is passed through untouched and appears nowhere else", () => {
  const r = renderEmail(magicLink, { ...common, ...link });
  assert.ok(r.html.includes("t=EXAMPLE-NOT-A-TOKEN&amp;x=1"));
  assert.equal(r.html.split("EXAMPLE-NOT-A-TOKEN").length - 1, 1);
  assert.equal(r.subject.includes("EXAMPLE"), false);
});

test("the security wording: who asked, works once, expires, ignore if not you", () => {
  for (const t of [magicLink, verification, reset]) {
    const r = renderEmail(t, { ...common, ...link });
    assert.match(r.text, /reader@example\.com/);
    assert.match(r.text, /works once and expires in 15 minutes/);
    assert.match(r.text, /If this was not you/);
  }
});

test("every value is escaped in the HTML", () => {
  const evil = `<script>alert("x")</script> & 'q'`;
  const fields = {
    brand: { name: evil, family: "purple" },
    to: evil,
    title: evil,
    body: [evil],
    what: evil,
    when: evil,
    details: [evil],
    expiresIn: evil,
    copy: { subject: evil, heading: evil, intro: evil, button: evil, ignore: evil },
    footer: [evil, { text: evil, url: FAKE }],
    lang: evil,
  };
  for (const [t, data] of all) {
    const r = renderEmail(t, { ...data, ...fields, url: data.url, action: data.action && { label: evil, url: FAKE } });
    assert.ok(!r.html.includes("<script>"), `${t.name} html`);
    assert.ok(!r.html.includes('lang="<'), t.name);
    assert.ok(r.html.includes("&lt;script&gt;"), t.name);
  }
});

test("a line break in a single-line value cannot add a line to the subject", () => {
  const r = renderEmail(notice, { ...common, title: "Hello\r\nBcc: x@example.com", body: [] });
  assert.equal(r.subject, "Hello Bcc: x@example.com");
});

test("links: only https and mailto, and a bad one throws", () => {
  assert.equal(checkUrl("https://a.example/p?q=1"), "https://a.example/p?q=1");
  assert.equal(checkUrl("mailto:help@a.example"), "mailto:help@a.example");
  for (const bad of ["javascript:alert(1)", "http://a.example", "data:text/html,x", "https://a.example/ x", 'https://a.example/"onclick="x', "/relative", "", "JaVaScRiPt:alert(1)", "https://a.example/\u0000"]) {
    assert.throws(() => checkUrl(bad), /email:/, bad);
  }
  assert.throws(() => renderEmail(magicLink, { ...common, ...link, url: "javascript:alert(1)" }), /email:/);
  assert.throws(() => renderEmail(notice, { ...common, title: "t", body: [], footer: [{ text: "x", url: "http://a.example" }] }), /email:/);
});

test("an alert carries its level as a word in the subject, the HTML and the text", () => {
  for (const [level, word] of [["crit", "Critical"], ["warn", "Warning"], ["info", "Notice"]]) {
    const r = renderEmail(alert, { ...common, level, what: "Something", when: "now" });
    assert.ok(r.subject.startsWith(`${word}:`));
    assert.ok(r.html.includes(`<strong>${word}.</strong>`));
    assert.ok(r.text.includes(`${word}. `));
  }
});

test("copy overrides the wording and nothing else; the footer slot is filled", () => {
  const r = renderEmail(magicLink, { ...common, ...link, copy: { subject: "Hi", heading: "Welcome", button: "Go" }, footer: ["Unsubscribe: reply STOP", { text: "Preferences", url: "https://carrel.example/prefs" }] });
  assert.equal(r.subject, "Hi");
  assert.ok(r.html.includes(">Go</a>") && r.html.includes(">Welcome</h1>"));
  assert.ok(r.text.includes("Preferences: https://carrel.example/prefs"));
  assert.ok(r.text.includes("Unsubscribe: reply STOP"));
});

test("an unknown family throws", () => {
  assert.throws(() => renderEmail(magicLink, { ...common, brand: { name: "X", family: "mauve" }, ...link }), /unknown family/);
});

test("the dark rules are present and the document asks for both schemes", () => {
  const r = renderEmail(magicLink, { ...common, ...link });
  assert.match(r.html, /<meta name="color-scheme" content="light dark">/);
  assert.match(r.html, /@media \(prefers-color-scheme: dark\)\{/);
  assert.ok(r.html.includes(emailColours.purple.dark.ground));
});

// ---- contrast ---------------------------------------------------------------------------------

// The pairs an email paints: body, muted and link text on the card and on the page, the button
// label on its fill, and each alert level on its soft ground.
const emailPairs = (c) => [
  ["text on the card", c.text, c.surface, 4.5],
  ["text on the page", c.text, c.ground, 4.5],
  ["muted on the card", c.muted, c.surface, 4.5],
  ["muted on the page", c.muted, c.ground, 4.5],
  ["link on the card", c["accent-text"], c.surface, 4.5],
  ["link on the page", c["accent-text"], c.ground, 4.5],
  ["button label", c["primary-fg"], c.primary, 4.5],
  ...["crit", "warn", "info"].map((l) => [`${l} note`, c[l], c[`${l}-soft`], 4.5]),
];
const failing = (c) => emailPairs(c).filter(([, fg, bg, min]) => contrast(fg, bg) < min).map(([what]) => what);

test("contrast: every family, both schemes, every pair an email paints is 4.5:1", () => {
  for (const name of Object.keys(FAMILIES)) {
    for (const scheme of ["light", "dark"]) assert.deepEqual(failing(emailColours[name][scheme]), [], `${name} ${scheme}`);
  }
});

test("contrast: the check fails on a planted low-contrast pair, so it can be trusted", () => {
  const planted = { ...emailColours.purple.light, "primary-fg": "#9a86c4", muted: "#b9b4c4" };
  assert.deepEqual(failing(planted), ["muted on the card", "muted on the page", "button label"]);
});
