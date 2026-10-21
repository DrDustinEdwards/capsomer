// The small parts every view of the site is built from (main.tsx).

import { createContext, useContext, type ReactNode } from "react";
import { RESULTS_BUILD, type ComponentDoc, type ComponentResults, type Results } from "./data.ts";

export function Panel({ title, src, flush, children, id }: { title: string; src?: ReactNode; flush?: boolean; children: ReactNode; id?: string }) {
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

export function Verdict({ passed, failed, none }: { passed: number; failed: number; none?: string }) {
  if (passed + failed === 0) return <span className="cap-status" data-tone="nodata">{none ?? "Not run"}</span>;
  if (failed) return <span className="cap-status" data-tone="crit">{`${failed} of ${passed + failed} failed`}</span>;
  return <span className="cap-status" data-tone="ok">{`${passed} passed`}</span>;
}

export function when(iso: string | null): string {
  if (!iso) return "never";
  const t = new Date(iso);
  return `${t.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} (${t.toISOString().slice(0, 16).replace("T", " ")} UTC)`;
}

export const TOOL = (c: ComponentDoc) => c.tool || "Native";

// Sets one CSS property through the CSSOM, never a style attribute (the apps' CSP rule,
// kept here too).
export const paint = (prop: string, value: string) => (el: HTMLElement | null) => {
  el?.style.setProperty(prop, value);
};

// The test results every view reads: the build's own, replaced by the last run on main
// once that has been read.
export const ResultsContext = createContext<Results>(RESULTS_BUILD);
export const useResults = () => useContext(ResultsContext);
export function TestList({ rows }: { rows: ComponentResults["tests"] }) {
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

