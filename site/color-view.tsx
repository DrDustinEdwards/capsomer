// The site's colour and contrast view: both themes' pairs and every family's scales (main.tsx).

import { FAMILIES, PALETTE, type Pair } from "./data.ts";
import { Panel, paint } from "./parts.tsx";

const FGS = ["text", "muted", "dim", "accent-text", "ok", "warn", "crit", "info"];
const BGS = ["ground", "surface", "raised", "sunken", "sel", "accent-soft"];

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
}
const ratio = (a: string, b: string) => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

function ThemeColumn({ scheme }: { scheme: "light" | "dark" }) {
  if (!PALETTE) return null;
  const t = PALETTE[scheme];
  const asserted = (fg: string, bg: string) => t.pairs.find((p: Pair) => p.fg === fg && p.bg === bg);
  return (
    <div className="site-theme" data-cap-theme={scheme}>
      <h3>{scheme === "light" ? "Light" : "Dark"}</h3>
      <ul className="site-swatches">
        {PALETTE.order.map((k) => (
          <li key={k}>
            <i ref={paint("background", `var(--${k})`)} />
            <span className="cap-mono">--{k}</span>
            <span className="cap-mono cap-muted">{t.tokens[k]}</span>
          </li>
        ))}
      </ul>
      <div className="cap-table-wrap" role="region" tabIndex={0} aria-label={`${scheme === "light" ? "Light" : "Dark"} theme contrast grid`}>
        <table className="cap-table site-grid">
          <thead>
            <tr>
              <th scope="col">Text on</th>
              {BGS.map((b) => (
                <th key={b} scope="col" className="cap-mono">
                  --{b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FGS.map((f) => (
              <tr key={f}>
                <th scope="row" className="cap-mono">
                  --{f}
                </th>
                {BGS.map((b) => {
                  const r = ratio(t.tokens[f] ?? "#000000", t.tokens[b] ?? "#ffffff");
                  const a = asserted(f, b);
                  if (!a)
                    return (
                      <td key={b} className="site-unused">
                        <span className="cap-num">{r.toFixed(1)}</span> <span className="cap-muted">not used</span>
                      </td>
                    );
                  return (
                    <td key={b}>
                      <span className="cap-status" data-tone={a.pass ? "ok" : "crit"}>
                        {a.pass ? "Pass" : "Fail"} <span className="cap-num">{a.ratio.toFixed(1)}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// The three color families of rules 14 and 15: each one's 12 steps in both themes, and
// every pair it is checked on, its default theme first.
function FamilyScales() {
  const fams = FAMILIES;
  if (!fams?.scales) return null;
  const names = Object.keys(fams.families);
  return (
    <Panel title="The color families" id="families" src="Rules 14 and 15, locked 2026-10-01">
      <p className="cap-muted">
        Each family is one 12-step scale with the same lightness roles: step 9 is the seed, the solid accent; step 11 is the deep accent for text. Each family is checked in both themes, its own default theme first, and every pair passes (rulings.md, rule 18): the brand color is step 9 for focus rings and large fills, accent text and links use step 11, and the primary button fills with step 10 (amber, too light for a white label, fills with step 9 in light and carries a dark label in both themes). Purple is the default; fox, teal, amber, navy and forest switch on with data-family on the root or on any element (capsomer/families.css).
      </p>
      {names.map((n) => {
        const f = fams.families[n];
        const s = fams.scales?.[n];
        if (!f || !s) return null;
        const mine = fams.pairs.filter((p) => p.family === n);
        const failing = mine.filter((p) => !p.pass);
        const order: Array<"light" | "dark"> = f.defaultTheme === "dark" ? ["dark", "light"] : ["light", "dark"];
        return (
          <section key={n} className="site-family" aria-labelledby={`fam-${n}`}>
            <h3 id={`fam-${n}`}>
              {n.charAt(0).toUpperCase() + n.slice(1)} <span className="cap-mono cap-muted">{f.seed}</span>
            </h3>
            <p className="cap-muted">
              {f.note}. Default theme: {f.defaultTheme}.
            </p>
            {order.map((scheme) => (
              <div key={scheme} className="site-steps-row" data-cap-theme={scheme}>
                <span className="cap-label">{scheme === "light" ? "Light" : "Dark"}{scheme === f.defaultTheme ? ", default" : ""}</span>
                <ol className="site-steps">
                  {s[scheme].map((hex, i) => (
                    <li key={i}>
                      <i ref={paint("background", hex)} />
                      <span className="cap-num">{i + 1}</span>
                      <span className="cap-mono">{hex}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <p>
              {failing.length === 0 ? (
                <span className="cap-status" data-tone="ok">
                  Every one of its {mine.length} pairs passes
                </span>
              ) : (
                <span className="cap-status" data-tone="crit">
                  {failing.length} of {mine.length} pairs fail
                </span>
              )}
            </p>
            {failing.length > 0 && (
              <div className="cap-table-wrap" role="region" tabIndex={0} aria-label={`${n} failing pairs`}>
                <table className="cap-table">
                  <thead>
                    <tr>
                      <th scope="col">Theme</th>
                      <th scope="col">What</th>
                      <th scope="col">Pair</th>
                      <th scope="col">Ratio</th>
                      <th scope="col">Needs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failing.map((p, i) => (
                      <tr key={i}>
                        <td>
                          {p.scheme}
                          {p.isDefault ? " (default)" : ""}
                        </td>
                        <td>{p.what}</td>
                        <td className="cap-mono">
                          --{p.fg} {p.fgHex} on --{p.bg} {p.bgHex}
                        </td>
                        <td data-num="">{p.ratio.toFixed(2)}</td>
                        <td data-num="">{p.min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </Panel>
  );
}

export function ColorView() {
  if (!PALETTE)
    return (
      <div className="site-page">
        <div className="cap-empty" data-kind="failed" role="alert">
          <b>The palette data is missing from this build</b>
          <span>Run capsomer site-data before the site build.</span>
        </div>
      </div>
    );
  const all = [...PALETTE.light.pairs.map((p) => ({ ...p, scheme: "Light" })), ...PALETTE.dark.pairs.map((p) => ({ ...p, scheme: "Dark" }))];
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Color and contrast</h1>
        <p>
          One seed, <span className="cap-mono">{PALETTE.seed}</span>, makes every color in both themes. Status colors keep their own hues and are tuned for contrast. A pair the generator asserts shows Pass or Fail against WCAG 2.2 (4.5:1 for text, 3:1 for a boundary); a pair no component puts together says “not used”.
        </p>
      </div>
      <FamilyScales />
      <div className="site-pair">
        <ThemeColumn scheme="light" />
        <ThemeColumn scheme="dark" />
      </div>
      <Panel title="Every asserted pair of the committed palette" id="pairs" src={`${all.length} pairs, both themes. The families above have ${FAMILIES?.pairs.length ?? 0} in all`} flush>
        <div className="cap-table-wrap" role="region" tabIndex={0} aria-labelledby="pairs-h">
          <table className="cap-table">
            <thead>
              <tr>
                <th scope="col">Theme</th>
                <th scope="col">What</th>
                <th scope="col">Foreground</th>
                <th scope="col">Background</th>
                <th scope="col">Ratio</th>
                <th scope="col">Needs</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {all.map((p, i) => (
                <tr key={i}>
                  <td>{p.scheme}</td>
                  <td>{p.what}</td>
                  <td className="cap-mono">--{p.fg}</td>
                  <td className="cap-mono">--{p.bg}</td>
                  <td data-num="">{p.ratio.toFixed(2)}</td>
                  <td data-num="">{p.min}</td>
                  <td>
                    <span className="cap-status" data-tone={p.pass ? "ok" : "crit"}>
                      {p.pass ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

