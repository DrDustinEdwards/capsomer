import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";

// The width a chart is drawn at on the server and before the first measurement: Enarratio's own
// default drawing width.
export const DEFAULT_WIDTH = 640;
// Redraws come in steps of this many pixels, so dragging a window redraws a few times, not on
// every pixel; never under MIN_WIDTH.
const STEP = 40;
const MIN_WIDTH = 240;

export function drawWidth(measured: number, min = MIN_WIDTH): number {
  return Math.max(min, Math.floor(measured / STEP) * STEP);
}

export interface ChartFrameProps {
  // Draws Enarratio's figure at a width, as a string: `(width) => barChart({ ...options, width })`
  // from enarratio/lite. The server and the first client render draw at `width`, so hydration
  // matches; then the frame redraws at its own measured width. A throw is shown in the chart's
  // place, in Enarratio's own words, not the page's.
  draw?: (width: number) => string;
  // Or a figure already drawn (a primitive's figure), placed as it comes and never redrawn.
  chart?: string;
  width?: number;
  minWidth?: number;
  // No data: the title and the reason, in the chart's place, with no chart and no table.
  noData?: { title: string; reason: string };
  // The title on one line with the subtitle at its end.
  inline?: boolean;
  // After each draw, with the figure's element (enarratio/enhance's `enhance(el)`); may return a cleanup.
  onDraw?: (el: HTMLElement) => void | (() => void);
  className?: string;
  // After the figure: a legend of the slots.
  children?: ReactNode;
}

export function ChartFrame({ draw, chart, width = DEFAULT_WIDTH, minWidth = MIN_WIDTH, noData, inline, onDraw, className, children }: ChartFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dataOpen = useRef(false);
  const [drawn, setDrawn] = useState(width);
  const after = useRef(onDraw);
  after.current = onDraw;
  const redraws = draw !== undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el || !redraws || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      const measured = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (measured <= 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setDrawn(drawWidth(measured, minWidth)));
    });
    observer.observe(el);
    // A redraw replaces "Show data"; keep it open if the reader opened it. toggle does not bubble.
    const onToggle = (e: Event) => {
      if (e.target instanceof HTMLDetailsElement) dataOpen.current = e.target.open;
    };
    el.addEventListener("toggle", onToggle, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("toggle", onToggle, true);
    };
  }, [redraws, minWidth]);

  let html = chart ?? "";
  let error = "";
  if (draw) {
    try {
      html = draw(drawn);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !html) return;
    const details = el.querySelector<HTMLDetailsElement>(".enarratio-data");
    if (details && dataOpen.current) details.open = true;
    return after.current?.(el) ?? undefined;
  }, [html]);

  const cls = className ? `cap-chart ${className}` : "cap-chart";
  if (noData) {
    return (
      <figure className={cls} data-state="nodata">
        <figcaption className="cap-chart-title">{noData.title}</figcaption>
        <p className="cap-chart-reason">
          <span className="cap-status" data-tone="nodata">
            <Glyph name="nodata" />
            No data
          </span>{" "}
          {noData.reason}
        </p>
      </figure>
    );
  }
  return (
    <div ref={ref} className={cls} data-head={inline ? "inline" : undefined}>
      {error ? <p className="cap-chart-reason">This chart could not be drawn: {error}</p> : <div className="cap-chart-figure" dangerouslySetInnerHTML={{ __html: html }} />}
      {children}
    </div>
  );
}
