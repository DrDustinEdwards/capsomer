import { useEffect, useRef, type ReactNode } from "react";
import { attach, viewBox, type Segment } from "./annotated-figure.ts";

export type { Point, Segment } from "./annotated-figure.ts";

export interface Callout {
  // Pairs the callout with its key entry ("1", "iv").
  id: string;
  // The target's accessible name ("Callout 1, the inbox").
  name: string;
  // The words at the end of the leader ("1 · Inbox"); drawn, and hidden from screen readers.
  label: string;
  // What the callout points at, drawn in the drawing's own units.
  target: ReactNode;
  leader: Segment[];
  text: { x: number; y: number; anchor: "start" | "end" };
}

export interface AnnotatedDrawingProps {
  // Keys the title and description ids; unique on the page.
  id: string;
  // "wide" or "narrow" when the figure has one drawing for each; the container's width picks one.
  layout?: "wide" | "narrow";
  view: { x: number; y: number; w: number; h: number };
  title: string;
  // The whole drawing in words, with every callout: what a reader who cannot see it is told.
  description: string;
  // Drawn first, under every callout.
  art?: ReactNode;
  callouts: Callout[];
  // Drawn last: a scale bar, a north arrow.
  after?: ReactNode;
}

// One drawing: the art, every target, then every leader and label over them, so no fill ever covers
// a leader.
export function AnnotatedDrawing(props: AnnotatedDrawingProps) {
  const { id, layout, view, title, description, art, callouts, after } = props;
  const t = `${id}-title`;
  const d = `${id}-desc`;
  return (
    <svg
      className="cap-annotated-figure-drawing"
      data-layout={layout}
      viewBox={viewBox(view)}
      role="group"
      aria-labelledby={`${t} ${d}`}
    >
      <title id={t}>{title}</title>
      <desc id={d}>{description}</desc>
      {art}
      {callouts.map((c) => (
        <g
          key={c.id}
          className="cap-annotated-figure-target"
          data-callout={c.id}
          role="img"
          aria-label={c.name}
        >
          {c.target}
        </g>
      ))}
      {callouts.map((c) => (
        <g key={c.id} className="cap-annotated-figure-leader" data-callout={c.id}>
          {c.leader.map(([x1, y1, x2, y2], j) => (
            <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
          <text
            className="cap-annotated-figure-label"
            x={c.text.x}
            y={c.text.y}
            textAnchor={c.text.anchor}
            aria-hidden="true"
          >
            {c.label}
          </text>
        </g>
      ))}
      {after}
    </svg>
  );
}

export interface AnnotatedFigureProps {
  // The figure's id, which a key outside it names in `for`.
  id: string;
  // Draw each leader in once the figure is in view (not under reduced motion).
  draw?: boolean;
  caption?: ReactNode;
  // One AnnotatedDrawing, or a "wide" and a "narrow" one; an AnnotatedKey inside it, if it belongs there.
  children: ReactNode;
}

// The HTML contract in annotated-figure.md. The lighting is the behavior module's, attached in an
// effect: it only sets data-lit, which React does not render, so React's render stays true.
export function AnnotatedFigure({ id, draw = false, caption, children }: AnnotatedFigureProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const figure = ref.current;
    if (!figure || figure.hasAttribute("data-cap-ready")) return;
    figure.dataset.capReady = "";
    const off = attach(figure);
    return () => {
      off();
      delete figure.dataset.capReady;
    };
  }, []);
  return (
    <figure
      ref={ref}
      id={id}
      className="cap-annotated-figure"
      data-cap="annotated-figure"
      data-draw={draw ? "" : undefined}
    >
      {children}
      {caption ? <figcaption className="cap-annotated-figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}

export interface KeyEntry {
  id: string;
  // The number as the drawing shows it ("1", "iv").
  number: string;
  name: string;
  note?: ReactNode;
  // A small drawing of the item, in a square of `size` units, named by `artLabel`.
  art?: ReactNode;
  artLabel?: string;
  size?: number;
}

export interface AnnotatedKeyProps {
  // The figure it belongs to, when it sits outside it.
  for?: string;
  label: string;
  entries: KeyEntry[];
}

// The key: one ruled box per callout, its number, its drawing, its name and a note.
export function AnnotatedKey({ for: figure, label, entries }: AnnotatedKeyProps) {
  return (
    <section className="cap-annotated-key" aria-label={label} data-for={figure}>
      <div className="cap-annotated-key-entries">
        {entries.map((e) => (
          <figure key={e.id} className="cap-annotated-key-entry" data-callout={e.id}>
            {e.art ? (
              <svg
                className="cap-annotated-key-art"
                viewBox={`0 0 ${e.size ?? 76} ${e.size ?? 76}`}
                role="img"
                aria-label={e.artLabel ?? e.name}
              >
                {e.art}
              </svg>
            ) : null}
            <figcaption>
              <span className="cap-eyebrow cap-annotated-key-num" data-variant="mono">
                {e.number}
              </span>
              <b className="cap-annotated-key-name">{e.name}</b>
              {e.note ? <span className="cap-annotated-key-note">{e.note}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
