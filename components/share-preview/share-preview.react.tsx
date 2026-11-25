import type { ReactNode } from "react";
import { Meter } from "../meter/meter.react.tsx";
import { SERP_LIMITS, serpReading, serpTextWidth, type SerpPart } from "./share-preview.ts";

export interface SerpPreviewProps {
  url: string;
  title: ReactNode;
  description: ReactNode;
  note?: ReactNode;
  label?: string;
}

export interface OgCardPreviewProps {
  // An img (alt text set by the app) or an svg, drawn in a box at the card's 1200 x 630 shape.
  image: ReactNode;
  host: string;
  title: ReactNode;
  description?: ReactNode;
  note?: ReactNode;
  label?: string;
}

// The HTML contract in share-preview.md. The app cuts the text to its limits before it passes it.
export function SerpPreview({
  url,
  title,
  description,
  note,
  label = "Search result preview",
}: SerpPreviewProps) {
  return (
    <div className="cap-serp" role="group" aria-label={label}>
      <p className="cap-serp-url">{url}</p>
      <p className="cap-serp-title">{title}</p>
      <p className="cap-serp-description">{description}</p>
      {note ? <p className="cap-serp-note">{note}</p> : null}
    </div>
  );
}

export function OgCardPreview({
  image,
  host,
  title,
  description,
  note,
  label = "Social card preview",
}: OgCardPreviewProps) {
  return (
    <div className="cap-og-card" role="group" aria-label={label}>
      <div className="cap-og-card-image">{image}</div>
      <div className="cap-og-card-body">
        <p className="cap-og-card-host">{host}</p>
        <p className="cap-og-card-title">{title}</p>
        {description ? <p className="cap-og-card-description">{description}</p> : null}
      </div>
      {note ? <p className="cap-og-card-note">{note}</p> : null}
    </div>
  );
}

export interface SerpWidthMeterProps {
  label: ReactNode;
  text: string;
  part?: SerpPart;
  limit?: number;
  // A width of the app's own (a canvas measure); default is Prelum's serpWidth, which needs no browser.
  measure?: (text: string) => number | null;
  size?: "sm" | "md" | "lg";
}

// A text's width as a search result sets it, against the cut. Too wide only warns.
export function SerpWidthMeter({
  label,
  text,
  part = "title",
  limit = SERP_LIMITS[part].px,
  measure,
  size = "sm",
}: SerpWidthMeterProps) {
  const px = measure ? measure(text) : serpTextWidth(text, part);
  const reading = serpReading(text, px, limit);
  return (
    <Meter
      size={size}
      label={label}
      value={px}
      max={limit}
      measuring={px === null}
      tone={reading.over ? "warn" : "ok"}
      words={{ warn: "Google cuts it off", crit: "Google cuts it off" }}
      display={reading.display}
      valueText={reading.valueText}
    />
  );
}
