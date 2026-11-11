import { dataTableBlock, type DataTable } from "enarratio";
import { Children, type ReactNode } from "react";
import { markup } from "../trusted-html/trusted-html.ts";

export type StatTone = "ok" | "warn" | "crit" | "nodata";
// The static variant adds the brand tone, for the one figure a row is about.
export type StaticTone = StatTone | "accent";

export interface StatTileLinkProps {
  href: string;
  className: string;
  "data-tone"?: StatTone;
  "aria-describedby"?: string;
  children: ReactNode;
}

interface StatTileBase {
  label: string;
  tone?: StatTone;
  // Where the figure stands against its threshold: "Over limit", "Near limit", "All up".
  // Shown with a status glyph when the tone is warn or crit.
  word?: string;
  detail?: ReactNode;
  // Enarratio's sparkline({ ..., inline: true }) output, an SVG string, placed in the chart slot
  // as it comes: an inline primitive, role="img" named by a sentence with its numbers (its `alt`,
  // or Enarratio's own from the values), so it needs no frame.
  chart?: string;
  // One sentence with the chart's numbers, "Actions minutes per day, last 7 days: 260 rising to
  // 340.", when the SVG's own name is not it: the slot becomes the image, named by this.
  chartSummary?: string;
  // The chart's numbers (Enarratio's sparklineTable().table). With it Enarratio's table, visually
  // hidden for screen readers and AI agents, sits under the tile, outside the link. Name it in
  // chartTableLabel ("Actions minutes by day").
  chartTable?: DataTable;
  chartTableLabel?: string;
  // Opens the view behind the figure: a link with href, or a button with onClick.
  href?: string;
  onClick?: () => void;
  renderLink?: (props: StatTileLinkProps) => ReactNode;
}

export type StatTileProps =
  | (StatTileBase & { tone?: "ok" | "warn" | "crit"; figure: ReactNode; unit?: ReactNode })
  // No data is a state with a reason, never a zero: the figure says "No data" and the
  // reason is the detail line.
  | (StatTileBase & { tone: "nodata"; reason: string; figure?: never; unit?: never });

const GLYPH: Record<"warn" | "crit" | "nodata", ReactNode> = {
  crit: (
    <>
      <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
      <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
    </>
  ),
  warn: (
    <>
      <path fill="currentColor" d="M8 1.2 15.4 14H.6z" />
      <path fill="var(--surface)" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" />
    </>
  ),
  nodata: (
    <>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 8h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
};

function Glyph({ tone }: { tone: "warn" | "crit" | "nodata" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {GLYPH[tone]}
    </svg>
  );
}

const plainLink = ({ children, ...props }: StatTileLinkProps) => <a {...props}>{children}</a>;

export function StatTile(props: StatTileProps) {
  const {
    label,
    tone,
    word,
    chart,
    chartSummary,
    chartTable,
    chartTableLabel,
    href,
    onClick,
    renderLink = plainLink,
  } = props;
  const nodata = props.tone === "nodata";
  const hasChart = Boolean(chart) && !nodata;

  // The figure, its label and its word on one line, the detail beneath (the Portal's compact
  // tile). The figure comes first in the DOM, so the name reads "6 of 6 Sites up All up".
  const body =
    props.tone === "nodata" ? (
      <>
        <span className="cap-tile-line">
          <span className="cap-tile-figure">
            <Glyph tone="nodata" />
            No data
          </span>
          <span className="cap-tile-label">{label}</span>
        </span>
        <span className="cap-tile-detail">{props.reason}</span>
      </>
    ) : (
      <>
        <span className="cap-tile-line">
          <span className="cap-tile-figure">
            {props.figure}
            {props.unit ? (
              <>
                {" "}
                <small>{props.unit}</small>
              </>
            ) : null}
          </span>
          <span className="cap-tile-label">{label}</span>
          {word ? (
            <span className="cap-tile-word">
              {props.tone === "warn" || props.tone === "crit" ? <Glyph tone={props.tone} /> : null}
              {word}
            </span>
          ) : null}
        </span>
        {props.detail ? <span className="cap-tile-detail">{props.detail}</span> : null}
        {chart ? (
          <span
            className="cap-tile-chart"
            {...(chartSummary ? { role: "img", "aria-label": chartSummary } : {})}
            dangerouslySetInnerHTML={markup(chart)}
          />
        ) : null}
      </>
    );

  const tile =
    href !== undefined ? (
      renderLink({ href, className: "cap-tile", "data-tone": tone, children: body })
    ) : (
      <button type="button" className="cap-tile" data-tone={tone} onClick={onClick}>
        {body}
      </button>
    );

  // With a table, its hidden table sits under the tile, never inside the link.
  if (hasChart && chartTable) {
    return (
      <div className="cap-data">
        {tile}
        <div
          dangerouslySetInnerHTML={markup(
            dataTableBlock(chartTable, chartTableLabel ?? `${label}, by period`),
          )}
        />
      </div>
    );
  }
  return tile;
}

export type DeltaDirection = "up" | "down" | "flat";

export interface StatDelta {
  // The signed amount, in words a person can read: "+$1,200", "-3 points", "No change".
  text: string;
  direction: DeltaDirection;
  // Whether the move is good, bad or neither. Defaults from the direction (up ok, down crit,
  // flat none); a figure where up is bad (churn) passes it.
  tone?: "ok" | "warn" | "crit" | "nodata";
}

interface StaticStatTileBase {
  label: string;
  tone?: StaticTone;
  // "lg" for the one headline figure of a row.
  size?: "lg";
  // A drawing before the label: any inline SVG. Hidden from a screen reader.
  icon?: ReactNode;
  // How the figure moved, beside it: a direction glyph, a signed amount and a tone.
  delta?: StatDelta;
  // The note under the figure.
  detail?: ReactNode;
}

export type StaticStatTileProps =
  | (StaticStatTileBase & {
      tone?: "ok" | "warn" | "crit" | "accent";
      figure: ReactNode;
      unit?: ReactNode;
    })
  | (StaticStatTileBase & { tone: "nodata"; reason: string; figure?: never; unit?: never });

const ARROW: Record<DeltaDirection, string> = {
  up: "M8 13V3M3.5 7.5 8 3l4.5 4.5",
  down: "M8 3v10M3.5 8.5 8 13l4.5-4.5",
  flat: "M3 8h10",
};
const DELTA_TONE = { up: "ok", down: "crit", flat: "nodata" } as const;

// The static variant: a label, a figure, an optional delta and note, and nothing to follow. A
// figure that leads somewhere is a StatTile, always a link or a button.
export function StaticStatTile(props: StaticStatTileProps) {
  const { label, icon, delta, detail, size, tone } = props;
  const nodata = props.tone === "nodata";
  return (
    <div className="cap-tile" data-variant="static" data-tone={tone} data-size={size}>
      <p className="cap-tile-label">
        {icon ? (
          <span className="cap-tile-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {label}
      </p>
      <p className="cap-tile-line">
        {props.tone === "nodata" ? (
          <span className="cap-tile-figure">
            <Glyph tone="nodata" />
            No data
          </span>
        ) : (
          <span className="cap-tile-figure">
            {props.figure}
            {props.unit ? (
              <>
                {" "}
                <small>{props.unit}</small>
              </>
            ) : null}
          </span>
        )}
        {delta && !nodata ? (
          <span className="cap-tile-delta" data-tone={delta.tone ?? DELTA_TONE[delta.direction]}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d={ARROW[delta.direction]} />
            </svg>
            {delta.text}
          </span>
        ) : null}
      </p>
      {props.tone === "nodata" ? (
        <p className="cap-tile-detail">{props.reason}</p>
      ) : detail ? (
        <p className="cap-tile-detail">{detail}</p>
      ) : null}
    </div>
  );
}

export interface StatTilesProps {
  // Names the list for a screen reader: "Overview figures".
  label?: string;
  // "grid": equal columns, two across on a phone (for a row of static tiles). The default is a
  // row of tiles as wide as their text, wrapping onto more rows.
  layout?: "grid";
  children: ReactNode;
}

// The row of tiles: each as wide as its text, wrapping onto more rows instead of cutting a
// word, so a phone gets two or one across without a breakpoint.
export function StatTiles({ label, layout, children }: StatTilesProps) {
  return (
    <div className="cap-tiles" data-layout={layout}>
      <ul className="cap-tiles-list" aria-label={label}>
        {Children.toArray(children).map((child, i) => (
          <li key={i}>{child}</li>
        ))}
      </ul>
    </div>
  );
}
