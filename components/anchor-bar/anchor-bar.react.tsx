import { useEffect, useRef, useState } from "react";
import {
  enhance,
  goToSection,
  markSections,
  measureBar,
  meetsRule,
  scrollParent,
  watchSections,
} from "./anchor-bar.ts";

export interface AnchorBarProps {
  // The view's sections, in order; each id is the id of the block or h2 it links to. Left out,
  // the bar finds them itself, as the behavior module does: the [data-section][id] blocks of its
  // main (else its h2[id] headings), kept in step as they come and go.
  sections?: Array<{ id: string; label: string }>;
  // Show the bar even when the view is short or has fewer than three sections.
  always?: boolean;
  label?: string;
  // "vertical": a list down a side column, sticky beside the sections (a long page's section nav).
  orientation?: "horizontal" | "vertical";
}

type BarProps = { always: boolean; label: string; orientation: "horizontal" | "vertical" };
const orientationAttr = (o: BarProps["orientation"]) => (o === "vertical" ? "vertical" : undefined);

export function AnchorBar({
  sections,
  always = false,
  label = "On this page",
  orientation = "horizontal",
}: AnchorBarProps) {
  const bar = { always, label, orientation };
  if (!sections) return <FoundAnchorBar {...bar} />;
  return <ListedAnchorBar sections={sections} {...bar} />;
}

// The list is the behavior module's: React renders it empty and never touches it. The bar starts
// hidden (no empty bar before the script runs) and the module shows it; React sets `hidden` once
// and, as the value never changes, never sets it again.
function FoundAnchorBar({ always, label, orientation }: BarProps) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const parent = nav.current?.parentElement;
    return parent ? enhance(parent) : undefined;
  }, []);
  return (
    <nav
      ref={nav}
      className="cap-anchors"
      aria-label={label}
      data-cap="anchor-bar"
      data-always={always || undefined}
      data-orientation={orientationAttr(orientation)}
      hidden={!always}
    >
      <span className="cap-anchors-label" aria-hidden="true">
        {label}
      </span>
      <ul className="cap-anchors-list" />
    </nav>
  );
}

function ListedAnchorBar({
  sections,
  always,
  label,
  orientation,
}: Required<Pick<AnchorBarProps, "sections">> & BarProps) {
  const nav = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(always);
  const [current, setCurrent] = useState<string | null>(null);
  const ids = sections.map((s) => s.id).join(" ");

  // The rule, measured now and again whenever the window or the content changes size, so a
  // view that fills in after it loads gets its bar when it earns one (the Portal's Anchors).
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const scroller = scrollParent(el);
    const headings = () =>
      sections
        .map((s) => document.getElementById(s.id))
        .filter((h): h is HTMLElement => h !== null);
    // The bar's own height does not count, or showing it could tip the rule.
    const apply = () => setShown(always || meetsRule(headings(), scroller, el.offsetHeight));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(scroller ?? document.documentElement);
    ro.observe(el);
    const scope = el.closest("main") ?? document.body;
    const mo = new MutationObserver(apply);
    mo.observe(scope, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-section", "id", "hidden"],
    });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
    // The section ids identify what to watch.
    // oxlint-disable-next-line react/exhaustive-deps -- the section ids identify what to watch
  }, [ids, always]);

  // While the bar shows: stop each section below it, and mark the current one.
  useEffect(() => {
    const el = nav.current;
    if (!el || !shown) return;
    const scroller = scrollParent(el);
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter((h): h is HTMLElement => h !== null);
    markSections(headings);
    // After the next frame, once the bar is shown and has a height.
    const frame = requestAnimationFrame(() => measureBar(el, scroller));
    const stop = watchSections(headings, setCurrent, scroller);
    return () => {
      stop();
      cancelAnimationFrame(frame);
    };
    // oxlint-disable-next-line react/exhaustive-deps -- the section ids identify what to watch
  }, [ids, shown]);

  return (
    <nav
      ref={nav}
      className="cap-anchors"
      aria-label={label}
      data-cap="anchor-bar"
      data-orientation={orientationAttr(orientation)}
      hidden={!shown}
    >
      <span className="cap-anchors-label" aria-hidden="true">
        {label}
      </span>
      <ul className="cap-anchors-list">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={current === s.id ? "location" : undefined}
              onClick={(e) => {
                const h = document.getElementById(s.id);
                if (!h || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                goToSection(h);
              }}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
