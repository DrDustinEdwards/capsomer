// The React Time as a server sends it and as the browser hydrates it. The specimen has no server,
// so it renders the server's HTML in the page (renderToString takes the server's path), then
// hydrates it, and keeps any hydration error React reports in window.timeHydration.
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Time } from "./time.react.tsx";
import { dateRange, duration, formatDate, SEC, span, timecode, until } from "./time.ts";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";

function Demo() {
  return (
    <p>
      Went live <Time at="2026-10-02T09:12:00Z" format="exact" />
    </p>
  );
}

const host = document.getElementById("time-hydrate");
if (host) {
  const errors: string[] = [];
  (window as unknown as { timeHydration: { errors: string[]; server: string } }).timeHydration = {
    errors,
    server: "",
  };
  setStaticHtml(host, renderToString(<Demo />));
  (window as unknown as { timeHydration: { server: string } }).timeHydration.server =
    host.textContent ?? "";
  hydrateRoot(host, <Demo />, {
    onRecoverableError: (e) => errors.push(String((e as Error).message ?? e)),
  });
}

// Durations and a date range, from the functions themselves.
function Durations() {
  const rows: Array<[string, number, string]> = [
    ["An episode", 3723 * SEC, "PT1H2M3S"],
    ["A short clip", 245 * SEC, "PT4M5S"],
  ];
  return (
    <dl id="sample-durations">
      {rows.map(([name, ms, iso]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>
            <time dateTime={iso}>{timecode(ms)}</time>, <time dateTime={iso}>{duration(ms)}</time>
          </dd>
        </div>
      ))}
      <div>
        <dt>A feed's duration</dt>
        <dd>{timecode(245 * SEC, { hours: "always" })}</dd>
      </div>
      <div>
        <dt>Waiting</dt>
        <dd>{span(3.2 * 3600 * SEC)}</dd>
      </div>
      <div>
        <dt>Next step</dt>
        <dd>{until(Date.parse("2026-09-30T17:20:00Z"), Date.parse("2026-09-30T14:00:00Z"))}</dd>
      </div>
      <div>
        <dt>Meeting</dt>
        <dd>{dateRange("2026-05-01", "2026-05-02")}</dd>
      </div>
      <div>
        <dt>Added</dt>
        <dd>
          {formatDate("2026-09-12T15:04:00Z", { style: "medium", time: true, zoneName: true })}
        </dd>
      </div>
      <div>
        <dt>Day</dt>
        <dd>{formatDate("2026-09-12T15:04:00Z", { style: "weekday" })}</dd>
      </div>
      <div>
        <dt>Starts</dt>
        <dd>{formatDate("2026-09-12T15:04:00Z", { style: "time", zoneName: true })}</dd>
      </div>
    </dl>
  );
}
const durations = document.querySelector("[data-mount='durations']");
if (durations) createRoot(durations).render(<Durations />);

// A relative time with its exact time in a tooltip, and one that has never happened.
const tip = document.querySelector("[data-mount='tip']");
if (tip)
  createRoot(tip).render(
    <>
      <p id="sample-tip">
        The nightly backup last ran{" "}
        <Time at="2026-09-30T13:55:00Z" now={Date.parse("2026-09-30T14:00:00Z")} tip />.
      </p>
      <p id="sample-empty">
        The restore drill last ran <Time at={null} empty="never" />.
      </p>
    </>,
  );
