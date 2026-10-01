import { Children, useId, type ReactNode } from "react";

export type StatTone = "ok" | "warn" | "crit" | "nodata";

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
  // Enarratio's sparkline() output, an SVG string, placed in the chart slot as it comes.
  chart?: string;
  // One sentence with the chart's numbers: "Actions minutes per day, last 7 days: 260 rising to 340."
  chartSummary?: string;
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
  nodata: <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2.2" />,
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
  const { label, tone, word, chart, chartSummary, href, onClick, renderLink = plainLink } = props;
  const id = useId();
  const nodata = props.tone === "nodata";
  const describedBy = chart && chartSummary && !nodata ? `${id}-chart` : undefined;

  const body =
    props.tone === "nodata" ? (
      <>
        <span className="cap-tile-label">{label}</span>
        <span className="cap-tile-figure">
          <Glyph tone="nodata" />
          No data
        </span>
        <span className="cap-tile-detail">{props.reason}</span>
      </>
    ) : (
      <>
        <span className="cap-tile-label">{label}</span>
        <span className="cap-tile-figure">
          {props.figure}
          {props.unit ? <> <small>{props.unit}</small></> : null}
        </span>
        {word ? (
          <span className="cap-tile-word">
            {props.tone === "warn" || props.tone === "crit" ? <Glyph tone={props.tone} /> : null}
            {word}
          </span>
        ) : null}
        {props.detail ? <span className="cap-tile-detail">{props.detail}</span> : null}
        {chart ? <span className="cap-tile-chart" aria-hidden="true" dangerouslySetInnerHTML={{ __html: chart }} /> : null}
      </>
    );

  return (
    <>
      {href !== undefined ? (
        renderLink({ href, className: "cap-tile", "data-tone": tone, "aria-describedby": describedBy, children: body })
      ) : (
        <button type="button" className="cap-tile" data-tone={tone} aria-describedby={describedBy} onClick={onClick}>
          {body}
        </button>
      )}
      {describedBy ? (
        <span className="cap-sr-only" id={describedBy}>
          {chartSummary}
        </span>
      ) : null}
    </>
  );
}

export interface StatTilesProps {
  // Names the list for a screen reader: "Overview figures".
  label?: string;
  children: ReactNode;
}

// The grid: six across, three, then two on a phone, by the space it has.
export function StatTiles({ label, children }: StatTilesProps) {
  return (
    <div className="cap-tiles">
      <ul className="cap-tiles-list" aria-label={label}>
        {Children.toArray(children).map((child, i) => (
          <li key={i}>{child}</li>
        ))}
      </ul>
    </div>
  );
}
