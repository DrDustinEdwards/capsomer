// Capsomer's own site: a dashboard of the design system, inside the same AdminShell every
// family admin app uses (decided 2026-09-30, design.md section 11; the reference matches what
// the apps get, 2026-10-11), served at
// https://capsomer.dustinedwards.info by a static Cloudflare Worker (rule 16). Hash routes,
// so every view is one file.
import { StrictMode, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import "../css/fonts.css";
import "@fontsource-variable/source-serif-4/index.css";
import "../css/tokens.css";
import "../css/base.css";
import "../css/prose.css";
import "../tokens/themes.css";
import "./site.css";
import { AdminShell, FIRST_PAGE, type AdminEntry } from "../components/admin-shell/admin-shell.react.tsx";
import { BASE, CHANGELOG_MD, COMPONENTS, DEFAULTS_MD, FAMILIES, META, RESULTS_BUILD, fetchResults, type Results } from "./data.ts";
import { ColorView } from "./color-view.tsx";
import { renderMarkdown } from "./markdown.ts";
import { Panel, ResultsContext, TOOL, TestList, Verdict, useResults, when } from "./parts.tsx";
import { MarkdownView, MotionView, TestsView, TypeView } from "./views.tsx";

import.meta.glob("../components/*/*.css", { eager: true });

type View = "overview" | "components" | "color" | "type" | "motion" | "tests" | "defaults" | "changes";
const VIEWS: Array<{ id: View; label: string; icon: ReactNode; group: string }> = [
  { id: "overview", label: FIRST_PAGE, icon: <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />, group: "Design system" },
  { id: "components", label: "Components", icon: <Icon d="M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9z" />, group: "Design system" },
  { id: "color", label: "Color and contrast", icon: <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 3v18" />, group: "Design system" },
  { id: "type", label: "Type and space", icon: <Icon d="M4.5 4.5h15M12 4.5v15M8.5 19.5h7" />, group: "Design system" },
  { id: "motion", label: "Motion", icon: <Icon d="M3 12h4.5l3-6 3 12 3-6H21" />, group: "Design system" },
  { id: "tests", label: "Tests", icon: <Icon d="m5 12.5 4.5 4.5L19 7" />, group: "Records" },
  { id: "defaults", label: "Defaults", icon: <Icon d="M5 3.5h14v17H5zM8.5 8h7M8.5 12h7M8.5 16h4.5" />, group: "Records" },
  { id: "changes", label: "Changes", icon: <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3.5 2.5" />, group: "Records" },
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
    // The color page's old address still opens it.
    const view = raw === "colour" ? "color" : raw; // codespell:ignore
    const v = VIEWS.some((x) => x.id === view) ? (view as View) : "overview";
    return { view: v, detail: detail ? decodeURIComponent(detail) : null };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    // A page change is a view transition typed cap-page (css/base.css), where the browser has one.
    const on = () => {
      const swap = () =>
        flushSync(() => {
          setRoute(read());
          window.scrollTo(0, 0);
        });
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduce) return swap();
      try {
        document.startViewTransition({ update: swap, types: ["cap-page"] });
      } catch {
        document.startViewTransition(swap);
      }
    };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

// Unreleased work and the last three releases; the whole changelog is a link, not 40,000px of page.
const recentChanges = (md: string) =>
  `${md.split(/\n(?=## \[)/).slice(0, 4).join("\n")}\n\nOlder releases: [the whole changelog](https://github.com/DrDustinEdwards/capsomer/blob/main/CHANGELOG.md).`;

const href = (view: View, detail?: string) => `#/${view}${detail ? `/${encodeURIComponent(detail)}` : ""}`;

// ---- views ---------------------------------------------------------------------------------

function Overview() {
  const res = useResults();
  const failing = Object.entries(res.components).filter(([, r]) => r.keyboard.failed + r.accessibility.failed + r.behavior.failed > 0);
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
import "capsomer/site-header.css";   // each component's CSS, as used
import "capsomer/admin-shell.css";
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
              <Verdict passed={r.behavior.passed} failed={r.behavior.failed} />
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
  else if (view === "changes") page = <MarkdownView title="Changes" md={recentChanges(CHANGELOG_MD)} />;
  else page = <Overview />;

  return (
    <ResultsContext.Provider value={RESULTS}>
      <AdminShell
        app="capsomer"
        letterhead
        viewSite="/"
        search={{ action: "/search/", label: "Search Capsomer" }}
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
