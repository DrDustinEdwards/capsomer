import type { ReactNode } from "react";

export interface SerpPreviewProps {
  // The address as a search result writes it: "dustinedwards.info › blog › post".
  url: string;
  title: ReactNode;
  description: ReactNode;
  // Said under the result, for example that the title will be cut.
  note?: ReactNode;
  label?: string;
}

export interface OgCardPreviewProps {
  // An img (alt text set by the app) or an svg. Drawn in a box at the card's 1200 x 630 shape.
  image: ReactNode;
  host: string;
  title: ReactNode;
  description?: ReactNode;
  // Said under the card, for example that the site mark stands in for a missing cover.
  note?: ReactNode;
  label?: string;
}

// The HTML contract in share-preview.md. The app cuts the text to its limits before it passes it.
export function SerpPreview({ url, title, description, note, label = "Search result preview" }: SerpPreviewProps) {
  return (
    <div className="cap-serp" role="group" aria-label={label}>
      <p className="cap-serp-url">{url}</p>
      <p className="cap-serp-title">{title}</p>
      <p className="cap-serp-description">{description}</p>
      {note ? <p className="cap-serp-note">{note}</p> : null}
    </div>
  );
}

export function OgCardPreview({ image, host, title, description, note, label = "Social card preview" }: OgCardPreviewProps) {
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
