import type { ReactNode } from "react";
import { Meter } from "../meter/meter.react.tsx";
import { Glyph } from "../status/status.react.tsx";
import { assess, type UsageAssessment } from "./usage-meter.ts";

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

function UsageRow({ item, a, stale }: { item: UsageItem; a: UsageAssessment; stale: boolean }) {
  const spoken = `${item.amountSpoken ?? item.amount}, ${a.projection}${stale ? ", reading is stale" : ""}`;
  // The row is the shared meter (components/meter): its bar, tone word and amount; the why
  // line goes after the bar.
  return (
    <Meter
      as="li"
      className="cap-usage-item"
      label={item.name}
      value={item.used}
      max={item.limit}
      display={item.amount}
      valueText={spoken}
      tone={a.tone}
      words={{ warn: a.label, crit: a.label }}
      projected={a.projectedAtReset == null ? undefined : Math.round(a.projectedAtReset)}
      after={
        <p className="cap-usage-why">
          <strong className="cap-usage-lead">{a.lead}</strong>
          {a.text.slice(a.lead.length)}
        </p>
      }
    />
  );
}

export function UsageMeter({ items, now = Date.now(), freshness, stale = false, legend = true }: UsageMeterProps) {
  return (
    <div className="cap-usage" data-cap="usage-meter" data-cap-ready="">
      {freshness != null && (
        <p className="cap-usage-fresh" data-stale={stale ? "" : undefined}>
          {stale && (
            <span className="cap-status" data-tone="warn">
              <Glyph name="warn" />
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
