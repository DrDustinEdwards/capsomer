import type { EnhanceOptions } from "enarratio/enhance";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { chartViewBox, type Gridlines } from "./chart-frame.ts";
import { Glyph } from "../status/status.react.tsx";
import { markup } from "../trusted-html/trusted-html.ts";

// The width a chart is drawn at on the server and before the first measurement: Enarratio's own
// default drawing width.
export const DEFAULT_WIDTH = 640;
// Redraws at the frame's whole-pixel width, so the chart fills its column (steps of 40 px left up
// to 39 px empty beside it); never under MIN_WIDTH. A resize redraws at most once a frame.
const MIN_WIDTH = 240;

export function drawWidth(measured: number, min = MIN_WIDTH): number {
  return Math.max(min, Math.floor(measured));
}

// What a redraw keeps from the first drawing: the height it showed at the frame's width.
export interface ChartFit {
  height?: number;
}

// A drawing 30rem or wider keeps that width and scrolls under it (Enarratio's .enarratio-frame-wide).
const WIDE_REM = 30;

// The height the first drawing (`first`, drawn at the server's width) shows at in a frame `width`
// wide: scaled down to the frame, never up, and not below 30rem for a wide drawing. The redraw
// draws at this height, so swapping it in after hydration moves nothing under the chart (web.dev,
// "Optimize CLS"); the rule is enarratio/redraw's own (Enarratio record 0033), for pages drawn
// without React.
// A primitive's figure (a heat strip, timeline, sparkline, uptime strip or progress ring; Enarratio
// marks it `data-enarratio-static`) gets none: its height is its own, not its width's shape. A
// heat strip keeps the height it is given at any width, so fitting it to a 640 drawing shrunk into
// 300 px would redraw it 9 px tall, not 20; a timeline's height comes from its lanes and ignores
// `height`, and under 30rem it shows its list, not the SVG. enarratio/redraw redraws charts only.
export function shownHeight(first: string, width: number, rem = 16): number | undefined {
  if (/<figure\b[^>]*\sdata-enarratio-static\b/.test(first)) return undefined;
  const box = chartViewBox(first);
  if (!box || !(box.w > 0 && box.h > 0)) return undefined;
  const { w, h } = box;
  const shown = first.includes("enarratio-frame-wide") ? Math.max(width, WIDE_REM * rem) : width;
  return Math.round(((h * Math.min(shown, w)) / w) * 100) / 100;
}

const rootRem = () =>
  typeof document === "undefined"
    ? 16
    : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export interface ChartFrameProps {
  // Draws Enarratio's figure at a width, as a string: `(width, fit) => barChart({ ...options, width,
  // ...fit })` from enarratio/lite. The server and the first client render draw at `width` with an
  // empty `fit`, so hydration matches; then the frame redraws at its own measured width, and `fit`
  // holds the height the first drawing showed at that width, so the page does not move when the
  // redraw swaps in. A draw that leaves `fit` out keeps its own height. A throw is shown in the
  // chart's place, in Enarratio's own words, not the page's.
  draw?: (width: number, fit: ChartFit) => string;
  // Or a figure already drawn (a primitive's figure), placed as it comes and never redrawn.
  chart?: string;
  width?: number;
  minWidth?: number;
  // No data: the title and the reason, in the chart's place, with no chart and no table.
  noData?: { title: string; reason: string };
  // The title on one line with the subtitle at its end.
  inline?: boolean;
  // Enarratio's enhancement layer (hover details, keyboard reading, legend filters, a sortable
  // table), loaded and run on the figure after each draw: on by default, `false` to leave the
  // figure as drawn, or enarratio/enhance's options.
  enhance?: boolean | EnhanceOptions;
  // Which gridlines show; capsomer/enarratio.css draws "y" by default.
  gridlines?: Gridlines;
  // After each draw, with the frame's element; may return a cleanup.
  onDraw?: (el: HTMLElement) => void | (() => void);
  className?: string;
  // After the figure: a legend of the slots.
  children?: ReactNode;
}

// enarratio/enhance, loaded once on the first frame that wants it, so a page without charts and
// the server never load it.
let enhancer: Promise<typeof import("enarratio/enhance")> | undefined;
const loadEnhance = () => (enhancer ??= import("enarratio/enhance"));

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
  // The drawing at `width` (the server's), which each redraw takes its height from (shownHeight),
  // and the draw it came from: drawn again when the page passes a new draw, not on a resize.
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
        // The chart is complete without the layer: its words and table are in the HTML.
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
