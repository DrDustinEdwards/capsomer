// The public pages of https://capsomer.dustinedwards.info: the front page, written into site/home.html,
// and each component's page at /components/<name>/, written into a copy of site/component.html, both at
// build time (site/vite.config.ts), so they are whole HTML that reads without a script; site/home-main.ts
// adds the header's behavior, the family preview, the type sample, the component filter, the copy button
// and the live test count, and site/redirect.ts sends old admin links on. Its look is Supergraphics (Barbara Stauffacher Solomon, The Sea Ranch, 1966):
// flat letter tiles too big for the page, cut by its edge, painted in Capsomer's own families.
// The dashboard of tests, pairs and changes is the admin at /admin/ (site/main.tsx).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { familyFooterHtml } from "../components/family-footer/family-footer.ts";
import { letterheadHtml } from "../components/site-header/site-header.ts";
import { frontmatter } from "@drdustinedwards/site-helpers/frontmatter";
import { renderMarkdown } from "./markdown.ts";

// Magenta is the public site's own family, on its root; the six are the ones it shows.
type Family = "purple" | "fox" | "teal" | "amber" | "navy" | "forest" | "magenta";
const FAMILIES: Family[] = ["purple", "fox", "teal", "amber", "navy", "forest"];
const NAMES: Record<Family, string> = { purple: "Purple", fox: "Fox", teal: "Teal", amber: "Amber", navy: "Navy", forest: "Forest", magenta: "Magenta" };

interface Component {
  name: string;
  title: string;
  summary: string;
  // The whole summary, the doc page's body under its title, and its facts, for the component's own page.
  lead: string;
  body: string;
  parts: string[];
  added: string;
  states: number;
  // Each example in examples.html, for a preview with its code; the React wrapper's exports.
  examples: Example[];
  react: string[];
  behavior: string[];
  md: string;
}
interface Example {
  id: string;
  title: string;
  code: string;
  // "example": a section of the states page (?example=<heading id>); "only": a page-level template (?only=<id>).
  kind: "example" | "only";
  height: number;
}
export interface Data {
  version: string;
  components: Component[];
  families: Record<string, { seed: string; note: string }>;
  pairs: { total: number; failing: number } | null;
  // Each family's accent text on its surface, light then dark: the pair the Albers squares name.
  accentText: Record<string, [number, number]>;
  tests: { passed: number; failed: number } | null;
  type: Array<[string, string, string]>;
  defaults: Array<{ lead: string; reason: string }>;
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Backticks in a summary become code, as on the admin's pages.
const prose = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const fam = (f: Family) => ` data-family="${f}"`;
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
// The markup as an app writes it: no forced demo states, indented from the left edge.
const tidy = (html: string) => {
  const lines = html.replace(/\s+data-force="[^"]*"/g, "").replace(/^\s*\n|\n\s*$/g, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)?.[0].length ?? 0));
  return lines.map((l) => l.slice(indent)).join("\n");
};

/** The examples in a component's examples.html: each top-level specimen section (nested sections counted) and each page-level template. */
function examplesOf(html: string): Example[] {
  const out: Example[] = [];
  const open = /<section class="cap-specimen" aria-labelledby="([^"]+)">/g;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    let depth = 1;
    const tag = /<(\/?)section\b/g;
    tag.lastIndex = open.lastIndex;
    let end = -1;
    for (let t = tag.exec(html); t; t = tag.exec(html)) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    if (end < 0) break;
    const body = html.slice(open.lastIndex, end);
    const id = m[1] ?? "";
    const h = new RegExp(`<h2 id="${id}">([\\s\\S]*?)</h2>`).exec(body);
    out.push({ id, title: plain(h?.[1] ?? id), code: tidy(body.replace(h?.[0] ?? "", "")), kind: "example", height: 0 });
    open.lastIndex = end;
  }
  for (const t of html.matchAll(/<template data-specimen="([^"]+)" data-title="([^"]*)"(?: data-height="(\d+)")?[^>]*>([\s\S]*?)<\/template>/g)) {
    out.push({ id: t[1] ?? "", title: plain(t[2] ?? ""), code: tidy(t[4] ?? ""), kind: "only", height: Number(t[3] ?? 360) });
  }
  return out;
}

const json = (path: string) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);

/** Everything the page says, read from the repo and the site's data files (capsomer site-data). `examples` is each component's examples.html as the states generator filled it. */
export function readData(root: string, examples: Map<string, string>): Data {
  const dir = resolve(root, "components");
  const components = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(dir, d.name, `${d.name}.md`)))
    .map((d) => {
      const { data, body } = frontmatter(readFileSync(resolve(dir, d.name, `${d.name}.md`), "utf8"));
      const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
      const list = (k: string) => (Array.isArray(data[k]) ? (data[k] as string[]) : []);
      return {
        name: d.name,
        title: str("title") || d.name,
        // The summary's first sentence: the page lists every component, so each says one thing.
        summary: str("summary").replace(/^(.+?[.!?])\s.*$/s, "$1"),
        lead: str("summary"),
        // Without its title, and without an "Exceptions in production" that has none to list.
        body: body.replace(/^\s*#\s+.*\n/, "").replace(/\n## Exceptions in production\n+None yet\.\n?/, "\n"),
        parts: list("parts"),
        added: str("added") || "0.1.0",
        states: list("states").length,
        examples: examplesOf(examples.get(d.name) ?? ""),
        behavior: existsSync(resolve(dir, d.name, `${d.name}.ts`))
          ? [...readFileSync(resolve(dir, d.name, `${d.name}.ts`), "utf8").matchAll(/^export (?:async )?function (\w+)/gm)].map((x) => x[1] ?? "")
          : [],
        md: frontmatter(readFileSync(resolve(dir, d.name, `${d.name}.md`), "utf8")).body,
        react: existsSync(resolve(dir, d.name, `${d.name}.react.tsx`))
          ? [...readFileSync(resolve(dir, d.name, `${d.name}.react.tsx`), "utf8").matchAll(/^export (?:function|const) ([A-Z]\w*)/gm)].map((x) => x[1] ?? "")
          : [],
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  const fams = json(resolve(root, "site/data/families.json"));
  const results = json(resolve(root, "site/data/results.json"));
  const tokens = json(resolve(root, "tokens/tokens.json"));
  const type = Object.entries((tokens?.type ?? {}) as Record<string, { $value: unknown; $description?: string }>)
    .filter(([name]) => name.startsWith("fs-") && name !== "fs-input-coarse")
    .map(([name, t]) => [name, String(t.$value), t.$description ?? ""] as [string, string, string]);
  // Each default's bold lead and the rest of its line, which carries the reason.
  const defaults = [...readFileSync(resolve(root, "DEFAULTS.md"), "utf8").matchAll(/^- \*\*(.+?)\*\*(.*)$/gm)].map((m) => {
    const lead = (m[1] ?? "").replace(/[.;]$/, "");
    const rest = (m[2] ?? "").trim();
    // A line whose lead runs on into its sentence ("..., in a dialog** with focus on Cancel") reads whole.
    return { lead, reason: /^[A-Z`]/.test(rest) ? rest : `${m[1]} ${rest.replace(/^[,;]\s*/, "")}` };
  });
  return {
    version: JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version,
    components,
    families: fams?.families ?? {},
    accentText: Object.fromEntries(
      FAMILIES.map((f) => {
        const ratio = (scheme: string) =>
          (fams?.pairs ?? []).find((p: { family: string; scheme: string; fg: string; bg: string }) => p.family === f && p.scheme === scheme && p.fg === "accent-text" && p.bg === "surface")?.ratio ?? 0;
        return [f, [ratio("light"), ratio("dark")]];
      }),
    ),
    pairs: fams ? { total: fams.pairs.length, failing: fams.pairs.filter((p: { pass: boolean }) => !p.pass).length } : null,
    tests: results?.available ? { passed: results.totals.passed, failed: results.totals.failed } : null,
    type,
    defaults,
  };
}

/** A word in letter tiles over a stripe, hidden from assistive technology: the heading says it. */
export function band(word: string, families: Family[], size: "cover" | "section") {
  const one = families.length === 1;
  const tiles = [...word].map((c, i) => `<span${one ? "" : fam(families[i % families.length] as Family)}>${esc(c)}</span>`).join("");
  const stripe = (one ? ["ink", "solid", "pale"] : families).map((f) => `<i${one ? ` data-role="${f}"` : fam(f as Family)}></i>`).join("");
  return `<div class="home-band" data-size="${size}"${one ? fam(families[0] as Family) : " data-mix"} aria-hidden="true"><p class="home-band-word">${tiles}</p><p class="home-band-stripe">${stripe}</p></div>`;
}

/** The site header every public page shares: its section links go to the front page's sections, so `base` is "" there and "/" elsewhere; the last goes to the theme builder. */
export function header(base: string, current = "Home"): string {
  const links: Array<[string, string]> = [
    ...[["color", "Color"], ["type", "Type"], ["components", "Components"], ["defaults", "Defaults"], ["use", "Install"]].map(([h, t]) => [`${base}#${h}`, t] as [string, string]),
    ["/make/", "Make a theme"],
  ];
  return letterheadHtml({
    name: "Capsomer",
    mark: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1 17.8 5.5v9L10 19l-7.8-4.5v-9z"/></svg>',
    links: [["/", "Home"], ...links],
    current,
    search: { action: "/search/", label: "Search Capsomer" },
  });
}

/**
 * The running head over a public page, as the NASA Graphics Standards Manual heads its pages (1976,
 * page i): the section's number and name (a page outside the parts, such as search, has none), and the folio at the right (capsomer/manual.css). It repeats
 * what the header and the title say, so it is hidden from screen readers.
 */
export const runningHead = (no: string, name: string, folio: string) =>
  `<div class="cap-page home-running" aria-hidden="true"><div class="cap-running-head"><span class="cap-running-head-name">${no ? `<span class="cap-running-head-no">${esc(no)}</span>` : ""}${esc(name)}</span><span class="cap-running-head-folio">${esc(folio)}</span></div></div>`;

/** A numbered section heading, as the manual numbers its parts. */
const partTitle = (id: string, no: string, text: string) => `<h2 class="cap-part-title" id="${id}"><span class="cap-part-no">${no}</span>${text}</h2>`;

// The foot of every public page: the family footer every dustinedwards.info site closes with, with
// Capsomer's own part under its thin magenta stripe (Dustin, 2026-10-26).
const VERSION: string = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const CENTER = `<div class="cap-family-footer-center">
  <div><p class="cap-family-footer-center-name">Capsomer</p><p class="cap-family-footer-about">The family design system. Plain CSS, MIT licensed.</p></div>
  <div class="cap-family-footer-columns">
    <ul class="cap-family-footer-links"><li><a href="/#components">Components</a></li><li><a href="/make/">Theme builder</a></li></ul>
    <ul class="cap-family-footer-links"><li><a class="cap-go" data-go="out" href="https://github.com/DrDustinEdwards/capsomer">Source</a></li><li><a class="cap-go" data-go="out" href="https://github.com/DrDustinEdwards/capsomer/blob/main/CHANGELOG.md">Changes</a></li></ul>
    <ul class="cap-family-footer-links"><li><a href="/admin/">Scaffold</a></li></ul>
  </div>
  <p class="cap-family-footer-stamp"><span>Release ${VERSION}</span></p>
</div>`;
export const FOOTER = `<footer class="home-foot">
  <div class="cap-page">${familyFooterHtml({ site: "capsomer", center: CENTER, statement: "/accessibility/" })}</div>
</footer>`;

export function renderHome(d: Data): string {
  const install = `"capsomer": "github:DrDustinEdwards/capsomer#v${d.version}"

import "capsomer/tokens.css";       // the layer order and every token
import "capsomer/base.css";
import "capsomer/families.css";     // every family, on data-family
import "capsomer/button.css";       // each component's CSS, as used`;
  const figures: Array<[Family, string, string, string]> = [
    ["purple", "Components", String(d.components.length), `in release ${d.version}`],
    ["fox", "Color families", String(FAMILIES.length), "each one 12 steps, in light and dark"],
  ];
  if (d.pairs) figures.push(["teal", "Contrast pairs", String(d.pairs.total), d.pairs.failing ? `${d.pairs.failing} failing` : "every one passes WCAG 2.2"]);
  // The test count: the build's own when it has one; otherwise the last run on main, read by
  // site/home-main.ts from the results branch, so the deployed page never claims a number it lacks.
  const tests = d.tests ? `<li data-family="forest"><b>${d.tests.passed + d.tests.failed}</b><span class="home-figure-label">Tests</span><span>${d.tests.failed ? `${d.tests.failed} failing` : "all passed on the last run"}</span></li>` : `<li data-family="forest" data-live="tests" hidden><b></b><span class="home-figure-label">Tests</span><span></span></li>`;
  return `${header("")}
<main id="main" tabindex="-1">
${runningHead("1", "Overview", `Release ${d.version}`)}
<section class="home-cover" aria-labelledby="top-h">
  ${band("Capsomer", FAMILIES, "cover")}
  <div class="cap-page home-intro">
    <h1 id="top-h">One design system for every site and app</h1>
    <p class="home-lead">Capsomer is the palette, type and components shared by every one of Dustin Edwards's sites and apps, with the tests that keep each of them accessible in both themes. Plain CSS, MIT licensed.</p>
    <p class="home-cta"><a class="cap-sign" data-variant="forward" href="/make/">Make your own theme</a> <span class="home-muted">From one brand color: scales, contrast checks, type, a live preview and the CSS.</span></p>
  </div>
  <ul class="cap-page home-figures">
    ${figures.map(([f, label, n, note]) => `<li${fam(f)}><b>${esc(n)}</b><span class="home-figure-label">${esc(label)}</span><span>${esc(note)}</span></li>`).join("\n    ")}
    ${tests}
  </ul>
</section>

<section id="color" aria-labelledby="color-h">
  ${band("Color", FAMILIES, "section")}
  <div class="cap-page">
    ${partTitle("color-h", "1", "Six families from six seeds")}
    <p class="home-sub">Each family is one 12-step scale with the same job for each step: step 9 is the seed, step 11 is text, step 10 fills the main button. A site picks its family with one attribute, <code>data-family</code>. These scales follow your device's theme.</p>
    <figure class="home-lohse" aria-labelledby="lohse-c">
      <div class="home-lohse-grid" role="img" aria-label="The six families as six rows of twelve steps, lightest on the left.">
        ${FAMILIES.map((f) => `<span class="home-lohse-name">${NAMES[f]}</span>${Array.from({ length: 12 }, (_, i) => `<i${fam(f)} data-step="${i + 1}"></i>`).join("")}`).join("")}
      </div>
      <figcaption id="lohse-c">Seventy-two colors, six rows of twelve steps, in your device's theme. Laid out after Richard Paul Lohse's systematic color series (Zurich, from 1943), where every square is the same size and the system makes the picture.</figcaption>
    </figure>
    <ul class="home-families">
      ${FAMILIES.map((f) => {
        const info = d.families[f];
        return `<li${fam(f)}><p class="home-family-name" aria-hidden="true"><span>${NAMES[f]}</span></p><h3>${NAMES[f]} <code>${esc(info?.seed ?? "")}</code></h3><p>${esc((info?.note ?? "").replace(/\s*\(rules?[^)]*\)/g, ""))}</p></li>`;
      }).join("\n      ")}
    </ul>
    <div class="home-try">
      <h3 id="try-h">One attribute changes the family</h3>
      <p class="home-sub">These are Capsomer's own components, live. Pick a family and the panel takes it, the way a site does with <code>data-family</code>; the theme button at the top switches light and dark.</p>
      <fieldset class="cap-seg">
        <legend>Family</legend>
        <div class="cap-seg-options">
          ${FAMILIES.map((f, i) => `<label><input type="radio" name="home-family" value="${f}"${i === 0 ? " checked" : ""} /> ${NAMES[f]}</label>`).join("\n          ")}
        </div>
      </fieldset>
      <div class="home-try-stage" data-cap-part="stage" data-family="purple">
        <div class="home-try-row">
          <button type="button" class="cap-btn" data-variant="primary">Save changes</button>
          <button type="button" class="cap-btn" data-variant="secondary">Preview</button>
          <button type="button" class="cap-btn">Cancel</button>
          <button type="button" class="cap-btn" data-variant="link">View history</button>
        </div>
        <div class="cap-field">
          <label class="cap-field-label" for="home-try-name">Site name</label>
          <input class="cap-input" id="home-try-name" value="Field notes" autocomplete="off" />
        </div>
        <div class="home-try-row">
          <label class="cap-switch" data-cap="switch"><input type="checkbox" role="switch" checked /> Publish on save <span class="cap-switch-state" aria-hidden="true">On</span></label>
          <div class="cap-chips" role="group" aria-label="Show">
            <button type="button" class="cap-chip" aria-pressed="true">Drafts</button>
            <button type="button" class="cap-chip" aria-pressed="false">Published</button>
          </div>
        </div>
        <div class="home-try-row">
          <span class="cap-status" data-tone="ok"><svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"/></svg>Healthy</span>
          <span class="cap-status" data-tone="warn"><svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"/></svg>Needs you</span>
          <span class="cap-status" data-tone="crit"><svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"/></svg>Down</span>
        </div>
      </div>
    </div>
    <h3 class="home-albers-h">${d.pairs ? `${d.pairs.total - d.pairs.failing} of ${d.pairs.total} contrast pairs pass` : "Every contrast pair is checked"}</h3>
    <p class="home-sub">A color is only as readable as what sits behind it, so the generator checks every pair a component puts together, in both themes, against WCAG 2.2. The squares are after Josef Albers's <i>Homage to the Square</i> (from 1950), his study of how a color changes with the one around it.</p>
    <ul class="home-albers">
      ${FAMILIES.map((f) => {
        const [l, dk] = d.accentText[f] ?? [0, 0];
        return `<li${fam(f)}><div class="home-albers-sq" aria-hidden="true"><div><div><div></div></div></div></div><p><b>${NAMES[f]}</b> text on its page: ${l.toFixed(1)}:1 light, ${dk.toFixed(1)}:1 dark</p></li>`;
      }).join("\n      ")}
    </ul>
  </div>
</section>

<section id="type" data-family="navy" aria-labelledby="type-h">
  ${band("Type", ["navy"], "section")}
  <div class="cap-page">
    ${partTitle("type-h", "2", "Three faces, one scale")}
    <div class="home-faces">
      <figure data-face="ui"><p aria-hidden="true">Aa</p><figcaption><b>Schibsted Grotesk</b> for every screen of an app</figcaption></figure>
      <figure data-face="mono"><p aria-hidden="true">Aa</p><figcaption><b>Martian Mono</b> for identifiers and code</figcaption></figure>
      <figure data-face="prose"><p aria-hidden="true">Aa</p><figcaption><b>Source Serif 4</b> for long reading</figcaption></figure>
    </div>
    <div class="cap-field home-sample" data-cap-part="sample" hidden>
      <label class="cap-field-label" for="home-sample">Try your own words</label>
      <input class="cap-input" id="home-sample" autocomplete="off" maxlength="60" value="Field notes" />
    </div>
    <ol class="home-scale">
      ${d.type.map(([name, value, note]) => `<li><span class="home-scale-sample" data-fs="${esc(name)}">Field notes</span><code>--${esc(name)}</code><span>${esc(value)}</span><span class="home-muted">${esc(note)}</span></li>`).join("\n      ")}
    </ol>
  </div>
</section>

<section id="components" aria-labelledby="components-h">
  ${band("Components", ["magenta"], "section")}
  <div class="cap-page">
    ${partTitle("components-h", "3", `${d.components.length} components, every state on show`)}
    <p class="home-sub">Each one is built once and shared by every app. Open any of them for how to use it and every state it has, in light and dark.</p>
    <div class="home-find" data-cap-part="find" hidden>
      <label class="cap-field-label" for="home-find">Find a component</label>
      <input class="cap-input" id="home-find" type="search" autocomplete="off" aria-describedby="home-find-n" />
      <p class="home-muted" id="home-find-n" role="status">${d.components.length} components</p>
    </div>
    <ul class="home-parts">
      ${d.components.map((c) => `<li><a href="/components/${esc(c.name)}/">${esc(c.title)}</a><span>${prose(c.summary)}</span></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="defaults" data-family="teal" aria-labelledby="defaults-h">
  ${band("Defaults", ["teal"], "section")}
  <div class="cap-page">
    ${partTitle("defaults-h", "4", "Defaults, each with its reason")}
    <p class="home-sub">A default is not a law: a better design overrides it and writes down why. CI blocks only on accessibility, security, privacy and correctness. Open one for its reason.</p>
    <ul class="home-defaults">
      ${d.defaults.map((t) => `<li><details class="cap-disclosure"><summary><span>${prose(t.lead)}</span></summary><div class="cap-disclosure-body">${renderMarkdown(t.reason, 0)}</div></details></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="use" data-family="amber" aria-labelledby="use-h">
  ${band("Install", ["amber"], "section")}
  <div class="cap-page">
    ${partTitle("use-h", "5", "Pin a release, import what you use")}
    <p class="home-sub">An app pins a tagged release and imports the tokens, then each component's CSS as it needs it. Every Capsomer rule sits in a <code>cap.*</code> cascade layer, so the app's own CSS still wins while it moves over one screen at a time.</p>
    <div class="home-code-wrap">
      <pre class="home-code" id="home-install"><code>${esc(install)}</code></pre>
      <button type="button" class="cap-btn" data-size="sm" data-cap-part="copy" aria-describedby="home-install" hidden>Copy</button>
    </div>
  </div>
</section>
</main>
${FOOTER}`;
}


/** One example: the live component in a frame of its own (the states page showing only it), with its markup under it. */
function exampleBlock(c: Component, e: Example, heading: boolean): string {
  const src = `/components/${esc(c.name)}/states.html?${e.kind}=${encodeURIComponent(e.id)}`;
  const label = heading ? `ex-${esc(e.id)}` : `comp-h`;
  return `<section class="comp-ex"${heading ? ` aria-labelledby="${label}"` : ` aria-label="${esc(c.title)}, ${esc(e.title)}"`}>
  ${heading ? `<h3 id="${label}">${esc(e.title)}</h3>` : ""}
  <div class="comp-ex-box">
    <iframe class="comp-ex-frame" src="${src}" title="${esc(c.title)}: ${esc(e.title)}" loading="lazy" data-kind="${e.kind}" data-height="${e.height}"></iframe>
    <div class="comp-ex-code" data-cap-part="code">
      <pre tabindex="0" aria-label="HTML for ${esc(e.title)}"><code>${esc(e.code)}</code></pre>
      <div class="comp-ex-tools"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-cap-part="copy-code" hidden>Copy</button></div>
      <button type="button" class="cap-btn" data-size="sm" data-cap-part="show-code" aria-expanded="false" hidden>View code</button>
    </div>
  </div>
</section>`;
}

const ARROW = {
  prev: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  next: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/**
 * A component's own public page at /components/<name>/, laid out as shadcn/ui's docs are: every
 * component in a list on the left, the page's sections on the right, and in the middle its name, the
 * first example live with its markup, how to install it, every other example the same way, then its doc.
 */
export function renderComponent(d: Data, name: string): string {
  const i = d.components.findIndex((c) => c.name === name);
  const c = d.components[i];
  if (!c) throw new Error(`no component ${name}`);
  const prev = d.components[i - 1];
  const next = d.components[i + 1];
  const states = `/components/${esc(c.name)}/states.html`;
  const [hero, ...rest] = c.examples;
  const docHeads = [...c.body.matchAll(/^## (.+)$/gm)].map((m) => {
    const text = (m[1] ?? "").trim();
    return [`doc-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, text.replace(/`/g, "")] as [string, string];
  });
  const usesCss = c.parts.includes("css") || c.parts.length === 0;
  const enhance = c.behavior.includes("enhance");
  const html = [
    `// package.json: "capsomer": "github:DrDustinEdwards/capsomer#v${d.version}"`,
    `import "capsomer/tokens.css";`,
    `import "capsomer/base.css";`,
    ...(usesCss ? [`import "capsomer/${c.name}.css";`] : []),
    ...(enhance ? [`import { enhance } from "capsomer/behavior/${c.name}";`, "", "enhance();"] : c.behavior.length ? [`import { ${c.behavior.slice(0, 3).join(", ")} } from "capsomer/behavior/${c.name}";`] : []),
  ].join("\n");
  const react = c.react.length
    ? [`import "capsomer/tokens.css";`, ...(usesCss ? [`import "capsomer/${c.name}.css";`] : []), `import { ${c.react.join(", ")} } from "capsomer/react/${c.name}";`].join("\n")
    : "";
  const tab = (id: string, text: string, on: boolean) =>
    `<button type="button" class="cap-tab" role="tab" id="inst-t-${id}" aria-selected="${on}" aria-controls="inst-p-${id}" tabindex="${on ? 0 : -1}">${text}</button>`;
  const panel = (id: string, code: string, on: boolean) =>
    `<div class="cap-tabs-panel" role="tabpanel" id="inst-p-${id}" aria-labelledby="inst-t-${id}" tabindex="0"${on ? "" : " hidden"}><div class="comp-ex-code" data-open><pre aria-label="Install"><code>${esc(code)}</code></pre><div class="comp-ex-tools"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-cap-part="copy-code" hidden>Copy</button></div></div></div>`;
  const toc: Array<[string, string, boolean]> = [
    ["install-h", "Installation", false],
    ...(rest.length ? ([["examples-h", "Examples", false], ...rest.map((e) => [`ex-${e.id}`, e.title, true])] as Array<[string, string, boolean]>) : []),
    ...docHeads.map(([id, t]) => [id, t, false] as [string, string, boolean]),
    ["states-h", "Every state", false],
  ];
  return `${header("/", "Components")}
${runningHead("3", `Components · ${c.title}`, `${c.states} states`)}
<div class="cap-page comp-layout">
<nav class="comp-side" aria-label="Components">
  <div class="cap-field comp-side-find" data-cap-part="side-find" hidden>
    <label class="cap-field-label cap-sr-only" for="side-find">Find a component</label>
    <input class="cap-input" id="side-find" type="search" placeholder="Find a component" autocomplete="off" />
  </div>
  <p class="comp-side-h">Components</p>
  <ul>
    ${d.components.map((x) => `<li><a href="/components/${esc(x.name)}/"${x.name === c.name ? ' aria-current="page"' : ""}>${esc(x.title)}</a></li>`).join("\n    ")}
  </ul>
</nav>
<main id="main" tabindex="-1" class="comp-main">
  <nav class="home-trail" aria-label="Breadcrumb"><ol><li><a href="/#components">Components</a></li><li><span aria-current="page">${esc(c.title)}</span></li></ol></nav>
  <div class="comp-title">
    <h1 id="comp-h">${esc(c.title)}</h1>
    <div class="comp-title-tools">
      <button type="button" class="cap-btn" data-size="sm" data-cap-part="copy-page" hidden>Copy page</button>
      ${prev ? `<a class="cap-btn" data-size="sm" data-icon-only="" href="/components/${esc(prev.name)}/" rel="prev" aria-label="Previous: ${esc(prev.title)}">${ARROW.prev}</a>` : ""}
      ${next ? `<a class="cap-btn" data-size="sm" data-icon-only="" href="/components/${esc(next.name)}/" rel="next" aria-label="Next: ${esc(next.title)}">${ARROW.next}</a>` : ""}
    </div>
  </div>
  <p class="comp-lead">${prose(c.lead)}</p>
  <p class="comp-facts">${c.states} states · since ${esc(c.added)} · ${esc((c.parts.length ? c.parts : ["css"]).map((p) => (p === "behavior" ? "behavior" : p === "react" ? "React" : p.toUpperCase())).join(", "))}</p>
  <template data-cap-part="md">${esc(c.md)}</template>
  ${hero ? exampleBlock(c, hero, false) : ""}

  <section aria-labelledby="install-h">
    <h2 id="install-h">Installation</h2>
    <div class="cap-tabs" data-cap="tabs">
      <div class="cap-tabs-list" role="tablist" aria-label="Installation">${tab("html", "HTML and CSS", true)}${react ? tab("react", "React", false) : ""}</div>
      ${panel("html", html, true)}${react ? panel("react", react, false) : ""}
    </div>
  </section>

  ${rest.length ? `<section aria-labelledby="examples-h">
    <h2 id="examples-h">Examples</h2>
    ${rest.map((e) => exampleBlock(c, e, true)).join("\n    ")}
  </section>` : ""}

  <article class="home-doc comp-doc" aria-label="How to use ${esc(c.title)}">
  ${renderMarkdown(c.body, 0)}
  </article>

  <section aria-labelledby="states-h">
    <h2 id="states-h">Every state</h2>
    <p>Every example on one page, as the tests see it: <a href="${states}?theme=light">light</a> or <a href="${states}?theme=dark">dark</a>.</p>
  </section>

  <nav class="comp-pager" aria-label="More components">
    ${prev ? `<a class="cap-sign" href="/components/${esc(prev.name)}/" rel="prev">${esc(prev.title)}</a>` : "<span></span>"}
    ${next ? `<a class="cap-sign" href="/components/${esc(next.name)}/" rel="next">${esc(next.title)}</a>` : "<span></span>"}
  </nav>
</main>
<nav class="comp-toc" aria-label="On this page">
  <p class="comp-side-h">On this page</p>
  <ul>
    ${toc.map(([id, t, sub]) => `<li${sub ? ' class="comp-toc-sub"' : ""}><a href="#${esc(id)}">${esc(t)}</a></li>`).join("\n    ")}
  </ul>
</nav>
</div>
${FOOTER}`;
}
