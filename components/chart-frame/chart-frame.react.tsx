import type { EnhanceOptions } from "enarratio/enhance";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { type ChartFit, type Gridlines, shownHeight } from "./chart-frame.ts";
import { Status } from "../status/status.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { markup } from "../trusted-html/trusted-html.ts";

export const DEFAULT_WIDTH = 640;
// Redraws at the frame's whole-pixel width so the chart fills its column; never under MIN_WIDTH.
// A resize redraws at most once a frame.
const MIN_WIDTH = 240;

export function drawWidth(measured: number, min = MIN_WIDTH): number {
  return Math.max(min, Math.floor(measured));
}

export { shownHeight, type ChartFit };

const rootRem = () =>
  typeof document === "undefined"
    ? 16
    : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export interface ChartFrameProps {
  // Draws Enarratio's figure at a width, as a string: `(width, fit) => barChart({ ...options, width, ...fit })`.
  // The server and first client render use an empty `fit` so hydration matches; the frame then
  // redraws at its measured width and `fit` holds the first drawing's height, so the page does not
  // move. A throw is shown in the chart's place, in Enarratio's own words.
  draw?: (width: number, fit: ChartFit) => string;
  // Or a figure already drawn (a primitive's), placed as it comes and never redrawn.
  chart?: string;
  width?: number;
  minWidth?: number;
  noData?: { title: string; reason: string };
  inline?: boolean;
  // Enarratio's enhancement layer (hover, keyboard reading, legend filters, sortable table), run on
  // the figure after each draw: on by default, `false` to leave it as drawn, or enarratio/enhance's options.
  enhance?: boolean | EnhanceOptions;
  gridlines?: Gridlines;
  onDraw?: (el: HTMLElement) => void | (() => void);
  className?: string;
  children?: ReactNode;
}

// enarratio/enhance, loaded once on the first frame that wants it, so a page without charts and
// the server never load it; a server build (Vite's SSR) drops it from its bundle.
let enhancer: Promise<typeof import("enarratio/enhance")> | undefined;
const loadEnhance = () =>
  (enhancer ??= (import.meta as { env?: { SSR?: boolean } }).env?.SSR
    ? Promise.reject(new Error("chart-frame: enhance runs only in a browser"))
    : import("enarratio/enhance"));

export function ChartFrame({
  draw,
  chart,
  width = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  noData,
  inline,
  enhance = true,
  gridlines,
  onDraw,
  className,
  children,
}: ChartFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(width);
  // The drawing at `width` (the server's), from which each redraw takes its height (shownHeight);
  // drawn again when the page passes a new draw, not on a resize.
  const first = useMemo(() => {
    if (!draw) return { html: "", error: "" };
    try {
      return { html: draw(width, {}), error: "" };
    } catch (err) {
      return { html: "", error: err instanceof Error ? err.message : String(err) };
    }
  }, [draw, width]);
  const after = useRef(onDraw);
  useLayoutEffect(() => {
    after.current = onDraw;
  });
  const redraws = draw !== undefined;

  // Measured before the first paint, so a drawing that keeps its own height (a heat strip) is never
  // shown at the server's width and then redrawn taller; a resize redraws at most once a frame.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !redraws) return;
    const first = Math.floor(el.clientWidth);
    if (first > 0) setDrawn(drawWidth(first, minWidth));
    if (typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      const measured = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (measured <= 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setDrawn(drawWidth(measured, minWidth)));
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [redraws, minWidth]);

  let html = chart ?? "";
  let error = first.error;
  if (draw && !error) {
    try {
      if (drawn === width) html = first.html;
      else {
        const height = shownHeight(first.html, drawn, rootRem());
        html = draw(drawn, height === undefined ? {} : { height });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !html) return;
    return after.current?.(el) ?? undefined;
  }, [html]);

  const options = typeof enhance === "object" ? enhance : undefined;
  const optionsKey = options ? JSON.stringify(options) : String(enhance);
  const enhanceOptions = useRef(options);
  useLayoutEffect(() => {
    enhanceOptions.current = options;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || !html || enhance === false) return;
    let live = true;
    let charts: { destroy(): void }[] = [];
    loadEnhance()
      .then((m) => {
        if (!live || !el.isConnected) return;
        charts = m.enhance(el, enhanceOptions.current);
      })
      .catch(() => {
        // The chart is complete without the layer: its words and table are in the HTML. A failed
        // load is not kept, so the next draw tries again.
        enhancer = undefined;
      });
    return () => {
      live = false;
      for (const c of charts) c.destroy();
    };
    // oxlint-disable-next-line react/exhaustive-deps -- optionsKey stands for enhance, so a new options object with the same values does not re-enhance
  }, [html, optionsKey]);

  const cls = className ? `cap-chart ${className}` : "cap-chart";
  if (noData) {
    return (
      <figure className={cls} data-state="nodata">
        <figcaption className="cap-chart-title">{noData.title}</figcaption>
        <p className="cap-chart-reason">
          <Status tone="nodata">No data</Status> {noData.reason}
        </p>
      </figure>
    );
  }
  return (
    <div
      ref={ref}
      className={cls}
      data-head={inline ? "inline" : undefined}
      data-gridlines={gridlines}
      data-enhance={enhance === false ? "off" : "self"}
      data-state={error ? "refused" : undefined}
    >
      {error ? (
        <p className="cap-chart-reason">{`This chart could not be drawn: ${error}`}</p>
      ) : (
        <div className="cap-chart-figure" dangerouslySetInnerHTML={markup(html)} />
      )}
      {children}
    </div>
  );
}

export interface ChartPanelProps extends Omit<ChartFrameProps, "noData" | "className"> {
  // The panel's heading. Given, the panel's head names the chart and Enarratio's own title is kept
  // for screen readers and the table only; left out, the figure's title is the heading.
  title?: string;
  level?: 2 | 3;
  more?: ReactNode;
  src?: ReactNode;
  id?: string;
  empty?: { reason: string } | null;
  stale?: string | null;
  className?: string;
}

export function ChartPanel({
  title,
  level,
  more,
  src,
  id,
  empty,
  stale,
  className,
  ...frame
}: ChartPanelProps) {
  const body = (
    <>
      {stale ? (
        <p className="cap-chart-stale" role="status">
          <Status tone="warn">Not refreshed</Status> {stale}
        </p>
      ) : null}
      <ChartFrame
        {...frame}
        noData={empty ? { title: title ?? "No data", reason: empty.reason } : undefined}
      />
    </>
  );
  const cls = className ? `cap-chart-panel ${className}` : "cap-chart-panel";
  if (title == null)
    return (
      <section className={`cap-panel ${cls}`} id={id}>
        <div className="cap-panel-body">{body}</div>
      </section>
    );
  return (
    <Panel title={title} level={level} more={more} src={src} id={id} className={cls}>
      {body}
    </Panel>
  );
}

export interface DataPreviewProps {
  id?: string;
  heading: ReactNode;
  // The drawing, already drawn (an inline sparkline), hidden from assistive technology: `summary`
  // says what it shows, so it must stay visible and true to the numbers.
  chart: string;
  summary: ReactNode;
  link: { href: string; label: ReactNode };
  source?: { href: string; label: ReactNode };
  level?: 2 | 3 | 4;
}

export function DataPreview({
  id,
  heading,
  chart,
  summary,
  link,
  source,
  level = 3,
}: DataPreviewProps) {
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  return (
    <aside
      className="cap-card cap-data-preview"
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <Heading className="cap-data-preview-heading" id={id ? `${id}-heading` : undefined}>
        {heading}
      </Heading>
      <div
        className="cap-data-preview-chart"
        aria-hidden="true"
        dangerouslySetInnerHTML={markup(chart)}
      />
      <p className="cap-data-preview-summary">{summary}</p>
      <p className="cap-data-preview-link">
        <a href={link.href}>{link.label}</a>
      </p>
      {source ? (
        <p className="cap-data-preview-source">
          <a href={source.href}>{source.label}</a>
        </p>
      ) : null}
    </aside>
  );
}
