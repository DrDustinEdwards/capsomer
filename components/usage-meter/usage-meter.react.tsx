import { useLayoutEffect, useRef, type ReactNode } from "react";
import { assess, widths, type UsageAssessment } from "./usage-meter.ts";

export interface UsageItem {
  id: string;
  // "Worker requests"
  name: string;
  // The amount as a person reads it: "61,400 of 100,000 today".
  amount: string;
  // The same amount for a screen reader, with its unit: "61,400 of 100,000 requests today".
  amountSpoken?: string;
  used: number;
  limit: number;
  history: number[];
  resetsAt: number | Date | null;
  unit?: string;
  atLimit?: string;
}

export interface UsageMeterProps {
  items: UsageItem[];
  // The time of the reading. Defaults to now.
  now?: number | Date;
  // "Read 6 minutes ago". With `stale`, the line carries a warning status word.
  freshness?: ReactNode;
  stale?: boolean;
  // The text legend under the bars; on by default.
  legend?: boolean;
}

const WarnGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M8 1.2 15.4 14H.6z" />
    <path fill="var(--surface)" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" />
  </svg>
);

const CritGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
    <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
  </svg>
);

function UsageRow({ item, a, stale }: { item: UsageItem; a: UsageAssessment; stale: boolean }) {
  const bar = useRef<HTMLDivElement>(null);
  const w = widths(item.used, item.limit, a.projectedAtReset);
  // Widths through the CSSOM: no style prop, so a server render keeps style-src 'self'.
  useLayoutEffect(() => {
    bar.current?.style.setProperty("--used", `${w.used}%`);
    bar.current?.style.setProperty("--projected", `${w.projected}%`);
  }, [w.used, w.projected]);
  const nameId = `cap-usage-${item.id}`;
  const spoken = `${item.amountSpoken ?? item.amount}, ${a.projection}${stale ? ", reading is stale" : ""}`;
  return (
    <li className="cap-usage-item" data-tone={a.tone}>
      <div className="cap-usage-top">
        <span className="cap-usage-name" id={nameId}>
          {item.name}
        </span>
        {a.tone !== "ok" && (
          <span className="cap-status" data-tone={a.tone}>
            {a.tone === "crit" ? <CritGlyph /> : <WarnGlyph />}
            {a.label}
          </span>
        )}
        <span className="cap-usage-value">{item.amount}</span>
      </div>
      <div
        ref={bar}
        className="cap-usage-bar"
        role="meter"
        aria-labelledby={nameId}
        aria-valuemin={0}
        aria-valuemax={item.limit}
        aria-valuenow={item.used}
        aria-valuetext={spoken}
        data-projected={a.projectedAtReset == null ? undefined : Math.round(a.projectedAtReset)}
      >
        <span className="cap-usage-projected" />
        <span className="cap-usage-used" />
      </div>
      <p className="cap-usage-why">
        <strong className="cap-usage-lead">{a.lead}</strong>
        {a.text.slice(a.lead.length)}
      </p>
    </li>
  );
}

export function UsageMeter({ items, now = Date.now(), freshness, stale = false, legend = true }: UsageMeterProps) {
  return (
    <div className="cap-usage" data-cap="usage-meter" data-cap-ready="">
      {freshness != null && (
        <p className="cap-usage-fresh" data-stale={stale ? "" : undefined}>
          {stale && (
            <span className="cap-status" data-tone="warn">
              <WarnGlyph />
              Stale
            </span>
          )}
          <span>{freshness}</span>
        </p>
      )}
      <ul className="cap-usage-list">
        {items.map((item) => (
          <UsageRow key={item.id} item={item} stale={stale} a={assess({ used: item.used, limit: item.limit, history: item.history, resetsAt: item.resetsAt, now, unit: item.unit, atLimit: item.atLimit })} />
        ))}
      </ul>
      {legend && (
        <ul className="cap-usage-legend" aria-label="Key">
          <li>
            <span className="cap-usage-key" data-key="used" aria-hidden="true" />
            Solid: used
          </li>
          <li>
            <span className="cap-usage-key" data-key="projected" aria-hidden="true" />
            Hatched: where the day ends at the current rate
          </li>
        </ul>
      )}
    </div>
  );
}
