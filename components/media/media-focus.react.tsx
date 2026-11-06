// The focal point of one image (MediaInspector; ported from Carrel's focus picker): the point a site's
// crops are cut around (site-runtime ./image, the file's `focus`). Click the picture, or move the point
// with the arrow keys, and see the crops the site may cut. The two fields are the control itself, so
// the form works with no script, posting `intent=focus` with `x` and `y` in percent (the content kit
// reads them) or `clear=yes`; the picture and the previews follow them. The point is placed through
// custom properties set from a ref, never a style attribute in the markup.
import { type ComponentType, type FormHTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
import { focusPercents } from "./media-crop.ts";

// The crops shown beside the picture, as a site's pages commonly ask for them.
const PREVIEWS = [
  { label: "Square", ratio: "1:1" },
  { label: "Wide", ratio: "16:9" },
  { label: "Tall", ratio: "4:5" },
];

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n * 10) / 10)) : 50);

export function focusWords(focus: string | null | undefined): string {
  if (!focus) return "None: the site guesses";
  const p = focusPercents(focus);
  return `${p.x}% across, ${p.y}% down`;
}

export function MediaFocus({
  name,
  src,
  focus,
  action,
  Form,
  ident,
  base,
}: {
  name: string;
  src: string;
  focus: string | null | undefined;
  action: string;
  Form: ComponentType<FormHTMLAttributes<HTMLFormElement> & { method?: "get" | "post" }>;
  // The form's hidden fields: the intent, the file and the version seen.
  ident: ReactNode;
  base: string;
}) {
  const [point, setPoint] = useState(() => focusPercents(focus));
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    frame.current?.style.setProperty("--cap-focus-x", `${point.x}%`);
    frame.current?.style.setProperty("--cap-focus-y", `${point.y}%`);
  }, [point.x, point.y]);
  const set = (x: number, y: number) => setPoint({ x: clamp(x), y: clamp(y) });

  return (
    <Form method="post" action={action} className="cap-media-field-form" aria-label="Focal point">
      {ident}
      <p className="cap-field-help">The part of the picture the site keeps when it crops it to fit. Click the picture to move it. {focus ? "" : "None yet: the site guesses."}</p>
      <div className="cap-media-focus" ref={frame}>
        <button
          type="button"
          className="cap-media-focus-frame"
          aria-label={`Focal point of ${name}: ${point.x}% across, ${point.y}% down. Click the picture, or use the arrow keys, to move it.`}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            set(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2;
            const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const move = moves[event.key];
            if (!move) return;
            event.preventDefault();
            // The inspector's own arrows (another file) must not run as well.
            event.stopPropagation();
            set(point.x + move[0], point.y + move[1]);
          }}
        >
          <img src={src} alt="" />
          <span className="cap-media-focus-mark" aria-hidden="true" />
        </button>
        <ul className="cap-media-focus-previews" aria-label="How the site's crops would look">
          {PREVIEWS.map((p) => (
            <li key={p.label} data-ratio={p.ratio}>
              <img src={src} alt="" loading="lazy" />
              <span>{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="cap-media-focus-fields">
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${base}-fx`}>
            From the left (%)
          </label>
          <input className="cap-input" id={`${base}-fx`} type="number" name="x" min={0} max={100} step={0.1} value={point.x} onChange={(e) => set(Number(e.target.value), point.y)} />
        </div>
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${base}-fy`}>
            From the top (%)
          </label>
          <input className="cap-input" id={`${base}-fy`} type="number" name="y" min={0} max={100} step={0.1} value={point.y} onChange={(e) => set(point.x, Number(e.target.value))} />
        </div>
      </div>
      <div className="cap-media-tool-actions">
        <button type="submit" className="cap-btn" data-size="sm">
          Save focal point
        </button>
        {focus ? (
          <button type="submit" className="cap-btn" data-size="sm" data-variant="quiet" name="clear" value="yes">
            Clear it<span className="cap-sr-only"> and let the site guess</span>
          </button>
        ) : null}
      </div>
    </Form>
  );
}
