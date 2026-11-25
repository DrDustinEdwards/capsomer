import { useCleanId } from "../hooks/hooks.react.tsx";
import { plural } from "@drdustinedwards/site-helpers/text";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  enhance,
  renderCompare,
  renderPatch,
  setView,
  VIEWS,
  type CompareLabels,
  type CompareSide,
  type CompareView,
  type RunSpan,
} from "./draft-compare.ts";
import {
  choicesOf,
  startPicks,
  type MergeBlock,
  type MergePick,
  type MergePlan,
} from "./draft-compare-merge.ts";
import type { WordPart } from "./draft-compare-diff.ts";
import { Button } from "../button/button.react.tsx";
import { Segmented, type SegmentedOption } from "../segmented/segmented.react.tsx";
import { markup } from "../trusted-html/trusted-html.ts";

export interface DraftCompareProps {
  before: CompareSide;
  after: CompareSide;
  labels?: Partial<CompareLabels>;
  // The view shown. Give it (with onViewChange) to keep the choice in your own state; leave it
  // out and the component remembers the person's choice in localStorage.
  view?: CompareView;
  onViewChange?: (view: CompareView) => void;
  context?: number;
  runs?: { before?: RunSpan[]; after?: RunSpan[] };
  similarity?: number;
  id?: string;
  heads?: boolean;
}

// Renders exactly the markup renderCompare writes, so a server render and the browser agree.
export function DraftCompare({
  before,
  after,
  labels,
  view,
  onViewChange,
  context,
  runs,
  similarity,
  id,
  heads,
}: DraftCompareProps) {
  const own = useCleanId();
  const host = useRef<HTMLDivElement>(null);
  const [first] = useState<CompareView>(view ?? "side");
  const controlled = view !== undefined;
  const key = JSON.stringify([
    before,
    after,
    labels,
    runs,
    context,
    similarity,
    id,
    controlled,
    heads,
  ]);
  // The view is not part of the html's identity: the radios hold it, in CSS, so choosing one
  // does not rebuild the page's folds and focus.
  const html = useMemo(
    () =>
      renderCompare(before, after, {
        id: id ?? `compare-${own}`,
        view: first,
        context,
        labels,
        runs,
        similarity,
        remember: !controlled,
        heads,
      }),
    // oxlint-disable-next-line react/exhaustive-deps -- key holds every input that changes the html; the view is held by the radios
    [key, own],
  );

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
      if (
        t.matches(".cap-compare-bar input[type='radio']") &&
        (VIEWS as readonly string[]).includes(t.value)
      )
        onViewChange(t.value as CompareView);
    };
    el.addEventListener("change", onChange);
    return () => el.removeEventListener("change", onChange);
  }, [onViewChange, html]);

  return <div ref={host} dangerouslySetInnerHTML={markup(html)} />;
}

export interface DraftPatchProps {
  patch: string;
  title?: string;
  id?: string;
}

export function DraftPatch({ patch, title, id }: DraftPatchProps) {
  const own = useCleanId();
  const html = useMemo(
    () => renderPatch(patch, { id: id ?? `patch-${own}`, title }),
    [patch, title, id, own],
  );
  return <div dangerouslySetInnerHTML={markup(html)} />;
}

export interface MergeLabels {
  mine: string;
  theirs: string;
  keepMine: string;
  keepTheirs: string;
  keepBoth: string;
  notInMine: string;
  notInTheirs: string;
  changedMine: string;
  changedTheirs: string;
  leftOut: string;
  withoutBase: string;
  apply: string;
}

const MERGE_LABELS: MergeLabels = {
  mine: "Your text",
  theirs: "The saved copy",
  keepMine: "Keep yours",
  keepTheirs: "Take the saved copy",
  keepBoth: "Keep both",
  notInMine: "Not in your text",
  notInTheirs: "Not in the saved copy",
  changedMine: "changed here",
  changedTheirs: "changed there",
  leftOut: "left out",
  withoutBase: "The version both started from could not be read, so each starts on yours.",
  apply: "Use the merged text",
};

/** "3 differences, 1 changed on both": for the heading or panel the merge sits in. */
export function mergeCountsText(plan: MergePlan): string {
  const choices = choicesOf(plan);
  const both = choices.filter((c) => c.changedBy === null).length;
  const n = plural(choices.length, "difference");
  return plan.hasBase ? `${n}, ${both} changed on both` : n;
}

export interface DraftMergeProps {
  plan: MergePlan;
  onApply: (picks: MergePick[]) => void;
  pending?: boolean;
  labels?: Partial<MergeLabels>;
  level?: 3 | 4;
}

function MergeSide({
  blocks,
  empty,
  words,
  show,
}: {
  blocks: MergeBlock[];
  empty: string;
  words?: WordPart[];
  show: "del" | "ins";
}) {
  if (blocks.length === 0) return <p className="cap-merge-text cap-merge-empty">{empty}</p>;
  if (words) {
    // One block against one: the words only this side has are marked, on each side alike.
    return (
      <pre className="cap-merge-text">
        {words.map((w, i) => {
          if (w.op === "same") return w.text;
          if (w.op !== show) return null;
          return (
            <mark key={i} className="cap-merge-mark">
              <span className="cap-sr-only"> only here: </span>
              {w.text}
            </mark>
          );
        })}
      </pre>
    );
  }
  return (
    <div className="cap-merge-text">
      {blocks.map((b, i) => (
        <pre key={i}>{b.text}</pre>
      ))}
    </div>
  );
}

// Keyed by the plan's identity, so a new plan starts on its own picks.
export function DraftMerge({ plan, onApply, pending = false, labels, level = 3 }: DraftMergeProps) {
  const l = { ...MERGE_LABELS, ...labels };
  const [picks, setPicks] = useState<MergePick[]>(() => startPicks(plan));
  const H = `h${level}` as const;
  const order = plan.segments.map(
    (_, i) => plan.segments.slice(0, i + 1).filter((x) => x.kind === "choice").length - 1,
  );
  return (
    <div className="cap-merge">
      {plan.hasBase ? null : <p className="cap-merge-intro">{l.withoutBase}</p>}
      <ol className="cap-merge-list">
        {plan.segments.map((s, i) => {
          if (s.kind === "same") {
            return (
              <li key={i} className="cap-merge-same">
                {plural(s.blocks.length, "passage")} the same on both
              </li>
            );
          }
          const at = order[i]!;
          const pick = picks[at] ?? s.start;
          const label = `Difference ${at + 1}`;
          const options: Array<SegmentedOption<MergePick>> = [
            { value: "mine", label: l.keepMine },
            { value: "theirs", label: l.keepTheirs },
            // Keeping both needs a passage on each side, and a frontmatter key cannot be written twice.
            {
              value: "both",
              label: l.keepBoth,
              disabled: s.mine.length === 0 || s.theirs.length === 0 || s.mine.some((b) => b.front),
            },
          ];
          return (
            <li key={i} className="cap-merge-choice" data-pick={pick}>
              <div className="cap-merge-sides">
                <section
                  aria-label={`${label}: ${l.mine}`}
                  data-kept={pick !== "theirs" ? "" : undefined}
                >
                  <H className="cap-merge-side">
                    {l.mine}
                    {s.changedBy === "mine" ? ` (${l.changedMine})` : ""}
                    {pick === "theirs" ? `, ${l.leftOut}` : ""}
                  </H>
                  <MergeSide blocks={s.mine} empty={l.notInMine} words={s.words} show="del" />
                </section>
                <section
                  aria-label={`${label}: ${l.theirs}`}
                  data-kept={pick !== "mine" ? "" : undefined}
                >
                  <H className="cap-merge-side">
                    {l.theirs}
                    {s.changedBy === "theirs" ? ` (${l.changedTheirs})` : ""}
                    {pick === "mine" ? `, ${l.leftOut}` : ""}
                  </H>
                  <MergeSide blocks={s.theirs} empty={l.notInTheirs} words={s.words} show="ins" />
                </section>
              </div>
              <Segmented
                legend={`${label}: which to keep`}
                hideLegend
                size="sm"
                value={pick}
                onChange={(value) => setPicks((now) => now.map((p, j) => (j === at ? value : p)))}
                options={options}
              />
            </li>
          );
        })}
      </ol>
      <div className="cap-merge-actions">
        <Button variant="primary" pending={pending} onClick={() => onApply(picks)}>
          {l.apply}
        </Button>
      </div>
    </div>
  );
}
