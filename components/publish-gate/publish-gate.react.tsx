import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { fail as plainFail, say as plainSay, type SayOptions } from "../message/message.ts";
import { attachRowList } from "../row-list/row-list.ts";
import { Glyph } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import { FIRST_PUBLICATION_NOTE, appliesTo, checkState, countChecks, advisoryHeading, describeGate, holdText, passedHeading, requiredHeading, siteDetail, siteState, stateWord, type GateCheck, type GateSite, type GateState } from "./publish-gate.ts";

export type { GateCheck, GateHold, GatePublished, GateSite, GateState } from "./publish-gate.ts";

const TONE: Record<GateState, "crit" | "info" | "ok"> = { blocked: "crit", held: "info", ready: "ok", published: "ok" };

function StateStatus({ state }: { state: GateState }) {
  return (
    <span className="cap-status" data-tone={TONE[state]}>
      <Glyph name={TONE[state]} />
      {stateWord(state)}
    </span>
  );
}

export interface PublishButtonProps {
  // The gate this belongs to (its id) and the destination.
  gateId: string;
  site: GateSite;
  state: GateState;
  busy?: boolean;
  // The id of the gate's summary, which describes a button that is not ready.
  summaryId: string;
  // Name the destination in the buttons' accessible names (several destinations).
  named?: boolean;
  // "sm" in a row; "default" for the page's own publish control.
  size?: "sm" | "default";
  onPublish: () => void;
  onUnpublish: () => void;
}

// The paired publish control for one destination: Publish, Publishing..., Publish blocked,
// Publish held, or, once published, View and Unpublish.
export function PublishButton({ gateId, site, state, busy = false, summaryId, named = false, size = "sm", onPublish, onUnpublish }: PublishButtonProps) {
  const suffix = named ? `, ${site.name}` : undefined;
  const sz = size === "sm" ? "sm" : undefined;
  if (state === "published" && site.published) {
    return (
      <div data-cap-actions="" data-gate={gateId} data-site={site.id} data-site-label={named ? site.name : undefined} data-btn-size={size === "default" ? "default" : undefined}>
        <a className="cap-btn" data-cap-part="view" data-size={sz} aria-label={suffix ? `View live page${suffix}` : undefined} href={site.published.url}>
          View
        </a>
        <button type="button" className="cap-btn" data-cap-part="unpublish" data-size={sz} data-variant="quiet" data-site={site.id} aria-label={suffix ? `Unpublish${suffix}` : undefined} onClick={onUnpublish}>
          Unpublish
        </button>
      </div>
    );
  }
  const ready = state === "ready" && !busy;
  const label = busy ? "Publishing..." : state === "blocked" ? "Publish blocked" : state === "held" ? "Publish held" : "Publish";
  return (
    <div data-cap-actions="" data-gate={gateId} data-site={site.id} data-site-label={named ? site.name : undefined} data-btn-size={size === "default" ? "default" : undefined}>
      <button
        type="submit"
        name="intent"
        value="publish"
        className="cap-btn"
        data-cap-part="publish"
        data-size={sz}
        data-site={site.id}
        data-variant={ready || busy ? "primary" : "secondary"}
        aria-disabled={ready ? undefined : true}
        aria-busy={busy ? true : undefined}
        aria-describedby={ready ? undefined : summaryId}
        aria-label={suffix ? `${label}${suffix}` : undefined}
        onClick={(e) => {
          // A blocked or held button stays focusable so its reason is heard; pressing it does nothing.
          if (!ready) return e.preventDefault();
          e.preventDefault();
          onPublish();
        }}
      >
        {label}
      </button>
    </div>
  );
}

// A first publication is one-way, so it is previewed in the shared confirm dialog, the destination
// listed and focus on Cancel; anything already public is published at once. For a page that
// places its own <PublishButton>.
export async function publishWithPreview(site: GateSite, perform: () => Promise<void>): Promise<void> {
  if (!site.first) return perform();
  await confirm({
    title: `Publish to ${site.name}?`,
    lead: "Publishing for the first time cannot be taken back quietly: it goes public at once.",
    body: [`${site.name}: ${FIRST_PUBLICATION_NOTE}`],
    action: `Publish to ${site.name}`,
    perform,
  });
}

export interface PublishGateProps {
  label: ReactNode;
  sites: GateSite[];
  checks: GateCheck[];
  // Publish to these destinations. Resolve when it is live; reject with an Error saying why not.
  // The app then passes the destination as published.
  publish?: (siteIds: string[]) => Promise<void>;
  // Take it off the public site. Done at once, with Undo.
  unpublish?: (siteIds: string[]) => Promise<void>;
  // Where each destination's button is: in its row (default), or "none" when the page places
  // <PublishButton> itself (the editor bar's own publish control).
  actions?: "rows" | "none";
  // Where results are said, with Undo: useMessage().say and .fail. Without them the plain behaviour
  // module's region (an element with data-cap="message") is used.
  say?: (text: string, opts?: SayOptions) => void;
  fail?: (text: string) => void;
  // Make j and k work before focus is inside the list.
  primary?: boolean;
  // The id used to pair a page-level <PublishButton> with this region. A made-up one by default.
  id?: string;
  // The summary's id; given so a PublishButton placed elsewhere can describe itself with it.
  summaryId?: string;
}

// The gate as the doc page's markup describes it. Rendered from the checks and the destinations,
// so the summary cannot say Ready while a required check fails.
export function PublishGate({ label, sites, checks, publish, unpublish, actions = "rows", say = plainSay, fail = plainFail, primary = false, id, summaryId }: PublishGateProps) {
  const own = useId();
  const gateId = id ?? `${own}-gate`;
  const sumId = summaryId ?? `${gateId}-sum`;
  const [busy, setBusy] = useState<string[]>([]);
  const rows = useRef<HTMLUListElement>(null);
  useEffect(() => (rows.current ? attachRowList(rows.current) : undefined), []);

  const reading = describeGate(sites, checks);
  const counts = countChecks(checks);
  const failingReq = checks.filter((c) => c.required && !c.ok);
  const failingAdv = checks.filter((c) => !c.required && !c.ok);
  const passed = checks.filter((c) => c.ok);

  const announce = (text: string, opts?: SayOptions) => {
    if (document.querySelector("[data-cap='message']")) say(text, opts);
  };
  const problem = (text: string) => {
    if (document.querySelector("[data-cap='message']")) fail(text);
  };

  const run = async (site: GateSite) => {
    setBusy((b) => [...b, site.id]);
    try {
      await publish?.([site.id]);
    } catch (err) {
      setBusy((b) => b.filter((x) => x !== site.id));
      problem(`Could not publish to ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setBusy((b) => b.filter((x) => x !== site.id));
    announce(`Published to ${site.name}.`);
  };

  const onPublish = async (site: GateSite) => {
    if (busy.includes(site.id)) return;
    await publishWithPreview(site, () => run(site));
  };

  const onUnpublish = async (site: GateSite) => {
    try {
      await unpublish?.([site.id]);
    } catch (err) {
      return problem(`Could not unpublish from ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
    announce(`Unpublished from ${site.name}.`, {
      undo: async () => {
        await publish?.([site.id]);
      },
      undone: `Published to ${site.name} again.`,
    });
  };

  const checkRow = (c: GateCheck) => {
    const i = checks.indexOf(c);
    const st = checkState(c);
    const rid = `${gateId}-c-${c.id}`;
    const words = c.ok ? (c.pass ?? `${c.name}: passing`) : c.cause;
    const siteName = c.site ? sites.find((s) => s.id === c.site)?.name : undefined;
    return (
      <li
        key={c.id}
        className="cap-row cap-check"
        id={rid}
        data-check={c.id}
        data-name={c.name}
        data-required={c.required ? "" : undefined}
        data-ok={String(c.ok)}
        data-cause={c.cause}
        data-pass={c.pass}
        data-href={c.href}
        data-fix={c.fix}
        data-site={c.site}
        data-order={String(i)}
        data-tone={st === "failing" ? "crit" : undefined}
      >
        <span className="cap-row-status" id={`${rid}-s`}>
          <span className="cap-status" data-tone={st === "failing" ? "crit" : st === "advisory" ? "warn" : "ok"}>
            <Glyph name={st === "failing" ? "crit" : st === "advisory" ? "warn" : "ok"} />
            {st === "failing" ? "Failing" : st === "advisory" ? "Advisory" : "Passed"}
          </span>
        </span>
        <div className="cap-row-title">
          {c.href ? (
            <a href={c.href} aria-describedby={`${rid}-s ${rid}-d`}>
              {words}
            </a>
          ) : (
            <span className="cap-gate-title-text">{words}</span>
          )}
        </div>
        <p className="cap-row-detail" id={`${rid}-d`}>
          <span className="cap-check-name">{c.name}</span>
          {!c.ok && c.fix ? (
            <>
              . <span className="cap-check-fix">Fix: {c.fix}</span>
            </>
          ) : null}
        </p>
        <span className="cap-row-meta">{siteName ? `on ${siteName}` : null}</span>
      </li>
    );
  };

  const section = (name: string, headId: string, heading: string, list: GateCheck[], shown: boolean) => (
    <li className="cap-gate-section" data-section={name} hidden={!shown}>
      <h3 className="cap-gate-group-title" id={headId}>
        {heading}
      </h3>
      <ul className="cap-gate-section-rows" role="list" aria-labelledby={headId}>
        {list.map(checkRow)}
      </ul>
    </li>
  );

  const headingId = `${gateId}-h`;
  return (
    <section className="cap-gate" id={gateId} data-state={reading.state} aria-labelledby={headingId}>
      <header className="cap-gate-head">
        <h2 className="cap-gate-title" id={headingId}>
          {label}
        </h2>
        <p className="cap-gate-summary" id={sumId} role="status" aria-live="polite" aria-atomic="true" data-cap-part="summary">
          <StateStatus state={reading.state} />
          {reading.rest}
        </p>
      </header>
      <ul ref={rows} className="cap-rows cap-gate-all" data-cap="row-list" role="list" aria-labelledby={headingId} data-cap-primary={primary ? "" : undefined}>
        <li className="cap-gate-section" data-section="sites">
          <h3 className="cap-gate-group-title" id={`${gateId}-g-sites`}>
            {sites.length === 1 ? "Destination" : "Destinations"}
          </h3>
          <ul className="cap-gate-section-rows" role="list" aria-labelledby={`${gateId}-g-sites`}>
            {reading.sites.map(({ site, state, failing }) => {
              const adv = checks.filter((c) => appliesTo(c, site.id) && !c.required && !c.ok).length;
              const sid = `${gateId}-s-${site.id}`;
              return (
                <li key={site.id} className="cap-row cap-gate-site" id={sid} data-site={site.id} data-name={site.name} data-state={state} data-first={site.first ? "" : undefined} data-hold-text={site.hold ? holdText(site.hold) : undefined} data-hold-note={site.hold?.note} data-published-at={site.published?.at} data-published-url={site.published?.url} data-tone={state === "blocked" ? "crit" : undefined}>
                  <span className="cap-row-status" id={`${sid}-s`}>
                    <StateStatus state={state} />
                  </span>
                  <div className="cap-row-title">
                    <span className="cap-gate-site-name">{site.name}</span>
                  </div>
                  <p className="cap-row-detail" id={`${sid}-d`}>
                    {siteDetail(state, failing, adv, site)}
                  </p>
                  <span className="cap-row-meta">{state === "published" && site.published ? <Time at={site.published.at} format="exact" /> : null}</span>
                  {actions === "rows" ? <PublishButton gateId={gateId} site={site} state={state} busy={busy.includes(site.id)} summaryId={sumId} named={sites.length > 1} onPublish={() => void onPublish(site)} onUnpublish={() => void onUnpublish(site)} /> : null}
                </li>
              );
            })}
          </ul>
        </li>
        {section("required", `${gateId}-g-req`, requiredHeading(counts.requiredFailing), failingReq, failingReq.length > 0)}
        {section("advisory", `${gateId}-g-adv`, advisoryHeading(counts.advisoryFailing), failingAdv, failingAdv.length > 0)}
        <li className="cap-gate-section" data-section="passed" hidden={passed.length === 0}>
          <details className="cap-disclosure">
            <summary>{passedHeading(counts.passed)}</summary>
            <div className="cap-disclosure-body">
              <ul className="cap-gate-section-rows" role="list" aria-label="Passing checks">
                {passed.map(checkRow)}
              </ul>
            </div>
          </details>
        </li>
      </ul>
      <p className="cap-gate-clear" data-cap-part="clear" hidden={failingReq.length + failingAdv.length > 0}>
        No checks are failing.
      </p>
    </section>
  );
}

// The overall and per-destination states, for a page that places its own <PublishButton>.
export function gateStates(sites: GateSite[], checks: GateCheck[]): { overall: GateState; sites: Record<string, GateState> } {
  const overall = describeGate(sites, checks).state;
  return { overall, sites: Object.fromEntries(sites.map((s) => [s.id, siteState(s, checks)])) };
}
