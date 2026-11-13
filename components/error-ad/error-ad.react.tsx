import { preload } from "react-dom";
import { markup } from "../trusted-html/trusted-html.ts";
import { burstPoints, type Ad, type AdPart } from "./error-ad.ts";

function Part({ part, adId }: { part: AdPart; adId: string }) {
  const rotate = part.rotate
    ? `rotate(${part.rotate} ${part.x ?? part.cx} ${part.y ?? part.cy})`
    : undefined;
  if (part.kind === "text") {
    const lines = part.lines ?? [];
    const draw = (fill: string, dx: number, dy: number, stroke?: string) => (
      <text
        x={(part.x ?? 0) + dx}
        y={(part.y ?? 0) + dy}
        textAnchor={part.anchor}
        fontSize={part.size}
        fill={fill === "ink" ? undefined : fill}
        stroke={stroke}
        strokeWidth={stroke ? part.strokeWidth : undefined}
        strokeLinejoin="round"
        paintOrder="stroke"
        className={`cap-ad-f-${part.font}${fill === "ink" ? " cap-ad-ink" : ""}`}
      >
        {lines.map((line, i) => (
          <tspan
            key={i}
            x={(part.x ?? 0) + dx}
            dy={i === 0 ? 0 : (part.leading ?? (part.size ?? 20) * 1.2)}
          >
            {line}
          </tspan>
        ))}
      </text>
    );
    return (
      <g transform={rotate}>
        {part.shadow
          ? draw(part.shadow.fill, part.shadow.dx, part.shadow.dy, part.shadow.fill)
          : null}
        {draw(part.fill ?? "#000", 0, 0, part.stroke)}
      </g>
    );
  }
  if (part.kind === "burst")
    return (
      <polygon
        points={burstPoints(
          part.cx ?? 0,
          part.cy ?? 0,
          part.outer ?? 1,
          part.inner ?? 1,
          part.points ?? 12,
        )}
        fill={part.fill}
        stroke={part.stroke}
        strokeWidth={part.strokeWidth}
        strokeLinejoin="round"
        transform={rotate}
      />
    );
  if (part.kind === "rect")
    return (
      <rect
        x={part.x}
        y={part.y}
        width={part.w}
        height={part.h}
        fill={part.fill}
        transform={rotate}
      />
    );
  return (
    <use
      href={`#ad-${adId}-${part.ref}`}
      x={part.x}
      y={part.y}
      width={part.w}
      height={part.h}
      color={part.color}
      transform={rotate}
    />
  );
}

export interface ErrorAdProps {
  // The ad, with its art already scoped (scopeArt): trusted markup from the site's own repository.
  ad: Ad & { art: string };
  // "corner": the foot of an error page; "large": a gallery that shows one ad whole.
  size?: "corner" | "large";
  // The error-ad stylesheet's and fonts' addresses as the site's bundler emits them, so only a
  // page that shows an ad loads them (a link here, never an import in the root error boundary).
  stylesheet?: string;
  fonts?: string[];
}

// One ad, as decoration at the foot of a utility page: inline SVG, so the lettering is real text
// in real fonts. No ground and no frame; hidden from assistive technology; put it last in main.
// The HTML contract in error-ad.md.
export function ErrorAd({ ad, size = "corner", stylesheet, fonts = [] }: ErrorAdProps) {
  for (const href of fonts)
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <>
      {/* No `precedence`: React would lift the sheet above the color-scheme meta. */}
      {stylesheet ? <link rel="stylesheet" href={stylesheet} /> : null}
      <div className="cap-ad" data-size={size} aria-hidden="true" data-ad={ad.id}>
        <svg className="cap-ad-defs" focusable="false" dangerouslySetInnerHTML={markup(ad.art)} />
        <svg
          className="cap-ad-art"
          viewBox={`0 0 ${ad.viewBox[0]} ${ad.viewBox[1]}`}
          focusable="false"
        >
          {ad.parts.map((part, i) => (
            <Part key={i} part={part} adId={ad.id} />
          ))}
        </svg>
      </div>
    </>
  );
}
