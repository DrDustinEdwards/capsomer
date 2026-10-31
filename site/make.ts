// The theme builder at /make/, written into site/make.html at build (site/vite.config.ts). The page is
// whole HTML; site/make-main.ts runs it: it builds the theme from the settings with Capsomer's own
// generator (tokens/palette-core.mjs), paints the two previews, checks every pair and writes the files.
import { FOOTER, band, esc, header, runningHead } from "./home.ts";
import { DEFAULT, DISPLAY_FACES, FACES, MONO_FACES, PRESETS, SIZES, TEXT_FACES } from "./make-presets.ts";

const options = (ids: string[], chosen: string) => ids.map((id) => `<option value="${id}"${id === chosen ? " selected" : ""}>${esc(FACES[id]?.name ?? id)}</option>`).join("");
const select = (id: string, label: string, body: string) =>
  `<div class="cap-field"><label class="cap-field-label" for="${id}">${label}</label><div class="cap-select-wrap"><select class="cap-select" id="${id}">${body}</select></div></div>`;
const seg = (name: string, legend: string, items: Array<[string, string]>, chosen: string) =>
  `<fieldset class="cap-seg"><legend>${legend}</legend><div class="cap-seg-options">${items.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}"${v === chosen ? " checked" : ""} /> ${t}</label>`).join("")}</div></fieldset>`;

const STATUS_GLYPH: Record<string, string> = {
  ok: "M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z",
  warn: "M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z",
  crit: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z",
};
const glyph = (tone: string) => `<svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="${STATUS_GLYPH[tone]}"/></svg>`;

/** One preview: Capsomer's real components, in one theme. Ids carry the theme so both panes can sit on one page. */
function pane(scheme: "light" | "dark"): string {
  const s = scheme === "light" ? "l" : "d";
  const tab = (id: string, text: string, on: boolean) =>
    `<button type="button" class="cap-tab" role="tab" id="mk-${s}-t-${id}" aria-selected="${on}" aria-controls="mk-${s}-p-${id}" tabindex="${on ? 0 : -1}">${text}</button>`;
  return `<figure class="make-pane" data-scheme="${scheme}" data-cap-theme="${scheme}" aria-labelledby="mk-${s}-cap">
  <figcaption id="mk-${s}-cap" class="make-pane-cap">${scheme === "light" ? "Light" : "Dark"}</figcaption>
  <div class="make-pane-body">
    <div class="make-pane-head">
      <p class="make-pane-title">Field notes</p>
      <p class="make-pane-sub">Last saved at 14:02. <a href="#mk-${s}-name">Edit the name</a></p>
    </div>
    <div class="make-row">
      <button type="button" class="cap-btn" data-variant="primary">Save changes</button>
      <button type="button" class="cap-btn" data-variant="secondary">Preview</button>
      <button type="button" class="cap-btn">Cancel</button>
    </div>
    <div class="cap-field">
      <label class="cap-field-label" for="mk-${s}-name">Site name</label>
      <p class="cap-field-help" id="mk-${s}-name-h">Shown at the top of every page.</p>
      <input class="cap-input" id="mk-${s}-name" value="Field notes" autocomplete="off" aria-describedby="mk-${s}-name-h" />
    </div>
    <div class="cap-field">
      <label class="cap-field-label" for="mk-${s}-url">Address</label>
      <input class="cap-input" id="mk-${s}-url" value="http://notes.example.com" autocomplete="off" aria-invalid="true" aria-describedby="mk-${s}-url-e" />
      <p class="cap-field-error" id="mk-${s}-url-e">Use https://.</p>
    </div>
    <div class="make-row">
      <label class="cap-check"><input type="checkbox" checked /> Watch this site</label>
      <label class="cap-switch" data-cap="switch"><input type="checkbox" role="switch" checked /> Publish <span class="cap-switch-state" aria-hidden="true">On</span></label>
    </div>
    <div class="make-row">
      <div class="cap-chips" role="group" aria-label="Show">
        <button type="button" class="cap-chip" aria-pressed="true">Drafts</button>
        <button type="button" class="cap-chip" aria-pressed="false">Published</button>
      </div>
      <fieldset class="cap-seg"><legend class="cap-sr-only">Window</legend><div class="cap-seg-options"><label><input type="radio" name="mk-${s}-win" checked /> Day</label><label><input type="radio" name="mk-${s}-win" /> Week</label></div></fieldset>
    </div>
    <div class="cap-tabs" data-cap="tabs">
      <div class="cap-tabs-list" role="tablist" aria-label="Site sections, ${scheme}">
        ${tab("over", "Overview", true)}${tab("runs", 'Runs<span class="cap-tab-count">24</span>', false)}${tab("set", "Settings", false)}
      </div>
      <div class="cap-tabs-panel" role="tabpanel" id="mk-${s}-p-over" aria-labelledby="mk-${s}-t-over" tabindex="0">
        <div class="make-row">
          <span class="cap-status" data-tone="ok">${glyph("ok")}Up</span>
          <span class="cap-status" data-tone="warn">${glyph("warn")}Slow</span>
          <span class="cap-status" data-tone="crit">${glyph("crit")}Down</span>
        </div>
      </div>
      <div class="cap-tabs-panel" role="tabpanel" id="mk-${s}-p-runs" aria-labelledby="mk-${s}-t-runs" tabindex="0" hidden><p>24 runs today.</p></div>
      <div class="cap-tabs-panel" role="tabpanel" id="mk-${s}-p-set" aria-labelledby="mk-${s}-t-set" tabindex="0" hidden><p>Check every 5 minutes.</p></div>
    </div>
    <div class="cap-banner" data-tone="warn" role="status">${glyph("warn")}<p class="cap-banner-text">Could not refresh. Showing data from 4 minutes ago.</p><div class="cap-banner-actions"><button type="button" class="cap-btn">Try again</button></div></div>
    <div class="cap-meter" data-cap="meter">
      <span class="cap-meter-label" id="mk-${s}-m">Storage</span>
      <span class="cap-meter-value">6.1 of 10 GB</span>
      <span class="cap-meter-bar" role="meter" aria-labelledby="mk-${s}-m" aria-valuemin="0" aria-valuemax="10" aria-valuenow="6.1" aria-valuetext="6.1 of 10 gigabytes"><span class="cap-meter-fill"></span></span>
    </div>
    <section class="cap-panel" aria-labelledby="mk-${s}-tbl">
      <header class="cap-panel-head"><h3 id="mk-${s}-tbl">Pages</h3><span class="cap-panel-count">3</span></header>
      <div class="cap-table-wrap" role="region" aria-labelledby="mk-${s}-tbl" tabindex="0">
        <table class="cap-table">
          <thead><tr><th scope="col">Page</th><th scope="col" data-num>Views</th><th scope="col">State</th></tr></thead>
          <tbody>
            <tr><th scope="row"><a href="#mk-${s}-tbl">Home</a></th><td data-num>1,204</td><td><span class="cap-status" data-tone="ok">${glyph("ok")}Live</span></td></tr>
            <tr data-state="selected"><th scope="row"><a href="#mk-${s}-tbl">Methods</a></th><td data-num>318</td><td><span class="cap-status" data-tone="warn">${glyph("warn")}Draft</span></td></tr>
            <tr><th scope="row"><a href="#mk-${s}-tbl">Data</a></th><td data-num>96</td><td><span class="cap-muted">Hidden</span></td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <code class="make-pane-code">field-notes.example.com/methods</code>
  </div>
</figure>`;
}

const steps = (scheme: "light" | "dark") =>
  `<div class="make-scale-row"><span class="make-scale-name">${scheme === "light" ? "Light" : "Dark"}</span><ol class="make-scale" data-scheme="${scheme}">${Array.from({ length: 12 }, (_, i) => `<li><i></i><span>${i + 1}</span><code></code></li>`).join("")}</ol></div>`;

export function renderMake(): string {
  const presets = `<option value="" selected>Your own</option>${PRESETS.map((g) => `<optgroup label="${esc(g.group)}">${g.items.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</optgroup>`).join("")}`;
  const d = DEFAULT;
  return `${header("/", "Make a theme")}
<main id="main" tabindex="-1">
${runningHead("6", "Make a theme", "From one color")}
<section class="make-top" aria-labelledby="make-h">
  ${band("Make", ["magenta"], "section")}
  <div class="cap-page home-intro">
    <h1 id="make-h">Make a theme from one color</h1>
    <p class="home-lead">Pick a brand color and get a full light and dark theme: two 12-step scales, every text and control color, checked against WCAG 2.2 as you go. Choose the faces, text size and corners, see them on real components, then take the CSS or the tokens. This page takes your theme as you go. It runs Capsomer's own generator in your browser, and nothing you choose leaves it.</p>
    <noscript><p class="cap-banner" data-tone="warn"><span class="cap-banner-text">The theme builder needs JavaScript.</span></p></noscript>
  </div>
</section>
<div class="cap-page make-grid">
  <form class="make-controls" aria-label="Theme settings" data-cap-part="controls">
    ${select("mk-preset", "Start from", presets)}
    <fieldset class="make-group">
      <legend>Color</legend>
      <div class="cap-field">
        <label class="cap-field-label" for="mk-seed">Brand color</label>
        <p class="cap-field-help" id="mk-seed-h">Step 9 of the scale: buttons, focus rings, links. Any color works; the generator adjusts it where it has to.</p>
        <div class="make-color"><input type="color" id="mk-seed-pick" value="${d.seed}" aria-label="Brand color picker" /><input class="cap-input" id="mk-seed" value="${d.seed}" spellcheck="false" autocomplete="off" aria-describedby="mk-seed-h mk-seed-e" /></div>
        <p class="cap-field-error" id="mk-seed-e" hidden>Write a color as # and six hex digits, like #8c5fd2.</p>
      </div>
      <div class="cap-field">
        <label class="cap-check"><input type="checkbox" id="mk-anchor-on"${d.anchor ? " checked" : ""} /> Set my own text color</label>
        <p class="cap-field-help" id="mk-anchor-h">Step 11, the color of links and accent text in the light theme. Leave it off to have it worked out.</p>
        <div class="make-color" data-cap-part="anchor"${d.anchor ? "" : " hidden"}><input type="color" id="mk-anchor-pick" value="${d.anchor ?? "#4f2d7f"}" aria-label="Text color picker" /><input class="cap-input" id="mk-anchor" value="${d.anchor ?? "#4f2d7f"}" spellcheck="false" autocomplete="off" aria-label="Text color" aria-describedby="mk-anchor-h" /></div>
      </div>
      ${seg("mk-label", "Label on buttons", [["auto", "Best"], ["light", "Light"], ["dark", "Dark"]], d.label)}
    </fieldset>
    <fieldset class="make-group">
      <legend>Type</legend>
      ${select("mk-ui", "Text", options(TEXT_FACES, d.ui))}
      ${select("mk-display", "Headings", options(DISPLAY_FACES, d.display))}
      ${select("mk-mono", "Code and numbers", options(MONO_FACES, d.mono))}
      ${seg("mk-size", "Text size", SIZES.map((n) => [String(n), `${n}px`]), String(d.size))}
    </fieldset>
    <fieldset class="make-group">
      <legend>Shape</legend>
      <div class="cap-field">
        <label class="cap-field-label" for="mk-radius">Corners <output for="mk-radius" id="mk-radius-out">${d.radius}px</output></label>
        <input class="cap-range" id="mk-radius" type="range" min="0" max="16" step="1" value="${d.radius}" />
      </div>
      ${seg("mk-density", "Density", [["compact", "Compact"], ["comfortable", "Comfortable"]], d.density)}
    </fieldset>
  </form>

  <div class="make-out">
    <section aria-labelledby="mk-preview-h">
      <h2 id="mk-preview-h">Preview</h2>
      <p class="home-sub">Capsomer's own components, in both themes at once. They work: tab through them to see focus.</p>
      <div class="make-panes">${pane("light")}${pane("dark")}</div>
    </section>

    <section aria-labelledby="mk-scale-h">
      <h2 id="mk-scale-h">The scale</h2>
      <p class="home-sub">Steps 1 and 2 are backgrounds, 3 to 5 fills, 6 to 8 borders, 9 the brand color, 10 its hover, 11 and 12 text.</p>
      <div class="make-scales">${steps("light")}${steps("dark")}</div>
    </section>

    <section aria-labelledby="mk-checks-h">
      <h2 id="mk-checks-h">Contrast checks</h2>
      <p class="make-verdict" role="status" data-cap-part="verdict"></p>
      <ul class="make-fails" data-cap-part="fails"></ul>
      <div class="make-nearest" data-cap-part="nearest" hidden>
        <button type="button" class="cap-btn" data-cap-part="find">Find the nearest color that passes</button>
        <p class="home-muted" role="status" data-cap-part="found"></p>
      </div>
      <details class="cap-disclosure"><summary><span>Every pair, with its ratio</span></summary><div class="cap-disclosure-body">
        <div class="cap-table-wrap" role="region" aria-label="Every contrast pair" tabindex="0"><table class="cap-table make-pairs"><thead><tr><th scope="col">Theme</th><th scope="col">Where</th><th scope="col">Colors</th><th scope="col" data-num>Ratio</th><th scope="col" data-num>Needs</th></tr></thead><tbody data-cap-part="pairs"></tbody></table></div>
      </div></details>
    </section>

    <section aria-labelledby="mk-export-h">
      <h2 id="mk-export-h">Use it</h2>
      <p class="home-sub">With Capsomer, load this after <code>capsomer/tokens.css</code>; every value sits in the <code>cap.tokens</code> layer, so your own CSS still wins. Without Capsomer, the custom properties work in any CSS, and the tokens file is in the W3C design tokens format.</p>
      <div class="make-where">
        ${seg("mk-where", "Apply to", [["root", "The whole page"], ["family", "One element"]], "root")}
        <div class="cap-field" data-cap-part="name" hidden>
          <label class="cap-field-label" for="mk-name">Name</label>
          <p class="cap-field-help" id="mk-name-h">Put <code>data-family="<span data-cap-part="name-echo">brand</span>"</code> on the element.</p>
          <input class="cap-input" id="mk-name" value="brand" spellcheck="false" autocomplete="off" aria-describedby="mk-name-h" />
        </div>
      </div>
      <div class="cap-tabs" data-cap="tabs">
        <div class="cap-tabs-list" role="tablist" aria-label="File">
          <button type="button" class="cap-tab" role="tab" id="mk-t-css" aria-selected="true" aria-controls="mk-p-css" tabindex="0">CSS</button>
          <button type="button" class="cap-tab" role="tab" id="mk-t-json" aria-selected="false" aria-controls="mk-p-json" tabindex="-1">Tokens (JSON)</button>
        </div>
        <div class="cap-tabs-panel" role="tabpanel" id="mk-p-css" aria-labelledby="mk-t-css" tabindex="0"><pre class="home-code make-code" tabindex="0" aria-label="theme.css"><code data-cap-part="css"></code></pre></div>
        <div class="cap-tabs-panel" role="tabpanel" id="mk-p-json" aria-labelledby="mk-t-json" tabindex="0" hidden><pre class="home-code make-code" tabindex="0" aria-label="tokens.json"><code data-cap-part="json"></code></pre></div>
      </div>
      <div class="make-row make-actions">
        <button type="button" class="cap-btn" data-variant="primary" data-cap-part="download">Download theme.css</button>
        <button type="button" class="cap-btn" data-cap-part="copy">Copy</button>
        <button type="button" class="cap-btn" data-cap-part="share">Copy a link to this theme</button>
        <span class="home-muted" role="status" data-cap-part="said"></span>
      </div>
    </section>
  </div>
</div>
</main>
${FOOTER}`;
}
