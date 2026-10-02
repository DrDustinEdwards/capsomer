import { useEffect, useId, useMemo, useRef } from "react";
import { enhance, renderCompare, setView, VIEWS, type CompareLabels, type CompareSide, type CompareView, type RunSpan } from "./draft-compare.ts";

export interface DraftCompareProps {
  before: CompareSide;
  after: CompareSide;
  // Words for "Before" and "After" over each side.
  labels?: Partial<CompareLabels>;
  // The view shown. Give it (with onViewChange) to keep the choice in your own state; leave it
  // out and the component remembers the person's choice in localStorage.
  view?: CompareView;
  onViewChange?: (view: CompareView) => void;
  // Unchanged sentences kept beside a change before the rest fold. Default 1.
  context?: number;
  // Who wrote what, per side, by character offset: each sentence is marked with its run.
  runs?: { before?: RunSpan[]; after?: RunSpan[] };
  // How alike two sentences must be (0 to 1) to count as one edited. Default 0.4.
  similarity?: number;
  // Ids and radio names; give each compare on a page its own. Made up when left out.
  id?: string;
}

// Renders exactly the markup renderCompare writes, so a server render (renderToString) and the
// browser agree, and the same behaviour module wires it.
export function DraftCompare({ before, after, labels, view, onViewChange, context, runs, similarity, id }: DraftCompareProps) {
  const own = useId().replace(/[^a-zA-Z0-9]/g, "");
  const host = useRef<HTMLDivElement>(null);
  const first = useRef<CompareView>(view ?? "side");
  const controlled = view !== undefined;
  const key = JSON.stringify([before, after, labels, runs, context, similarity, id, controlled]);
  // The view is not part of the html's identity: the radios hold it, in CSS, so choosing one
  // does not rebuild the page's folds and focus.
  const html = useMemo(() => renderCompare(before, after, { id: id ?? `compare-${own}`, view: first.current, context, labels, runs, similarity, remember: !controlled }), [key, own]);

  useEffect(() => {
    const el = host.current;
    return el ? enhance(el) : undefined;
  }, [html]);

  useEffect(() => {
    const section = host.current?.querySelector<HTMLElement>(".cap-compare");
    if (section && view) setView(section, view);
  }, [view, html]);

  useEffect(() => {
    const el = host.current;
    if (!el || !onViewChange) return undefined;
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.matches(".cap-compare-bar input[type='radio']") && (VIEWS as readonly string[]).includes(t.value)) onViewChange(t.value as CompareView);
    };
    el.addEventListener("change", onChange);
    return () => el.removeEventListener("change", onChange);
  }, [onViewChange, html]);

  return <div ref={host} dangerouslySetInnerHTML={{ __html: html }} />;
}
