import { useEffect, useRef, useState } from "react";
import { goToSection, meetsRule, scrollParent, watchSections } from "./anchor-bar.ts";

export interface AnchorBarProps {
  // The view's sections, in order; each id is its h2's id.
  sections: Array<{ id: string; label: string }>;
  // Show the bar even when the view is short or has fewer than three sections.
  always?: boolean;
  label?: string;
}

export function AnchorBar({ sections, always = false, label = "On this page" }: AnchorBarProps) {
  const nav = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(always);
  const [current, setCurrent] = useState<string | null>(null);
  const ids = sections.map((s) => s.id).join(" ");

  useEffect(() => {
    const el = nav.current;
    const headings = sections.map((s) => document.getElementById(s.id)).filter((h): h is HTMLElement => h !== null);
    const scroller = scrollParent(el);
    const ok = always || meetsRule(headings, scroller);
    setShown(ok);
    if (!ok || !el) return;
    for (const h of headings) {
      if (!h.hasAttribute("tabindex")) h.tabIndex = -1;
      h.dataset.capAnchor = "";
    }
    const measure = () => (scroller ?? document.documentElement).style.setProperty("--cap-anchors-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    // After the next frame, once the bar is shown and has a height.
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    const stop = watchSections(headings, setCurrent, scroller);
    return () => {
      stop();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
    // The section ids identify what to watch.
  }, [ids, always]);

  return (
    <nav ref={nav} className="cap-anchors" aria-label={label} data-cap="anchor-bar" hidden={!shown}>
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
