import type { ReactNode } from "react";
import { checkQrUrl, qrLabel, qrPath, qrSize } from "./qr.ts";

export interface QrProps {
  // The address the code opens: absolute http(s).
  url: string;
  // The encoder's module matrix for `url`, without its border (uqr: encode(url, { ecc: "M", border: 0 }).data).
  modules: ReadonlyArray<ReadonlyArray<boolean>>;
  // The quiet zone in modules. Default 2.
  quiet?: number;
  // What scanning it is for ("Scan to open this version online."), above the address.
  caption?: ReactNode;
  // Show the address as text under the code. Default true: a reader with no scanner can type it.
  showUrl?: boolean;
  // The code's name. Default: "QR code for {url}".
  label?: string;
}

// The HTML contract in qr.md.
export function Qr(props: QrProps) {
  const { url, modules, quiet = 2, caption, showUrl = true, label = qrLabel(url) } = props;
  checkQrUrl(url);
  const size = qrSize(modules, quiet);
  return (
    <figure className="cap-qr">
      <svg
        className="cap-qr-code"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        shapeRendering="crispEdges"
      >
        <rect width={size} height={size} fill="#ffffff" />
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
