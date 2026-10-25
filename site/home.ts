// The public page at the root of https://capsomer.dustinedwards.info, written into site/home.html
// at build time (site/vite.config.ts), so it is whole HTML that reads without a script; site/home-main.ts
// adds the header's behavior, the family preview, the component filter, the copy button and the live
// test count, and site/redirect.ts sends old admin links on. Its look is Supergraphics (Barbara Stauffacher Solomon, The Sea Ranch, 1966):
// flat letter tiles too big for the page, cut by its edge, painted in Capsomer's own families.
// The dashboard of tests, pairs and changes is the admin at /admin/ (site/main.tsx).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { frontmatter, renderMarkdown } from "./markdown.ts";

type Family = "purple" | "fox" | "teal" | "amber" | "navy" | "forest";
const FAMILIES: Family[] = ["purple", "fox", "teal", "amber", "navy", "forest"];
const NAMES: Record<Family, string> = { purple: "Purple", fox: "Fox", teal: "Teal", amber: "Amber", navy: "Navy", forest: "Forest" };

interface Component {
  name: string;
  title: string;
  summary: string;
}
interface Data {
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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Backticks in a summary become code, as on the admin's pages.
const prose = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const fam = (f: Family) => (f === "purple" ? "" : ` data-family="${f}"`);
const json = (path: string) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);

/** Everything the page says, read from the repo and the site's data files (capsomer site-data). */
export function readData(root: string): Data {
  const dir = resolve(root, "components");
  const components = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(dir, d.name, `${d.name}.md`)))
    .map((d) => {
      const { data } = frontmatter(readFileSync(resolve(dir, d.name, `${d.name}.md`), "utf8"));
      const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
      // The summary's first sentence: the page lists every component, so each says one thing.
      return { name: d.name, title: str("title") || d.name, summary: str("summary").replace(/^(.+?[.!?])\s.*$/s, "$1") };
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
function band(word: string, families: Family[], size: "cover" | "section") {
  const one = families.length === 1;
  const tiles = [...word].map((c, i) => `<span${one ? "" : fam(families[i % families.length] as Family)}>${esc(c)}</span>`).join("");
  const stripe = (one ? ["ink", "solid", "pale"] : families).map((f) => `<i${one ? ` data-role="${f}"` : fam(f as Family)}></i>`).join("");
  return `<div class="home-band" data-size="${size}"${one ? fam(families[0] as Family) : " data-mix"} aria-hidden="true"><p class="home-band-word">${tiles}</p><p class="home-band-stripe">${stripe}</p></div>`;
}

export function renderHome(d: Data): string {
  const install = `"capsomer": "github:DrDustinEdwards/capsomer#v${d.version}"

import "capsomer/tokens.css";       // the layer order and every token
import "capsomer/base.css";
import "capsomer/families.css";     // fox, teal, amber, navy and forest, on data-family
import "capsomer/button.css";       // each component's CSS, as used`;
  const figures: Array<[Family, string, string, string]> = [
    ["purple", "Components", String(d.components.length), `in release ${d.version}`],
    ["fox", "Color families", String(FAMILIES.length), "each one 12 steps, in light and dark"],
  ];
  if (d.pairs) figures.push(["teal", "Contrast pairs", String(d.pairs.total), d.pairs.failing ? `${d.pairs.failing} failing` : "every one passes WCAG 2.2"]);
  // The test count: the build's own when it has one; otherwise the last run on main, read by
  // site/home-main.ts from the results branch, so the deployed page never claims a number it lacks.
  const tests = d.tests ? `<li data-family="forest"><b>${d.tests.passed + d.tests.failed}</b><span class="home-figure-label">Tests</span><span>${d.tests.failed ? `${d.tests.failed} failing` : "all passed on the last run"}</span></li>` : `<li data-family="forest" data-live="tests" hidden><b></b><span class="home-figure-label">Tests</span><span></span></li>`;
  const links: Array<[string, string]> = [["#color", "Color"], ["#type", "Type"], ["#components", "Components"], ["#defaults", "Defaults"], ["#use", "Install"]];
  return `<header class="cap-site-header" data-cap="site-header" data-links="right" data-markup="">
  <a class="cap-site-header-skip" href="#main">Skip to content</a>
  <a class="cap-site-header-logo home-logo" href="/" aria-label="Capsomer"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1 17.8 5.5v9L10 19l-7.8-4.5v-9z"/></svg><span aria-hidden="true">Capsomer</span></a>
  <nav class="cap-site-header-sections" aria-label="Sections"><ul>
    ${links.map(([h, t]) => `<li><a class="cap-site-header-link" href="${h}">${t}</a></li>`).join("")}
  </ul></nav>
  <div class="cap-site-header-tools">
    <button type="button" class="cap-theme-button cap-site-header-icon cap-site-header-theme" data-cap="theme-switch" data-variant="button" aria-label="Switch to dark theme">
      <svg class="cap-theme-icon" data-show="light" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      <svg class="cap-theme-icon" data-show="dark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      <span class="cap-theme-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-theme-tip-text">Switch to dark theme</span><kbd>T</kbd></span>
    </button>
    <button type="button" class="cap-site-header-icon cap-site-header-menu" aria-label="Menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="home-sheet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
  </div>
  <dialog class="cap-dialog cap-site-header-sheet" data-cap="dialog" data-placement="bottom" data-size="md" id="home-sheet" aria-labelledby="home-sheet-title">
    <div class="cap-dialog-header"><h2 id="home-sheet-title" class="cap-dialog-title cap-site-header-sheet-title" tabindex="-1">Capsomer</h2></div>
    <div class="cap-dialog-body">
      <nav aria-labelledby="home-sheet-title"><ul class="cap-site-header-sheet-list">
        ${links.map(([h, t]) => `<li><a href="${h}"><span class="cap-site-header-sheet-name">${t}</span></a></li>`).join("")}
      </ul></nav>
    </div>
    <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only="" data-cap-part="close" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg></button>
  </dialog>
</header>
<main id="main" tabindex="-1">
<section class="home-cover" aria-labelledby="top-h">
  ${band("Capsomer", FAMILIES, "cover")}
  <div class="home-wrap home-intro">
    <h1 id="top-h">One design system for every site and app</h1>
    <p class="home-lead">Capsomer is the palette, type and components shared by every one of Dustin Edwards's sites and apps, with the tests that keep each of them accessible in both themes. Plain CSS, MIT licensed.</p>
  </div>
  <ul class="home-wrap home-figures">
    ${figures.map(([f, label, n, note]) => `<li${fam(f)}><b>${esc(n)}</b><span class="home-figure-label">${esc(label)}</span><span>${esc(note)}</span></li>`).join("\n    ")}
    ${tests}
  </ul>
</section>

<section id="color" aria-labelledby="color-h">
  ${band("Color", FAMILIES, "section")}
  <div class="home-wrap">
    <h2 id="color-h">Six families from six seeds</h2>
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
      <div class="home-try-stage" data-cap-part="stage">
        <div class="home-try-row">
          <button type="button" class="cap-btn" data-variant="primary">Save changes</button>
          <button type="button" class="cap-btn" data-variant="secondary">Preview</button>
          <button type="button" class="cap-btn">Cancel</button>
          <button type="button" class="cap-btn" data-variant="link">View history</button>
        </div>
        <div class="cap-field">
          <label class="cap-field-label" for="home-try-name">Site name</label>
          <input class="cap-input" id="home-try-name" value="Phage λ notes" autocomplete="off" />
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
  <div class="home-wrap">
    <h2 id="type-h">Three faces, one scale</h2>
    <div class="home-faces">
      <figure data-face="ui"><p aria-hidden="true">Aa</p><figcaption><b>Schibsted Grotesk</b> for every screen of an app</figcaption></figure>
      <figure data-face="mono"><p aria-hidden="true">Aa</p><figcaption><b>Martian Mono</b> for identifiers and code</figcaption></figure>
      <figure data-face="prose"><p aria-hidden="true">Aa</p><figcaption><b>Source Serif 4</b> for long reading</figcaption></figure>
    </div>
    <ol class="home-scale">
      ${d.type.map(([name, value, note]) => `<li><span class="home-scale-sample" data-fs="${esc(name)}">Phage λ</span><code>--${esc(name)}</code><span>${esc(value)}</span><span class="home-muted">${esc(note)}</span></li>`).join("\n      ")}
    </ol>
  </div>
</section>

<section id="components" aria-labelledby="components-h">
  ${band("Components", ["purple"], "section")}
  <div class="home-wrap">
    <h2 id="components-h">${d.components.length} components, every state on show</h2>
    <p class="home-sub">Each one is built once and shared by every app. Open any of them for how to use it, every state it has in light and dark, and its test results.</p>
    <div class="home-find" data-cap-part="find" hidden>
      <label class="cap-field-label" for="home-find">Find a component</label>
      <input class="cap-input" id="home-find" type="search" autocomplete="off" aria-describedby="home-find-n" />
      <p class="home-muted" id="home-find-n" role="status">${d.components.length} components</p>
    </div>
    <ul class="home-parts">
      ${d.components.map((c) => `<li><a href="/admin/#/components/${esc(c.name)}">${esc(c.title)}</a><span>${prose(c.summary)}</span></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="defaults" data-family="teal" aria-labelledby="defaults-h">
  ${band("Defaults", ["teal"], "section")}
  <div class="home-wrap">
    <h2 id="defaults-h">Defaults, each with its reason</h2>
    <p class="home-sub">A default is not a law: a better design overrides it and writes down why. CI blocks only on accessibility, security, privacy and correctness. Open one for its reason.</p>
    <ul class="home-defaults">
      ${d.defaults.map((t) => `<li><details class="cap-disclosure"><summary><span>${prose(t.lead)}</span></summary><div class="cap-disclosure-body">${renderMarkdown(t.reason, 0)}</div></details></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="use" data-family="amber" aria-labelledby="use-h">
  ${band("Install", ["amber"], "section")}
  <div class="home-wrap">
    <h2 id="use-h">Pin a release, import what you use</h2>
    <p class="home-sub">An app pins a tagged release and imports the tokens, then each component's CSS as it needs it. Every Capsomer rule sits in a <code>cap.*</code> cascade layer, so the app's own CSS still wins while it moves over one screen at a time.</p>
    <div class="home-code-wrap">
      <pre class="home-code" id="home-install"><code>${esc(install)}</code></pre>
      <button type="button" class="cap-btn" data-size="sm" data-cap-part="copy" aria-describedby="home-install" hidden>Copy</button>
    </div>
  </div>
</section>
</main>
<footer class="home-foot">
  <div class="home-wrap">
    <ul>
      <li><a href="/admin/">Admin</a></li>
      <li><a href="https://github.com/DrDustinEdwards/capsomer">Source</a></li>
      <li><a href="https://github.com/DrDustinEdwards/capsomer/blob/main/CHANGELOG.md">Changes</a></li>
      <li><a href="https://dustinedwards.info">Dustin Edwards</a></li>
    </ul>
  </div>
</footer>`;
}
