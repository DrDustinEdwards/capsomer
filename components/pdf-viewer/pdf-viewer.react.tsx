import { useEffect, useRef } from "react";
import { DEFAULT_SCALE, start } from "./pdf-viewer.ts";

export interface PdfViewerProps {
  // The PDF's address.
  src: string;
  // The document's title, in the viewer's name.
  title?: string;
  // The folder the site serves PDF.js from.
  pdfjs?: string;
}

// The HTML contract in pdf-viewer.md, rendered in its loading state; the behavior starts once.
export function PdfViewer({ src, title, pdfjs = "/pdfjs/" }: PdfViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? start(ref.current) : undefined), [src]);
  const label = title ? `PDF viewer, ${title}` : "PDF viewer";
  return (
    <div
      ref={ref}
      className="cap-pdf"
      role="group"
      aria-label={label}
      data-cap="pdf-viewer"
      data-src={src}
      data-pdfjs={pdfjs}
    >
      <div className="cap-pdf-bar">
        <div className="cap-btn-group" role="group" aria-label="Pages">
          <button
            type="button"
            disabled
            className="cap-btn"
            data-size="sm"
            aria-label="Previous page"
            data-pdf="prev"
          >
            Previous
          </button>
          <button
            type="button"
            disabled
            className="cap-btn"
            data-size="sm"
            aria-label="Next page"
            data-pdf="next"
          >
            Next
          </button>
        </div>
        <p className="cap-pdf-status" aria-live="polite" data-pdf="status">
          Loading
        </p>
        <div className="cap-pdf-zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            disabled
            className="cap-btn"
            data-size="sm"
            aria-label="Zoom out"
            data-pdf="zoom-out"
          >
            Zoom out
          </button>
          <span className="cap-pdf-zoom-value" data-pdf="zoom">
            {Math.round(DEFAULT_SCALE * 100)}%
          </span>
          <button
            type="button"
            disabled
            className="cap-btn"
            data-size="sm"
            aria-label="Zoom in"
            data-pdf="zoom-in"
          >
            Zoom in
          </button>
        </div>
      </div>
      <div
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the page takes focus so the arrow and zoom keys reach it
        tabIndex={0}
        className="cap-pdf-page"
        role="group"
        aria-label={`${label}. Use the arrow keys to change page and the plus and minus keys to zoom.`}
      >
        <canvas />
      </div>
      <p className="cap-pdf-fallback">
        <a href={src}>Open the PDF</a>
      </p>
    </div>
  );
}
