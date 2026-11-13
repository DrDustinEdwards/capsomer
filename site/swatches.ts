// The two one-page sections. Icons: a search box over the grid of every icon, a size control, and a click copies the
// name. Colors: every family as its 12 steps, light beside dark, each step's job above it, and a click copies the value.
// Both are whole HTML; site/page.ts adds the search, the size and the copying.
import * as icons from "../components/icons/icons.ts";
import { FOOTER, esc, header, titleBlock } from "./chrome.ts";
import { firsts, type Data } from "./content.ts";

const single = (main: string) =>
  `<div class="cap-page sw-page"><main id="main" tabindex="-1" class="comp-main">
${main}
</main></div>`;

export function renderIcons(d: Data): string {
  // Each icon is its own export: iconX is a stroked path, markX a filled mark's { d, fill }.
  const all = Object.entries(icons).flatMap(([n, v]): Array<[string, string, boolean]> =>
    typeof v === "string" && n.startsWith("icon")
      ? [[n, v, false]]
      : typeof v === "object" && n.startsWith("mark")
        ? [[n, v.d, true]]
        : [],
  );
  const tiles = all
    .map(
      ([n, p, fill]) =>
        `<li data-name="${esc(n)}"><button type="button" class="sw-icon" data-copy="${esc(n)}"><svg class="cap-icon" viewBox="0 0 24 24"${fill ? " data-fill" : ""} aria-hidden="true" focusable="false"><path d="${esc(p)}"/></svg><span>${esc(n)}</span></button></li>`,
    )
    .join("");
  const main = `${titleBlock("Icons", `${all.length} icons on one 24-unit grid; a click copies the export's name.`)}
  <div class="sw-tools" data-cap-part="icon-tools" hidden>
    <div class="cap-field"><label class="cap-field-label" for="icon-find">Find an icon</label><input class="cap-input" id="icon-find" type="search" autocomplete="off" aria-describedby="icon-n" /></div>
    <fieldset class="cap-seg"><legend>Size</legend><div class="cap-seg-options">${[16, 20, 24, 32]
      .map(
        (s) =>
          `<label><input type="radio" name="icon-size" value="${s}"${s === 24 ? " checked" : ""} /> ${s}</label>`,
      )
      .join("")}</div></fieldset>
  </div>
  <p class="cap-sr-only" id="icon-n" role="status"></p>
  <ul class="sw-icons" data-cap-part="icons">${tiles}</ul>`;
  return `${header("Icons", firsts(d))}
${single(main)}
${FOOTER}`;
}

// What each step does in a theme, from tokens/palette-core.mjs themes(): the steps a semantic token takes. The others
// are there for a component to use as --accent-N.
const JOBS: Record<number, string> = {
  3: "Selection",
  4: "Soft fill",
  9: "Brand, focus ring",
  10: "Main button",
  11: "Accent text",
  12: "Text on hover",
};

export function renderColors(d: Data): string {
  const names = Object.keys(d.scales);
  const steps = Array.from({ length: 12 }, (_, i) => i + 1);
  const row = (family: string, scheme: "light" | "dark") =>
    `<tr><th scope="row">${scheme === "light" ? "Light" : "Dark"}</th>${(
      d.scales[family]?.[scheme] ?? []
    )
      .map(
        (hex, i) =>
          `<td><button type="button" class="sw-step" data-copy="${esc(hex)}" data-hex="${esc(hex)}" aria-label="${esc(`${family} ${scheme} step ${i + 1}, ${hex}`)}"><span class="sw-chip" aria-hidden="true"></span><code>${esc(hex)}</code></button></td>`,
      )
      .join("")}</tr>`;
  const families = names
    .map(
      (f) => `<section class="sw-family" aria-labelledby="fam-${esc(f)}">
    <h2 id="fam-${esc(f)}">${esc(f[0]?.toUpperCase() + f.slice(1))} <code>${esc(d.families[f]?.seed ?? "")}</code></h2>
    <div class="cap-table-wrap" role="region" tabindex="0" aria-label="${esc(f)} scale">
      <table class="cap-table sw-scale"><thead><tr><th scope="col">Theme</th>${steps.map((s) => `<th scope="col"><span class="sw-n">${s}</span>${JOBS[s] ? `<span class="sw-job">${JOBS[s]}</span>` : ""}</th>`).join("")}</tr></thead>
      <tbody>${row(f, "light")}${row(f, "dark")}</tbody></table>
    </div>
  </section>`,
    )
    .join("\n  ");
  const main = `${titleBlock("Colors", `${names.length} families, 12 steps each in light and dark; a click copies the value.`)}
  <p class="cap-sr-only" id="copy-n" role="status"></p>
  ${families}`;
  return `${header("Colors", firsts(d))}
${single(main)}
${FOOTER}`;
}
