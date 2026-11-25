import type { ReactNode } from "react";
import { checkQrUrl, qrLabel, qrPath, qrSize } from "./qr.ts";

export interface QrProps {
  url: string;
  // The encoder's module matrix for `url`, without its border (uqr: encode(url, { ecc: "M", border: 0 }).data).
  modules: ReadonlyArray<ReadonlyArray<boolean>>;
  quiet?: number;
  caption?: ReactNode;
  showUrl?: boolean;
  label?: string;
  size?: "lg";
}

export function Qr(props: QrProps) {
  const { url, modules, quiet = 2, caption, showUrl = true, label = qrLabel(url), size } = props;
  checkQrUrl(url);
  const box = qrSize(modules, quiet);
  return (
    <figure className="cap-qr" data-size={size}>
      <svg
        className="cap-qr-code"
        viewBox={`0 0 ${box} ${box}`}
        role="img"
        aria-label={label}
        shapeRendering="crispEdges"
      >
        <rect width={box} height={box} fill="#ffffff" />
        <path d={qrPath(modules, quiet)} fill="#000000" />
      </svg>
      {caption || showUrl ? (
        <figcaption className="cap-qr-caption">
          {caption}
          {showUrl ? <span className="cap-qr-url">{url}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
