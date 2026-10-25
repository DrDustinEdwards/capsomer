// The public page at the root of https://capsomer.dustinedwards.info, written into site/home.html
// at build time (site/vite.config.ts), so it is whole HTML with no script but the old-link redirect
// (site/redirect.ts). Its look is Supergraphics (Barbara Stauffacher Solomon, The Sea Ranch, 1966):
// flat letter tiles too big for the page, cut by its edge, painted in Capsomer's own families.
// The dashboard of tests, pairs and changes is the admin at /admin/ (site/main.tsx).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { frontmatter } from "./markdown.ts";

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
  defaults: string[];
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
  // Each default's bold lead, the line before its reason.
  const defaults = [...readFileSync(resolve(root, "DEFAULTS.md"), "utf8").matchAll(/^- \*\*(.+?)\*\*/gm)].map((m) => (m[1] ?? "").replace(/[.;]$/, ""));
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
    ["fox", "Colour families", String(FAMILIES.length), "each one 12 steps, in light and dark"],
  ];
  if (d.pairs) figures.push(["teal", "Contrast pairs", String(d.pairs.total), d.pairs.failing ? `${d.pairs.failing} failing` : "every one passes WCAG 2.2"]);
  if (d.tests) figures.push(["forest", "Tests", String(d.tests.passed + d.tests.failed), d.tests.failed ? `${d.tests.failed} failing` : "all passed on the last run"]);
  return `<header class="home-top">
  <a class="home-logo" href="/"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1 17.8 5.5v9L10 19l-7.8-4.5v-9z"/></svg>Capsomer</a>
  <nav aria-label="Sections"><ul>
    <li><a href="#colour">Colour</a></li><li><a href="#type">Type</a></li><li><a href="#components">Components</a></li><li><a href="#defaults">Defaults</a></li><li><a href="#use">Install</a></li><li><a href="/admin/">Admin</a></li>
  </ul></nav>
</header>
<main id="main">
<section class="home-cover" aria-labelledby="top-h">
  ${band("Capsomer", FAMILIES, "cover")}
  <div class="home-wrap home-intro">
    <h1 id="top-h">Capsomer</h1>
    <p class="home-lead">One design system for every one of Dustin Edwards's sites and apps: one palette grown from one seed colour, one set of components, and the tests that keep every one of them accessible in both themes. Plain CSS, MIT licensed.</p>
  </div>
  <ul class="home-wrap home-figures">
    ${figures.map(([f, label, n, note]) => `<li${fam(f)}><b>${esc(n)}</b><span class="home-figure-label">${esc(label)}</span><span>${esc(note)}</span></li>`).join("\n    ")}
  </ul>
</section>

<section id="colour" aria-labelledby="colour-h">
  ${band("Colour", FAMILIES, "section")}
  <div class="home-wrap">
    <h2 id="colour-h">Six families from six seeds</h2>
    <p class="home-sub">Each family is one 12-step scale with the same job for each step: step 9 is the seed, step 11 is text, step 10 fills the main button. A site picks its family with one attribute, <code>data-family</code>. These scales follow your device's theme.</p>
    <figure class="home-lohse" aria-labelledby="lohse-c">
      <div class="home-lohse-grid" role="img" aria-label="The six families as six rows of twelve steps, lightest on the left.">
        ${FAMILIES.map((f) => `<span class="home-lohse-name">${NAMES[f]}</span>${Array.from({ length: 12 }, (_, i) => `<i${fam(f)} data-step="${i + 1}"></i>`).join("")}`).join("")}
      </div>
      <figcaption id="lohse-c">Seventy-two colours, six rows of twelve steps, in your device's theme. Laid out after Richard Paul Lohse's systematic colour series (Zurich, from 1943), where every square is the same size and the system makes the picture.</figcaption>
    </figure>
    <ul class="home-families">
      ${FAMILIES.map((f) => {
        const info = d.families[f];
        return `<li${fam(f)}><p class="home-family-name" aria-hidden="true"><span>${NAMES[f]}</span></p><h3>${NAMES[f]} <code>${esc(info?.seed ?? "")}</code></h3><p>${esc((info?.note ?? "").replace(/\s*\(rules?[^)]*\)/g, ""))}</p></li>`;
      }).join("\n      ")}
    </ul>
    <h3 class="home-albers-h">${d.pairs ? `${d.pairs.total - d.pairs.failing} of ${d.pairs.total} contrast pairs pass` : "Every contrast pair is checked"}</h3>
    <p class="home-sub">A colour is only as readable as what sits behind it, so the generator checks every pair a component puts together, in both themes, against WCAG 2.2. The squares are after Josef Albers's <i>Homage to the Square</i> (from 1950), his study of how a colour changes with the one around it.</p>
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
    <p class="home-sub">Each one is built once and shared by every app. Open any of them to see every state it has, in light and dark, as the browser tests see it.</p>
    <ul class="home-parts">
      ${d.components.map((c) => `<li><a href="/components/${esc(c.name)}/states.html">${esc(c.title)}</a><span>${prose(c.summary)}</span></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="defaults" data-family="teal" aria-labelledby="defaults-h">
  ${band("Defaults", ["teal"], "section")}
  <div class="home-wrap">
    <h2 id="defaults-h">Defaults, each with its reason</h2>
    <p class="home-sub">A default is not a law: a better design overrides it and writes down why. CI blocks only on accessibility, security, privacy and correctness. <a href="https://github.com/DrDustinEdwards/capsomer/blob/main/DEFAULTS.md">Every default and its reason</a>.</p>
    <ul class="home-defaults">
      ${d.defaults.map((t) => `<li>${prose(t)}</li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="use" data-family="amber" aria-labelledby="use-h">
  ${band("Install", ["amber"], "section")}
  <div class="home-wrap">
    <h2 id="use-h">Pin a release, import what you use</h2>
    <p class="home-sub">An app pins a tagged release and imports the tokens, then each component's CSS as it needs it. Every Capsomer rule sits in a <code>cap.*</code> cascade layer, so the app's own CSS still wins while it moves over one screen at a time.</p>
    <pre class="home-code"><code>${esc(install)}</code></pre>
  </div>
</section>
</main>
<footer class="home-foot">
  <div class="home-wrap">
    <ul>
      <li><a href="/admin/">The admin</a>: every token, test result, contrast pair and change</li>
      <li><a href="https://github.com/DrDustinEdwards/capsomer">The source</a>, MIT licensed</li>
      <li><a href="https://github.com/DrDustinEdwards/capsomer/blob/main/CHANGELOG.md">Changes</a> in each release</li>
      <li><a href="https://dustinedwards.info">Dustin Edwards</a></li>
    </ul>
    <p class="home-muted">Release ${esc(d.version)}.</p>
  </div>
</footer>`;
}
