// The Themes section: the front page (Overview) and a page for each part of a theme, each in one fixed pattern: a live
// board of Capsomer's real components; the controls that change it (family, light or dark, density); the token table.
// The tables are read from tokens/tokens.json (and the shadows from tokens/color.css); site/page.ts runs the controls
// and paints each token's sample and current value from the board, so the table follows the family and theme chosen.
import { readFileSync } from "node:fs";
import { FOOTER, esc, header, part, sectionPage, table, titleBlock } from "./chrome.ts";
import { firsts, type Data } from "./content.ts";
import { networkBoard } from "./network-board.ts";

interface Token {
  $value: unknown;
  $description?: string;
}
type Groups = Record<string, Record<string, Token>>;
const TOKENS = JSON.parse(
  readFileSync(new URL("../tokens/tokens.json", import.meta.url), "utf8"),
) as Groups;
// The shadows are the theme's (tokens/color.css), so they are read from its first, light, block.
const SHADOWS: Array<[string, string]> = (() => {
  const css = readFileSync(new URL("../tokens/color.css", import.meta.url), "utf8");
  const block = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
  return [...block.matchAll(/--(shadow[\w-]*):\s*([^;]+);/g)].map((m) => [
    m[1] ?? "",
    (m[2] ?? "").trim(),
  ]);
})();

/** A token's value as CSS writes it. */
function value(v: unknown): string {
  if (v && typeof v === "object" && "value" in v && "unit" in v)
    return `${(v as { value: number }).value}${(v as { unit: string }).unit}`;
  if (Array.isArray(v))
    return v.every((x) => typeof x === "number") ? `cubic-bezier(${v.join(", ")})` : v.join(", ");
  if (v && typeof v === "object" && "duration" in v)
    return value((v as { duration: unknown }).duration);
  return String(v);
}

type Demo = "color" | "radius" | "shadow" | "space" | "type" | "none";
interface Page {
  slug: string;
  title: string;
  line: string;
  tables: Array<{ id: string; title: string; demo: Demo; rows: Array<[string, string, string]> }>;
}

const rows = (group: string, keep: (name: string) => boolean = () => true) =>
  Object.entries(TOKENS[group] ?? {})
    .filter(([n]) => keep(n))
    .map(([n, t]) => [n, value(t.$value), t.$description ?? ""] as [string, string, string]);

const COLOR = (n: string) => !/^accent-\d+$/.test(n);
export const PAGES: Page[] = [
  {
    slug: "",
    title: "Themes",
    line: "Every color, size and motion a site's look is made of, set by one family and one theme.",
    tables: [],
  },
  {
    slug: "color",
    title: "Color",
    line: "The colors a component paints with, each named by its job; a family sets them with one attribute.",
    tables: [
      { id: "tokens", title: "Color tokens", demo: "color", rows: rows("color-light", COLOR) },
    ],
  },
  {
    slug: "typography",
    title: "Typography",
    line: "The faces and the type scale every page reads from.",
    tables: [{ id: "tokens", title: "Type tokens", demo: "type", rows: rows("type") }],
  },
  {
    slug: "radius",
    title: "Radius",
    line: "The corner of each kind of surface, from a chip in a line of text to a card.",
    tables: [
      {
        id: "tokens",
        title: "Radius tokens",
        demo: "radius",
        rows: [...rows("radius"), ...rows("line", (n) => n === "radius-control")],
      },
    ],
  },
  {
    slug: "spacing",
    title: "Spacing and density",
    line: "The spacing scale, the control sizes, and the two densities that move them.",
    tables: [
      { id: "space", title: "Spacing tokens", demo: "space", rows: rows("space") },
      { id: "control", title: "Control tokens", demo: "none", rows: rows("control") },
      { id: "compact", title: "Compact density", demo: "none", rows: rows("density-compact") },
      {
        id: "comfortable",
        title: "Comfortable density",
        demo: "none",
        rows: rows("density-comfortable"),
      },
    ],
  },
  {
    slug: "shadows",
    title: "Shadows",
    line: "The shadows a raised surface casts, darker in the dark theme.",
    tables: [
      {
        id: "tokens",
        title: "Shadow tokens",
        demo: "shadow",
        rows: SHADOWS.map(([n, v]) => [n, v, ""] as [string, string, string]),
      },
    ],
  },
  {
    slug: "motion",
    title: "Motion",
    line: "The durations and curves every transition takes; nothing moves under reduced motion.",
    tables: [{ id: "tokens", title: "Motion tokens", demo: "none", rows: rows("motion") }],
  },
  {
    slug: "dark-mode",
    title: "Dark mode",
    line: "The same board in both themes, and every color token's light and dark value.",
    tables: [
      {
        id: "tokens",
        title: "Color tokens, light and dark",
        demo: "color",
        rows: rows("color-light", COLOR).map(([n, v]) => [
          n,
          v,
          value(TOKENS["color-dark"]?.[n]?.$value ?? ""),
        ]),
      },
    ],
  },
];
export const pathOf = (p: Page) => (p.slug ? `/themes/${p.slug}/` : "/");

const GLYPH: Record<string, string> = {
  ok: "M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z",
  warn: "M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z",
  crit: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z",
};
const glyph = (tone: string, cls: string) =>
  `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="${GLYPH[tone]}"/></svg>`;

/** The board: Capsomer's real components, in the markup each one's doc gives. `p` keeps ids apart where two boards share a page. */
function board(p: string, scheme?: "light" | "dark"): string {
  const tab = (id: string, text: string, on: boolean, count = "") =>
    `<button type="button" class="cap-tab" role="tab" id="${p}-t-${id}" aria-selected="${on}" aria-controls="${p}-p-${id}" tabindex="${on ? 0 : -1}">${text}${count ? `<span class="cap-tab-count">${count}</span>` : ""}</button>`;
  const status = (tone: string, word: string) =>
    `<span class="cap-status" data-tone="${tone}">${glyph(tone, "cap-status-glyph")}${word}</span>`;
  return `<div class="th-board" data-cap-part="board" data-family="purple"${scheme ? ` data-cap-theme="${scheme}" data-scheme="${scheme}"` : ""}>
  ${scheme ? `<p class="th-board-cap">${scheme === "light" ? "Light" : "Dark"}</p>` : ""}
  <div class="th-board-grid">
    <div class="th-tile">
      <div class="th-row">
        <button type="button" class="cap-btn" data-variant="primary">Save changes</button>
        <button type="button" class="cap-btn" data-variant="secondary">Preview</button>
        <button type="button" class="cap-btn">Cancel</button>
        <button type="button" class="cap-btn" data-variant="quiet">Show more</button>
        <button type="button" class="cap-btn" data-variant="danger">Revoke agent</button>
      </div>
      <div class="cap-field">
        <label class="cap-field-label" for="${p}-name">Site name</label>
        <p class="cap-field-help" id="${p}-name-h">Shown at the top of every page.</p>
        <input class="cap-input" id="${p}-name" value="Field notes" autocomplete="off" aria-describedby="${p}-name-h" />
      </div>
      <div class="cap-field">
        <label class="cap-field-label" for="${p}-owner">Owner</label>
        <div class="cap-select-wrap"><select class="cap-select" id="${p}-owner"><option>capsid-driver</option><option>improve-loop</option></select></div>
      </div>
    </div>
    <div class="th-tile">
      <div class="cap-tabs" data-cap="tabs">
        <div class="cap-tabs-list" role="tablist" aria-label="Site sections">${tab("overview", "Overview", true)}${tab("runs", "Runs", false, "24")}</div>
        <div class="cap-tabs-panel" role="tabpanel" id="${p}-p-overview" aria-labelledby="${p}-t-overview" tabindex="0">
          <div class="th-row">${status("ok", "Healthy")}${status("warn", "Needs you")}${status("crit", "Down")}</div>
          <label class="cap-switch"><input type="checkbox" role="switch" checked /> Publish on save <span class="cap-switch-state" aria-hidden="true">On</span></label>
          <div class="cap-chips" role="group" aria-label="Show"><button type="button" class="cap-chip" aria-pressed="true">Drafts</button><button type="button" class="cap-chip" aria-pressed="false">Published</button></div>
        </div>
        <div class="cap-tabs-panel" role="tabpanel" id="${p}-p-runs" aria-labelledby="${p}-t-runs" tabindex="0" hidden>
          <p>24 runs today, none failed.</p>
        </div>
      </div>
      <fieldset class="cap-seg"><legend>Range</legend><div class="cap-seg-options"><label><input type="radio" name="${p}-range" value="day" checked /> Day</label><label><input type="radio" name="${p}-range" value="week" /> Week</label><label><input type="radio" name="${p}-range" value="month" /> Month</label></div></fieldset>
      <div class="cap-banner" data-tone="warn" role="status">${glyph("warn", "cap-status-glyph")}<p class="cap-banner-text">Could not refresh. Showing data from 4 minutes ago.</p></div>
    </div>
    <div class="th-tile th-wide">
      <div class="cap-table-wrap" role="region" tabindex="0" aria-label="Recent deploys">
        <table class="cap-table"><thead><tr><th scope="col">Site</th><th scope="col">Release</th><th scope="col">State</th></tr></thead>
        <tbody><tr><th scope="row">capsid</th><td class="cap-num">0.132.0</td><td>${status("ok", "Live")}</td></tr><tr><th scope="row">carrel</th><td class="cap-num">0.131.2</td><td>${status("warn", "Waiting")}</td></tr></tbody></table>
      </div>
    </div>
  </div>
</div>`;
}

/** The controls: the board's family, theme and density. Hidden until site/page.ts runs them. */
function controls(d: Data, scheme: boolean): string {
  const seg = (name: string, legend: string, items: Array<[string, string]>, chosen: string) =>
    `<fieldset class="cap-seg"><legend>${legend}</legend><div class="cap-seg-options">${items.map(([v, t]) => `<label><input type="radio" name="th-${name}" value="${v}"${v === chosen ? " checked" : ""} /> ${t}</label>`).join("")}</div></fieldset>`;
  const families = Object.keys(d.families);
  return `<div class="th-controls" data-cap-part="controls" hidden>
    <div class="cap-field"><label class="cap-field-label" for="th-family">Family</label><div class="cap-select-wrap"><select class="cap-select" id="th-family">${families.map((f) => `<option value="${esc(f)}"${f === "purple" ? " selected" : ""}>${esc(f[0]?.toUpperCase() + f.slice(1))}</option>`).join("")}</select></div></div>
    ${
      scheme
        ? seg(
            "scheme",
            "Theme",
            [
              ["page", "This page's"],
              ["light", "Light"],
              ["dark", "Dark"],
            ],
            "page",
          )
        : ""
    }
    ${seg(
      "density",
      "Density",
      [
        ["compact", "Compact"],
        ["default", "Default"],
        ["comfortable", "Comfortable"],
      ],
      "default",
    )}
  </div>`;
}

/** One token table: the token, its value (painted live from the board), a sample where one shows it, and its job. */
function tokenTable(t: Page["tables"][number], twoThemes: boolean): string {
  const head = twoThemes
    ? ["Token", "Light", "Dark"]
    : ["Token", "Value", ...(t.demo === "none" ? [] : ["Sample"]), "Job"];
  return table(
    t.title,
    head,
    t.rows.map(([n, v, about]) => {
      const name = `<code>--${esc(n)}</code>`;
      const live = (scheme: string, text: string) =>
        `<span class="th-val" data-token="${esc(n)}" data-scheme="${scheme}"><span class="th-demo" data-kind="${t.demo}" aria-hidden="true"></span><code>${esc(text)}</code></span>`;
      if (twoThemes) return [name, live("light", v), live("dark", about)];
      return [
        name,
        `<span class="th-val" data-token="${esc(n)}"><code>${esc(v)}</code></span>`,
        ...(t.demo === "none"
          ? []
          : [
              `<span class="th-demo" data-kind="${t.demo}" data-token="${esc(n)}" aria-hidden="true"></span>`,
            ]),
        esc(about),
      ];
    }),
  );
}

/** The overview's table: each part of a theme, its page and how many tokens it holds. */
const overviewTable = () =>
  table(
    "The parts of a theme",
    ["Part", "Tokens"],
    PAGES.slice(1).map((p) => [
      `<a href="${pathOf(p)}">${esc(p.title)}</a>`,
      String(p.tables.reduce((n, t) => n + t.rows.length, 0)),
    ]),
  );

export function renderTheme(d: Data, slug: string): string {
  const page = PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`no theme page ${slug}`);
  const dark = slug === "dark-mode";
  const stage = dark
    ? `<div class="th-pair">${board("bl", "light")}${board("bd", "dark")}</div>`
    : board("b");
  const tables = page.slug
    ? page.tables.map((t) => part(`tokens-${t.id}`, t.title, tokenTable(t, dark))).join("\n")
    : part("tokens-parts", "Tokens", overviewTable());
  const main = `${titleBlock(page.title, page.line)}
  <section class="th-stage" data-cap-part="stage" aria-label="Live components">
    ${controls(d, !dark)}
    ${stage}
  </section>
  ${tables}
  ${page.slug ? "" : `<div class="home-net" data-cap-part="network">${networkBoard()}</div>`}`;
  const toc = page.slug
    ? page.tables.map((t) => [`tokens-${t.id}`, t.title, false] as [string, string, boolean])
    : [];
  return `${header("Themes", firsts(d))}
${sectionPage({
  nav: [{ heading: "Themes", links: PAGES.map((p) => [pathOf(p), p.slug ? p.title : "Overview"]) }],
  here: pathOf(page),
  main,
  toc,
  label: "Themes",
})}
${FOOTER}`;
}
