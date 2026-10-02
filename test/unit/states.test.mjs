// The states generator: every page it writes is a whole valid document with one h1 and one
// main, keeps its <template data-specimen> blocks, and hoists links and scripts. Correctness
// only; nothing here pins a design value.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generateStates, renderStates, splitExamples } from "../../bin/states.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const template = readFileSync(join(ROOT, "site", "states-template.html"), "utf8");

// Elements outside every <template>, which is what the page itself holds.
const outsideTemplates = (html) => html.replace(/<template\b[\s\S]*?<\/template>/g, "");
const count = (html, re) => (outsideTemplates(html).match(re) ?? []).length;

const EXAMPLES = `<link rel="stylesheet" href="./specimen/x.css" />

<section class="cap-specimen" aria-labelledby="s-a">
  <h2 id="s-a">A</h2>
  <pre>  keep
    this</pre>
</section>

<template data-specimen="page" data-title="Page" data-height="300">
  <main class="specimen-page"><h1>Inside</h1><script>window.inTemplate = 1;</script></main>
</template>

<script type="module">
  window.ran = true;
</script>
`;

test("renderStates: one h1, one main, escaped title and summary", () => {
  const html = renderStates({ template, title: "Tom & <Jerry>", summary: "It's \"quoted\" & <b>", examples: EXAMPLES, hasTsx: false });
  assert.match(html, /^<!doctype html>/i);
  assert.equal(count(html, /<h1\b/g), 1);
  assert.equal(count(html, /<main\b/g), 1);
  assert.equal(count(html, /<\/main>/g), 1);
  assert.match(html, /<title>Tom &amp; &lt;Jerry&gt;: states<\/title>/);
  assert.ok(!html.includes("<Jerry>") && !html.includes("<b>"));
  assert.match(html, /<script type="module" src="..\/..\/site\/specimen\.ts"><\/script>/);
});

test("renderStates: keeps template specimens untouched, hoists links and scripts", () => {
  const html = renderStates({ template, title: "X", summary: "y", examples: EXAMPLES, hasTsx: true });
  assert.ok(html.includes('<template data-specimen="page" data-title="Page" data-height="300">'));
  assert.ok(html.includes("<h1>Inside</h1><script>window.inTemplate = 1;</script>"), "template content is unchanged");
  assert.ok(html.includes("  keep\n    this"), "pre-formatted text is unchanged");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.ok(head.includes('href="./specimen/x.css"'), "a link goes to the head");
  const page = outsideTemplates(html);
  const main = page.slice(page.indexOf("<main>"), page.indexOf("</main>") + 7);
  assert.ok(!/<script\b/.test(main), "no script left inside the main outside a template");
  assert.ok(page.indexOf("window.ran = true") > page.indexOf("</main>"));
  assert.ok(html.includes('<script type="module" src="./examples.tsx"></script>'));
});

test("splitExamples: only what is outside a template moves", () => {
  const { body, head, scripts } = splitExamples(EXAMPLES);
  assert.equal(head.length, 1);
  assert.equal(scripts.length, 1);
  assert.ok(body.includes('window.inTemplate = 1;'));
  assert.ok(!body.includes("window.ran"));
});

test("generateStates: writes a page for each component with examples, none without", () => {
  const dir = mkdtempSync(join(tmpdir(), "cap-states-"));
  mkdirSync(join(dir, "site"));
  writeFileSync(join(dir, "site", "states-template.html"), template);
  for (const name of ["alpha", "beta", "gamma"]) mkdirSync(join(dir, "components", name), { recursive: true });
  writeFileSync(join(dir, "components", "alpha", "alpha.md"), "---\nname: alpha\ntitle: Alpha part\nsummary: 'The alpha''s job.'\n---\nBody\n");
  writeFileSync(join(dir, "components", "alpha", "examples.html"), EXAMPLES);
  writeFileSync(join(dir, "components", "beta", "examples.tsx"), "export {};\n");
  writeFileSync(join(dir, "components", "gamma", "gamma.md"), "---\nname: gamma\n---\n");
  assert.deepEqual(generateStates(dir).sort(), ["alpha", "beta"]);
  const alpha = readFileSync(join(dir, "components", "alpha", "states.html"), "utf8");
  assert.match(alpha, /<h1>Alpha part<\/h1>\s*<p>The alpha's job\.<\/p>/);
  const beta = readFileSync(join(dir, "components", "beta", "states.html"), "utf8");
  assert.match(beta, /<h1>beta<\/h1>/, "falls back to the folder name without a doc page");
  assert.ok(beta.includes('src="./examples.tsx"'));
  assert.ok(!existsSync(join(dir, "components", "gamma", "states.html")));
});

test("every component's examples.html makes a valid page: one h1, one main, a heading per specimen", () => {
  const names = readdirSync(join(ROOT, "components"), { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(ROOT, "components", d.name, "examples.html")));
  assert.ok(names.length > 0);
  for (const d of names) {
    const examples = readFileSync(join(ROOT, "components", d.name, "examples.html"), "utf8");
    assert.ok(!/<(?:html|head|body)\b/i.test(outsideTemplates(examples)), `${d.name}: examples.html is inner markup only`);
    assert.ok(!/<h1\b/i.test(outsideTemplates(examples)) && !/<main\b/i.test(outsideTemplates(examples)), `${d.name}: the template supplies the h1 and the main`);
    const html = renderStates({ template, title: d.name, summary: "s", examples, hasTsx: false });
    assert.equal(count(html, /<h1\b/g), 1, `${d.name}: one h1`);
    assert.equal(count(html, /<main\b/g), 1, `${d.name}: one main`);
    const templates = (examples.match(/<template\b/g) ?? []).length;
    assert.equal((html.match(/<template\b/g) ?? []).length, templates, `${d.name}: every template specimen kept`);
  }
});
