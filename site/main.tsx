// Capsomer's own site: a dashboard of the design system, inside the same AdminShell every
// family admin app uses (decided 2026-09-30, design.md section 11; the reference matches what
// the apps get, 2026-10-11), served at
// https://capsomer.dustinedwards.info by a static Cloudflare Worker (rule 16). Hash routes,
// so every view is one file.
import { StrictMode, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/schibsted-grotesk/400.css";
import "@fontsource/schibsted-grotesk/500.css";
import "@fontsource/schibsted-grotesk/600.css";
import "@fontsource/schibsted-grotesk/800.css";
import "@fontsource/martian-mono/400.css";
import "@fontsource-variable/source-serif-4/index.css";
import "../css/tokens.css";
import "../css/base.css";
import "../css/prose.css";
import "../tokens/themes.css";
import "./site.css";
import { AdminShell, FIRST_PAGE, type AdminEntry } from "../components/admin-shell/admin-shell.react.tsx";
import { BASE, CHANGELOG_MD, COMPONENTS, DEFAULTS_MD, FAMILIES, META, PALETTE, RESULTS_BUILD, SCALES, fetchResults, type ComponentDoc, type ComponentResults, type Pair, type Results } from "./data.ts";

// The test results every view reads: the build's own, replaced by the last run on main
// once that has been read.
const ResultsContext = createContext<Results>(RESULTS_BUILD);
const useResults = () => useContext(ResultsContext);
import { renderMarkdown } from "./markdown.ts";

import.meta.glob("../components/*/*.css", { eager: true });

type View = "overview" | "components" | "color" | "type" | "motion" | "tests" | "defaults" | "changes" | "settings";
const VIEWS: Array<{ id: View; label: string; icon: ReactNode; group: string }> = [
  { id: "overview", label: FIRST_PAGE, icon: <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />, group: "Design system" },
  { id: "components", label: "Components", icon: <Icon d="M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9z" />, group: "Design system" },
  { id: "color", label: "Color and contrast", icon: <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 3v18" />, group: "Design system" },
  { id: "type", label: "Type and space", icon: <Icon d="M4.5 4.5h15M12 4.5v15M8.5 19.5h7" />, group: "Design system" },
  { id: "motion", label: "Motion", icon: <Icon d="M3 12h4.5l3-6 3 12 3-6H21" />, group: "Design system" },
  { id: "tests", label: "Tests", icon: <Icon d="m5 12.5 4.5 4.5L19 7" />, group: "Records" },
  { id: "defaults", label: "Defaults", icon: <Icon d="M5 3.5h14v17H5zM8.5 8h7M8.5 12h7M8.5 16h4.5" />, group: "Records" },
  { id: "changes", label: "Changes", icon: <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3.5 2.5" />, group: "Records" },
  { id: "settings", label: "Settings", icon: <Icon d="M4 7h3M11 7h9M4 12h9M17 12h3M4 17h5M13 17h7M9 5v4M15 10v4M11 15v4" />, group: "Records" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className="cap-admin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

function useRoute(): { view: View; detail: string | null } {
  const read = () => {
    const [raw, detail] = location.hash.replace(/^#\/?/, "").split("/");
    // The colour page's old address still opens it.
    const view = raw === "colour" ? "color" : raw;
    const v = VIEWS.some((x) => x.id === view) ? (view as View) : "overview";
    return { view: v, detail: detail ? decodeURIComponent(detail) : null };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

const href = (view: View, detail?: string) => `#/${view}${detail ? `/${encodeURIComponent(detail)}` : ""}`;

// ---- small parts ---------------------------------------------------------------------------

function Panel({ title, src, flush, children, id }: { title: string; src?: ReactNode; flush?: boolean; children: ReactNode; id?: string }) {
  return (
    <section className="cap-panel" aria-labelledby={id ? `${id}-h` : undefined} data-flush={flush ? "" : undefined}>
      <header className="cap-panel-head">
        <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
        {src ? <span className="cap-panel-src">{src}</span> : null}
      </header>
      <div className="cap-panel-body">{children}</div>
    </section>
  );
}

function Verdict({ passed, failed, none }: { passed: number; failed: number; none?: string }) {
  if (passed + failed === 0) return <span className="cap-status" data-tone="nodata">{none ?? "Not run"}</span>;
  if (failed) return <span className="cap-status" data-tone="crit">{`${failed} of ${passed + failed} failed`}</span>;
  return <span className="cap-status" data-tone="ok">{`${passed} passed`}</span>;
}

function when(iso: string | null): string {
  if (!iso) return "never";
  const t = new Date(iso);
  return `${t.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} (${t.toISOString().slice(0, 16).replace("T", " ")} UTC)`;
}

const TOOL = (c: ComponentDoc) => c.tool || "Native";

// Sets one CSS property through the CSSOM, never a style attribute (the apps' CSP rule,
// kept here too).
const paint = (prop: string, value: string) => (el: HTMLElement | null) => {
  el?.style.setProperty(prop, value);
};

// ---- views ---------------------------------------------------------------------------------

function Overview() {
  const res = useResults();
  const failing = Object.entries(res.components).filter(([, r]) => r.keyboard.failed + r.accessibility.failed + r.behaviour.failed > 0);
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Capsomer</h1>
        <p>The shared design system for every one of Dustin Edwards's apps: one palette from one seed, one set of components, and the tests that keep them accessible. Every rule is a default with its reason; CI blocks only on accessibility, security, privacy and correctness.</p>
      </div>
      <div className="site-figures">
        <a className="site-figure" href={href("components")}>
          <span className="cap-label">Components</span>
          <b className="cap-num">{COMPONENTS.length}</b>
          <span className="cap-muted">in release {META.version}</span>
        </a>
        <a className="site-figure" href={href("tests")}>
          <span className="cap-label">Tests</span>
          <b className="cap-num">{res.available ? res.totals.passed + res.totals.failed : "No data"}</b>
          {/* The number is said once, above: this line says only how the run went. */}
          <span>
            {res.available ? (
              <span className="cap-status" data-tone={res.totals.failed ? "crit" : "ok"}>
                {res.totals.failed ? `${res.totals.failed} failed` : "All passed"}
              </span>
            ) : (
              <span className="cap-muted">No run recorded in this build</span>
            )}
          </span>
        </a>
        <a className="site-figure" href={href("color")}>
          <span className="cap-label">Contrast pairs</span>
          <b className="cap-num">{FAMILIES ? FAMILIES.pairs.length : "No data"}</b>
          {FAMILIES ? (
            <>
              <span className="cap-muted">{`${Object.keys(FAMILIES.families).length} color families in 2 themes`}</span>
              <span>
                <span className="cap-status" data-tone={FAMILIES.pairs.some((p) => !p.pass) ? "crit" : "ok"}>
                  {FAMILIES.pairs.some((p) => !p.pass) ? `${FAMILIES.pairs.filter((p) => !p.pass).length} failing` : "None failing"}
                </span>
              </span>
            </>
          ) : (
            <span className="cap-muted">No palette data in this build</span>
          )}
        </a>
      </div>
      {failing.length > 0 && (
        <div className="cap-banner" data-tone="crit" role="alert">
          <b>{failing.length === 1 ? "One component is failing its tests: " : `${failing.length} components are failing their tests: `}</b>
          {failing.map(([n], i) => (
            <span key={n}>
              {i ? ", " : ""}
              <a href={href("components", n)}>{n}</a>
            </span>
          ))}
          .
        </div>
      )}
      <Panel title="How an app uses it" id="install">
        <pre className="site-code">
          <code>{`"capsomer": "github:DrDustinEdwards/capsomer#v${META.version}"

import "capsomer/tokens.css";        // the layer order and every token
import "capsomer/base.css";
import "capsomer/admin-shell.css";   // each component's CSS, as used
import "capsomer/theme-switch.css";
import { AdminShell, FIRST_PAGE } from "capsomer/react/admin-shell";

<AdminShell
  app="carrel"                       // the strip, its order and logos come from Capsomer
  page={FIRST_PAGE}                  // the top bar and the tab: "Overview · Carrel"
  nav={[{ id: "overview", label: FIRST_PAGE, href: "/", icon, current: true }]}
  badges={{ portal: { count: 3 } }}  // other apps that need you
  onRefresh={refresh}                // Refresh shows only where the page refreshes
>
  <div className="cap-admin-page">…</div>
</AdminShell>`}</code>
        </pre>
        <p className="cap-muted">Every Capsomer rule sits in a cap.* cascade layer, so an app's own CSS wins while it moves over one screen at a time.</p>
      </Panel>
      <p className="cap-muted site-built">
        Built {when(META.built)} from {META.commit ?? "a working copy"}. Tests ran {when(res.ran)}.
        {META.runUrl ? (
          <>
            {" "}
            <a href={META.runUrl}>Open the run</a>.
          </>
        ) : null}
      </p>
    </div>
  );
}

function ComponentsView() {
  const RESULTS = useResults();
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Components</h1>
        <p>Every component, how it is built, and its tests from the last run. Open one to see every state in both themes.</p>
      </div>
      <div className="cap-table-wrap" role="region" aria-labelledby="components-caption" tabIndex={0}>
        <table className="cap-table">
          <caption id="components-caption" className="cap-sr-only">
            Components and their test results
          </caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Built with</th>
              <th scope="col">States</th>
              <th scope="col">Keyboard</th>
              <th scope="col">Accessibility</th>
              <th scope="col">Since</th>
            </tr>
          </thead>
          <tbody>
            {COMPONENTS.map((c) => {
              const r = RESULTS.components[c.name];
              return (
                <tr key={c.name}>
                  <th scope="row">
                    <a href={href("components", c.name)}>{c.title}</a>
                    <div className="cap-muted site-sub">{c.summary}</div>
                  </th>
                  <td>{TOOL(c)}</td>
                  <td data-num="">{c.states.length}</td>
                  <td>
                    <Verdict passed={r?.keyboard.passed ?? 0} failed={r?.keyboard.failed ?? 0} />
                  </td>
                  <td>
                    <Verdict passed={r?.accessibility.passed ?? 0} failed={r?.accessibility.failed ?? 0} />
                  </td>
                  <td className="cap-mono">{c.added || "0.1.0"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TestList({ rows }: { rows: ComponentResults["tests"] }) {
  const sorted = [...rows].sort((a, b) => (a.status === b.status ? 0 : a.status === "failed" ? -1 : b.status === "failed" ? 1 : 0));
  return (
    <ul className="site-tests">
      {sorted.map((t, i) => (
        <li key={i} data-status={t.status}>
          <span className="cap-status" data-tone={t.status === "passed" ? "ok" : t.status === "failed" ? "crit" : "nodata"}>
            {t.status === "passed" ? "Passed" : t.status === "failed" ? "Failed" : "Skipped"}
          </span>
          <span>
            {t.title}
            {t.theme ? <span className="cap-muted">, {t.theme}</span> : null}
            {t.error ? <pre className="site-code site-error">{t.error}</pre> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ComponentPage({ name }: { name: string }) {
  const RESULTS = useResults();
  const c = COMPONENTS.find((x) => x.name === name);
  if (!c)
    return (
      <div className="site-page">
        <div className="cap-empty" data-kind="no-match">
          <b>No component is called {name}</b>
          <a href={href("components")}>See every component</a>
        </div>
      </div>
    );
  const r = RESULTS.components[c.name];
  const states = `${BASE}components/${c.name}/states.html`;
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>{c.title}</h1>
        <p>{c.summary}</p>
        <dl className="site-facts">
          <div>
            <dt>Built with</dt>
            <dd>{TOOL(c)}</dd>
          </div>
          <div>
            <dt>Parts</dt>
            <dd>{c.parts.join(", ") || "CSS"}</dd>
          </div>
          <div>
            <dt>Since</dt>
            <dd className="cap-mono">{c.added || "0.1.0"}</dd>
          </div>
          {c.source ? (
            <div>
              <dt>From</dt>
              <dd>{c.source}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <Panel title="Every state, both themes" id="states" src={`${c.states.length} states`}>
        <div className="site-pair">
          {(["light", "dark"] as const).map((t) => (
            <figure key={t}>
              <figcaption className="cap-label">{t === "light" ? "Light" : "Dark"}</figcaption>
              <iframe className="site-frame" src={`${states}?theme=${t}`} title={`${c.title} states, ${t} theme`} loading="lazy" />
            </figure>
          ))}
        </div>
        <p className="cap-muted">
          <a href={states}>Open the states page on its own</a>.
        </p>
      </Panel>
      <Panel title="Tests" id="tests" src={RESULTS.available ? `Ran ${when(RESULTS.ran)}` : "No run recorded in this build"}>
        {r ? (
          <>
            <p className="site-verdicts">
              Keyboard <Verdict passed={r.keyboard.passed} failed={r.keyboard.failed} /> Accessibility <Verdict passed={r.accessibility.passed} failed={r.accessibility.failed} /> Behavior{" "}
              <Verdict passed={r.behaviour.passed} failed={r.behaviour.failed} />
            </p>
            <TestList rows={r.tests} />
          </>
        ) : (
          <div className="cap-empty" data-kind="nothing-yet">
            <b>No results for this component</b>
            <span className="cap-muted">They appear after the next test run on main.</span>
          </div>
        )}
      </Panel>
      <article className="site-doc" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body.replace(/^#\s+.*\n/, ""), 1) }} />
    </div>
  );
}

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
        Each family is one 12-step scale with the same lightness roles: step 9 is the seed, the solid accent; step 11 is the deep accent for text. Each family is checked in both themes, its own default theme first, and every pair passes (rulings.md, rule 18): the brand color is step 9 for focus rings and large fills, accent text and links use step 11, and the primary button fills with step 10. Purple is the default; fox and teal switch on with data-family on the root or on any element (capsomer/families.css).
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
              {n === "purple" ? "Purple" : n === "fox" ? "Fox" : n === "teal" ? "Teal" : n} <span className="cap-mono cap-muted">{f.seed}</span>
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

function ColorView() {
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

function ScaleTable({ group, render }: { group: string; render?: (name: string, value: unknown) => ReactNode }) {
  const rows = Object.entries(SCALES[group] ?? {});
  const show = (v: unknown) => (typeof v === "object" && v && "value" in (v as object) ? `${(v as { value: number }).value}${(v as { unit?: string }).unit ?? ""}` : Array.isArray(v) ? `cubic-bezier(${v.join(", ")})` : String(v));
  return (
    <div className="cap-table-wrap" role="region" tabIndex={0} aria-label={`${group} tokens`}>
      <table className="cap-table">
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
            {render ? <th scope="col">Sample</th> : null}
            <th scope="col">For</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, t]) => (
            <tr key={name}>
              <td className="cap-mono">--{name}</td>
              <td className="cap-mono">{show(t.$value)}</td>
              {render ? <td>{render(name, t.$value)}</td> : null}
              <td className="cap-muted">{t.$description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TypeView() {
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Type and space</h1>
        <p>Schibsted Grotesk for app chrome, Martian Mono for identifiers, Source Serif 4 for long-form text. App body text is 13 px; a reading page's body is 17 to 19 px with a 66-character measure.</p>
      </div>
      <Panel title="Type" id="type">
        <ScaleTable group="type" render={(name) => (name.startsWith("fs-") ? <span className="site-type-sample" ref={paint("font-size", `var(--${name})`)}>Phage λ and φX174</span> : null)} />
      </Panel>
      <Panel title="Reading context" id="prose">
        <div data-context="prose" className="site-prose-sample">
          <h2>How a temperate phage decides</h2>
          <p>
            A temperate phage such as λ does not always kill the cell it enters. In <i>Escherichia coli</i> the outcome turns on two proteins, CI and Cro, each of which shuts off the gene for the other. Small lytic phages such as φX174 have no such switch. Sample text.
          </p>
        </div>
      </Panel>
      <Panel title="Space" id="space">
        <ScaleTable group="space" render={(name) => <i className="site-space" ref={paint("--w", `var(--${name})`)} />} />
      </Panel>
      <Panel title="Density" id="density" src="data-density on the root or any element; compact is the default">
        <ScaleTable group="density-compact" />
        <ScaleTable group="density-comfortable" />
      </Panel>
      <Panel title="Radius, control size, layers, focus, layout" id="other">
        <ScaleTable group="radius" render={(name) => <i className="site-radius" ref={paint("border-radius", `var(--${name})`)} />} />
        <ScaleTable group="control" />
        <ScaleTable group="layer" />
        <ScaleTable group="focus" />
        <ScaleTable group="layout" />
      </Panel>
    </div>
  );
}

function MotionView() {
  const [played, setPlayed] = useState(false);
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Motion</h1>
        <p>Motion explains a change. Three durations and two easings; with reduced motion on, the dots below jump instead of travelling, and nothing in Capsomer moves at all.</p>
      </div>
      <Panel title="Durations" id="durations" src={<button type="button" className="cap-btn" onClick={() => setPlayed((p) => !p)} aria-pressed={played}>Play</button>}>
        <div className="site-motion" data-played={played ? "" : undefined}>
          {["dur-fast", "dur-base", "dur-slow"].map((d) => (
            <div key={d}>
              <span className="cap-mono">--{d}</span>
              <div className="site-track" ref={paint("--d", `var(--${d})`)}>
                <i />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Every motion token" id="motion">
        <ScaleTable group="motion" />
      </Panel>
    </div>
  );
}

function TestsView() {
  const RESULTS = useResults();
  const entries = Object.entries(RESULTS.components).sort(([, a], [, b]) => b.keyboard.failed + b.accessibility.failed + b.behaviour.failed - (a.keyboard.failed + a.accessibility.failed + a.behaviour.failed));
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Tests</h1>
        <p>Every component's keyboard, accessibility and behavior tests from the last run, in both themes, failures first. Accessibility and keyboard failures block a merge; nothing about a color or a layout does.</p>
      </div>
      {!RESULTS.available ? (
        <div className="cap-empty" data-kind="nothing-yet">
          <b>No test run is recorded in this build</b>
          <span className="cap-muted">CI runs the tests on every push to main and builds this page from the results.</span>
        </div>
      ) : (
        entries.map(([name, r]) => (
          <Panel key={name} title={COMPONENTS.find((c) => c.name === name)?.title ?? name} id={`t-${name}`} src={<Verdict passed={r.keyboard.passed + r.accessibility.passed + r.behaviour.passed} failed={r.keyboard.failed + r.accessibility.failed + r.behaviour.failed} />}>
            <TestList rows={r.tests} />
          </Panel>
        ))
      )}
    </div>
  );
}

function MarkdownView({ title, md }: { title: string; md: string }) {
  return (
    <div className="site-page">
      <article className="site-doc" dangerouslySetInnerHTML={{ __html: renderMarkdown(md || `# ${title}\n\nNothing yet.`, 0) }} />
    </div>
  );
}

function SettingsView() {
  return (
    <div className="site-page">
      <div className="site-head">
        <h1>Settings</h1>
        <p>Preferences for this browser only. Nothing here is sent anywhere.</p>
      </div>
      <Panel title="Theme" id="theme">
        <p>The Light and Dark switch at the right of the top bar changes the theme. The first visit follows your device; your first choice is remembered in this browser.</p>
      </Panel>
      <Panel title="Menu" id="rail">
        <p>The button at the top of the left strip collapses the menu to icons, and the [ key does the same. This browser remembers the choice.</p>
      </Panel>
    </div>
  );
}

// ---- the app -------------------------------------------------------------------------------

function App() {
  const { view, detail } = useRoute();
  const [RESULTS, setResults] = useState<Results>(RESULTS_BUILD);
  useEffect(() => {
    let live = true;
    void fetchResults().then((r) => {
      if (live && r) setResults(r);
    });
    return () => {
      live = false;
    };
  }, []);
  const failed = RESULTS.totals.failed;
  const nav: AdminEntry[] = useMemo(
    () =>
      VIEWS.map((v) => ({
        id: v.id,
        label: v.label,
        href: href(v.id),
        icon: v.icon,
        group: v.group,
        current: view === v.id,
        ...(v.id === "components" ? { count: COMPONENTS.length } : {}),
        ...(v.id === "tests" && failed ? { count: failed, countNote: "failing", tone: "crit" as const } : {}),
      })),
    [view, failed],
  );
  const tabs = nav.filter((e) => ["overview", "components", "color", "tests"].includes(e.id));
  // The collapse key, as every family app binds it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      document.querySelector<HTMLButtonElement>("[data-cap-part='menu-toggle']")?.click();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const pageName = view === "components" && detail ? (COMPONENTS.find((c) => c.name === detail)?.title ?? detail) : (VIEWS.find((x) => x.id === view)?.label ?? FIRST_PAGE);

  let page: ReactNode;
  if (view === "components" && detail) page = <ComponentPage name={detail} />;
  else if (view === "components") page = <ComponentsView />;
  else if (view === "color") page = <ColorView />;
  else if (view === "type") page = <TypeView />;
  else if (view === "motion") page = <MotionView />;
  else if (view === "tests") page = <TestsView />;
  else if (view === "defaults") page = <MarkdownView title="Defaults" md={DEFAULTS_MD} />;
  else if (view === "changes") page = <MarkdownView title="Changes" md={CHANGELOG_MD} />;
  else if (view === "settings") page = <SettingsView />;
  else page = <Overview />;

  return (
    <ResultsContext.Provider value={RESULTS}>
      <AdminShell
        app="capsomer"
        nav={nav}
        tabs={tabs}
        page={pageName}
        trail={view === "components" && detail ? [{ label: "Components", href: href("components") }] : undefined}
        updated={{ at: RESULTS.ran ?? META.built }}
        prefKey="cap-site-rail"
      >
        <div className="cap-admin-page">{page}</div>
      </AdminShell>
    </ResultsContext.Provider>
  );
}

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
