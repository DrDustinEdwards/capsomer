import { Children, type ReactNode } from "react";
import { markup } from "../trusted-html/trusted-html.ts";
import { plainLink } from "../hooks/hooks.react.tsx";
import { Glyph } from "../status/status.react.tsx";

export type StatTone = "ok" | "warn" | "crit" | "nodata";
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
  word?: string;
  detail?: ReactNode;
  // An inline sparkline SVG string, placed as it comes: role="img" named by a sentence with its
  // numbers (`alt`), so it needs no frame.
  chart?: string;
  // A sentence with the chart's numbers, when the SVG's own name is not it.
  chartSummary?: string;
  // The numbers as Enarratio's table markup, visually hidden for screen readers and AI agents, under
  // the tile and outside the link. Markup, not the table, so static tiles never load Enarratio.
  chartTable?: string;
  href?: string;
  onClick?: () => void;
  renderLink?: (props: StatTileLinkProps) => ReactNode;
}

export type StatTileProps =
  | (StatTileBase & { tone?: "ok" | "warn" | "crit"; figure: ReactNode; unit?: ReactNode })
  // No data is a state with a reason, never a zero: the figure says "No data" and the
  // reason is the detail line.
  | (StatTileBase & { tone: "nodata"; reason: string; figure?: never; unit?: never });

export function StatTile(props: StatTileProps) {
  const {
    label,
    tone,
    word,
    chart,
    chartSummary,
    chartTable,
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
            <Glyph name="nodata" />
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
              {props.tone === "warn" || props.tone === "crit" ? <Glyph name={props.tone} /> : null}
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

  if (hasChart && chartTable) {
    return (
      <div className="cap-data">
        {tile}
        <div dangerouslySetInnerHTML={markup(chartTable)} />
      </div>
    );
  }
  return tile;
}

interface StaticStatTileBase {
  label: string;
  tone?: StaticTone;
  size?: "lg";
  icon?: ReactNode;
  delta?: ReactNode;
  figureFirst?: boolean;
  detail?: ReactNode;
}

export type StaticStatTileProps =
  | (StaticStatTileBase & {
      tone?: "ok" | "warn" | "crit" | "accent";
      figure: ReactNode;
      unit?: ReactNode;
    })
  | (StaticStatTileBase & { tone: "nodata"; reason: string; figure?: never; unit?: never });

export function StaticStatTile(props: StaticStatTileProps) {
  const { label, icon, delta, detail, size, tone, figureFirst = false } = props;
  const nodata = props.tone === "nodata";
  const name = (
    <p className="cap-tile-label">
      {icon ? (
        <span className="cap-tile-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {label}
    </p>
  );
  return (
    <div className="cap-tile" data-variant="static" data-tone={tone} data-size={size}>
      {figureFirst ? null : name}
      <p className="cap-tile-line">
        {props.tone === "nodata" ? (
          <span className="cap-tile-figure">
            <Glyph name="nodata" />
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
        {delta && !nodata ? <> {delta}</> : null}
      </p>
      {figureFirst ? name : null}
      {props.tone === "nodata" ? (
        <p className="cap-tile-detail">{props.reason}</p>
      ) : detail ? (
        <p className="cap-tile-detail">{detail}</p>
      ) : null}
    </div>
  );
}

export interface StatTilesProps {
  label?: string;
  // "grid": equal columns, two across on a phone (for a row of static tiles). The default is a
  // row of tiles as wide as their text, wrapping onto more rows.
  layout?: "grid";
  children: ReactNode;
}

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
