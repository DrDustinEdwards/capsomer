import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  // false: the page names the sides itself (renderCompare's heads).
  heads?: boolean;
}

// Renders exactly the markup renderCompare writes, so a server render (renderToString) and the
// browser agree, and the same behavior module wires it.
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
  const own = useId().replace(/[^a-zA-Z0-9]/g, "");
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
  // A unified git patch (git diff, git show, git format-patch).
  patch: string;
  // What the patch is of; names the region.
  title?: string;
  // Give each patch on a page its own id. Made up when left out.
  id?: string;
}

// The patch mode: a unified patch by line, with a literal plus or minus on each changed line.
// Pure markup, so a server render and the browser agree; there is no behavior to attach.
export function DraftPatch({ patch, title, id }: DraftPatchProps) {
  const own = useId().replace(/[^a-zA-Z0-9]/g, "");
  const html = useMemo(
    () => renderPatch(patch, { id: id ?? `patch-${own}`, title }),
    [patch, title, id, own],
  );
  return <div dangerouslySetInnerHTML={markup(html)} />;
}

export interface MergeLabels {
  // The two sides' headings: whose text each is.
  mine: string;
  theirs: string;
  // The three picks.
  keepMine: string;
  keepTheirs: string;
  keepBoth: string;
  // A side with no passage at this difference.
  notInMine: string;
  notInTheirs: string;
  // After a heading, when only that side changed the passage since the base.
  changedMine: string;
  changedTheirs: string;
  // After a heading, when the pick leaves that side out.
  leftOut: string;
  // The intro, then the sentence for a plan with a base, or without one.
  intro: string;
  withBase: string;
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
  intro:
    "Choose which text to keep for each difference, then use the merged text and save as usual. The unsaved text stays exactly as it is until then.",
  withBase: "Where only one side changed a passage, that side is already chosen.",
  withoutBase: "The version both started from could not be read, so each starts on yours.",
  apply: "Use the merged text",
};

/** "3 differences, 1 changed on both": for the heading or panel the merge sits in. */
export function mergeCountsText(plan: MergePlan): string {
  const choices = choicesOf(plan);
  const both = choices.filter((c) => c.changedBy === null).length;
  const n = `${choices.length} ${choices.length === 1 ? "difference" : "differences"}`;
  return plan.hasBase ? `${n}, ${both} changed on both` : n;
}

export interface DraftMergeProps {
  plan: MergePlan;
  // Applies the picks, one per difference in order (merged(plan, picks) is the text).
  onApply: (picks: MergePick[]) => void;
  // The apply is in flight.
  pending?: boolean;
  labels?: Partial<MergeLabels>;
  // The side headings' level, under the section the merge sits in.
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

// The merge mode: give it a plan (mergePlan, on the server or here) and it holds the picks.
// Key it by the plan's identity, so a new plan starts on its own picks.
export function DraftMerge({ plan, onApply, pending = false, labels, level = 3 }: DraftMergeProps) {
  const l = { ...MERGE_LABELS, ...labels };
  const [picks, setPicks] = useState<MergePick[]>(() => startPicks(plan));
  const H = `h${level}` as const;
  // Each choice's place among the choices, by its segment's place in the plan.
  const order = plan.segments.map(
    (_, i) => plan.segments.slice(0, i + 1).filter((x) => x.kind === "choice").length - 1,
  );
  return (
    <div className="cap-merge">
      <p className="cap-merge-intro">
        {l.intro} {plan.hasBase ? l.withBase : l.withoutBase}
      </p>
      <ol className="cap-merge-list">
        {plan.segments.map((s, i) => {
          if (s.kind === "same") {
            return (
              <li key={i} className="cap-merge-same">
                {s.blocks.length} {s.blocks.length === 1 ? "passage" : "passages"} the same on both
              </li>
            );
          }
          const at = order[i]!;
          const pick = picks[at] ?? s.start;
          const label = `Difference ${at + 1}`;
          const options: Array<SegmentedOption<MergePick>> = [
            { value: "mine", label: l.keepMine },
            { value: "theirs", label: l.keepTheirs },
            // Keeping both needs a passage on each side.
            {
              value: "both",
              label: l.keepBoth,
              disabled: s.mine.length === 0 || s.theirs.length === 0,
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
