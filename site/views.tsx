// The site's type, motion, tests, defaults, changes and settings views (main.tsx).

import { useState, type ReactNode } from "react";
import { COMPONENTS, SCALES } from "./data.ts";
import { renderMarkdown } from "./markdown.ts";
import { Panel, TestList, Verdict, paint, useResults } from "./parts.tsx";

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

export function TypeView() {
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

export function MotionView() {
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

export function TestsView() {
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

export function MarkdownView({ title, md }: { title: string; md: string }) {
  return (
    <div className="site-page">
      <article className="site-doc" dangerouslySetInnerHTML={{ __html: renderMarkdown(md || `# ${title}\n\nNothing yet.`, 0) }} />
    </div>
  );
}

export function SettingsView() {
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

