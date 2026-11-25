// Chart builder: a dialog that builds a chart block from CSV, a type and columns, previews it, lists what the app's chart check flags,
// and inserts the block through `onInsert`. A drafted finding goes in only when taken.

import { useCleanId } from "../hooks/hooks.react.tsx";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { ChartFrame, type ChartFit } from "../chart-frame/chart-frame.react.tsx";
import { errorText } from "../dialog/dialog.ts";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog.react.tsx";
import { validateFiles } from "../drop-zone/drop-zone.ts";
import { Check, Field } from "../field/field.react.tsx";
import { Segmented } from "../segmented/segmented.react.tsx";
import { Select } from "../select/select.react.tsx";
import { csvColumns } from "@drdustinedwards/site-helpers/source";
import {
  CHART_TYPES,
  MAX_CSV_BYTES,
  chartDirective,
  chartReady,
  chooseColumns,
  type ChartFields,
  type ChartType,
  type CsvColumn,
} from "./chart-builder.ts";

export interface ChartCheck {
  findings: Array<{ message: string }>;
  suggestion?: string | null;
}

export interface ChartBuilderProps {
  onInsert: (block: string) => void;
  types?: readonly ChartType[];
  write?: (fields: ChartFields) => string;
  check?: (block: string, drawable: string) => Promise<ChartCheck>;
  draw?: (fields: ChartFields, width: number, fit: ChartFit) => string;
  preview?: { action: string; name?: string; source?: (block: string) => string };
  maxBytes?: number;
  initial?: Partial<ChartFields>;
  label?: ReactNode;
  buttonVariant?: "default" | "quiet" | "secondary";
  buttonSize?: "xs" | "sm" | "default";
}

const NOT_READY = "Add the data, pick the columns and write the finding first.";

const blank = (type: string): ChartFields => ({
  type,
  x: "",
  y: [],
  title: "",
  alt: "",
  caption: "",
  csv: "",
});

export function ChartBuilder({
  onInsert,
  types = CHART_TYPES,
  write = chartDirective,
  check,
  draw,
  preview,
  maxBytes = MAX_CSV_BYTES,
  initial,
  label = "Insert chart",
  buttonVariant = "quiet",
  buttonSize = "sm",
}: ChartBuilderProps) {
  const [open, setOpen] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const start = (): ChartFields => ({ ...blank(types[0]?.value ?? "bar"), ...initial });
  const [f, setF] = useState<ChartFields>(start);
  const [fileError, setFileError] = useState("");
  const [checked, setChecked] = useState<({ block: string; error?: string } & ChartCheck) | null>(
    null,
  );
  const [previewed, setPreviewed] = useState(false);
  const id = useCleanId();
  const frame = `cap-chart-preview-${id}`;
  const titleId = `cap-chart-builder-${id}`;
  const set = (patch: Partial<ChartFields>) => setF((cur) => ({ ...cur, ...patch }));

  const columns = useMemo(() => csvColumns(f.csv), [f.csv]);
  // A new header picks the columns again, adjusted while rendering, not in an effect; `null` at first so `initial` columns are chosen on first render.
  const [seen, setSeen] = useState<readonly CsvColumn[] | null>(null);
  if (columns !== seen) {
    setSeen(columns);
    setF((cur) => ({ ...cur, ...chooseColumns(columns, cur) }));
  }

  const ready = chartReady(f);
  const block = ready ? write(f) : "";
  const drawable = ready ? write({ ...f, alt: f.alt.trim() || "Draft." }) : "";
  const final = ready && f.alt.trim() ? block : "";

  useEffect(() => {
    if (!block || !check) return;
    let live = true;
    const timer = setTimeout(() => {
      void check(block, drawable).then(
        (result) => live && setChecked({ block, ...result }),
        (error: unknown) => live && setChecked({ block, findings: [], error: errorText(error) }),
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [block, drawable, check]);
  const current = block && checked?.block === block ? checked : null;

  const drawFields = final ? f : null;
  const drawChart = useCallback(
    (width: number, fit: ChartFit) => (drawFields && draw ? draw(drawFields, width, fit) : ""),
    // oxlint-disable-next-line react/exhaustive-deps -- `final` stands for the fields it is written from
    [final, draw],
  );

  const close = () => {
    setOpen(false);
    setPreviewed(false);
  };

  async function readFile(file: File | undefined) {
    setFileError("");
    if (!file) return;
    const problem = validateFiles([file], { accept: ".csv,text/csv", maxBytes }).rejected[0];
    if (problem) return setFileError(problem.message);
    try {
      set({ csv: await file.text() });
    } catch (error) {
      setFileError(errorText(error));
    }
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        aria-haspopup="dialog"
        onClick={(event) => {
          setOpener(event.currentTarget);
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && close()}
        placement="center"
        size="lg"
        returnTo={opener}
        aria-labelledby={titleId}
      >
        <DialogHeader divider>
          <DialogTitle id={titleId}>Insert a chart</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="cap-chart-builder">
            <Segmented
              legend="Chart type"
              size="sm"
              value={f.type}
              onChange={(type) => set({ type })}
              options={types.map((t) => ({ value: t.value, label: t.label }))}
            />
            <Field label="Data, as CSV" required>
              <textarea
                className="cap-input cap-chart-builder-csv"
                rows={6}
                spellCheck={false}
                value={f.csv}
                onChange={(e) => set({ csv: e.target.value })}
                placeholder={"year,visits\n2024,1204\n2025,1530"}
              />
            </Field>
            <Field label="Or choose a CSV file" error={fileError || undefined}>
              <input
                className="cap-input"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const input = e.target;
                  // Cleared after reading, so the same file chosen again is a change.
                  void readFile(input.files?.[0]).then(() => (input.value = ""));
                }}
              />
            </Field>
            {columns.length >= 2 ? (
              <>
                <Field label="Along the bottom (x)" required>
                  <Select
                    size="sm"
                    value={f.x}
                    onChange={(e) => set({ x: e.target.value })}
                    options={columns.map((c) => ({ value: c.name, label: c.name }))}
                  />
                </Field>
                <fieldset className="cap-chart-builder-y">
                  <legend>Measured (y), one series each</legend>
                  {columns
                    .filter((c) => c.name !== f.x)
                    .map((c) => (
                      <Check
                        key={c.name}
                        label={c.numeric ? c.name : `${c.name} (not all numbers)`}
                        checked={f.y.includes(c.name)}
                        onChange={(e) =>
                          set({
                            y: e.target.checked
                              ? [...f.y, c.name]
                              : f.y.filter((n) => n !== c.name),
                          })
                        }
                      />
                    ))}
                </fieldset>
              </>
            ) : f.csv.trim() ? (
              <p className="cap-chart-builder-note">
                The data needs a header line and at least two columns.
              </p>
            ) : null}
            <Field label="Title">
              <input
                className="cap-input"
                value={f.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </Field>
            <Field
              label="Finding"
              required
              help="What the reader should see in it, in a sentence. It is shown under the title and read out in place of the chart."
            >
              <textarea
                className="cap-input"
                rows={2}
                value={f.alt}
                onChange={(e) => set({ alt: e.target.value })}
              />
            </Field>
            {current?.suggestion ? (
              <div
                className="cap-chart-builder-suggestion"
                role="group"
                aria-label="Suggested finding"
              >
                <p className="cap-chart-builder-note">
                  Drafted from the data: <q>{current.suggestion}</q>
                </p>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => set({ alt: current.suggestion ?? "" })}
                >
                  Use as the finding
                </Button>
              </div>
            ) : null}
            <Field label="Caption" help="Optional. Shown under the chart.">
              <input
                className="cap-input"
                value={f.caption}
                onChange={(e) => set({ caption: e.target.value })}
              />
            </Field>
            {current?.error ? (
              <Alert tone="warn" title="The chart check did not run">
                {current.error}
              </Alert>
            ) : null}
            {check ? (
              <div role="status" className="cap-chart-builder-check">
                {current?.error ? null : current?.findings.length ? (
                  <>
                    <p className="cap-chart-builder-note">The chart check flags:</p>
                    <ul className="cap-chart-builder-findings">
                      {current.findings.map((x, i) => (
                        <li key={i}>{x.message}</li>
                      ))}
                    </ul>
                  </>
                ) : current ? (
                  <p className="cap-chart-builder-note">The chart check flags nothing.</p>
                ) : null}
              </div>
            ) : null}
            {draw && final ? (
              <section className="cap-chart-builder-drawn" aria-label="The chart as it will look">
                <ChartFrame draw={drawChart} />
              </section>
            ) : null}
            {preview ? (
              <>
                <form
                  method="post"
                  action={preview.action}
                  target={frame}
                  onSubmit={() => setPreviewed(true)}
                >
                  <input
                    type="hidden"
                    name={preview.name ?? "source"}
                    value={final ? (preview.source ?? ((b: string) => b))(final) : ""}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="quiet"
                    disabledReason={final ? undefined : NOT_READY}
                  >
                    Preview as the site shows it
                  </Button>
                </form>
                {/* Sandboxed with no permissions: the site's page runs no script and has an opaque origin. */}
                <iframe
                  className="cap-chart-builder-preview"
                  name={frame}
                  title="The chart as the site renders it"
                  sandbox=""
                  hidden={!previewed}
                />
              </>
            ) : null}
          </div>
        </DialogBody>
        <DialogFooter align="between">
          <DialogClose part="cancel">Cancel</DialogClose>
          <Button
            variant="primary"
            disabledReason={final ? undefined : NOT_READY}
            onClick={() => {
              onInsert(final);
              setF(start());
              setFileError("");
              close();
            }}
          >
            Insert chart
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export type { ChartFields, ChartType, CsvColumn } from "./chart-builder.ts";
export { CHART_TYPES, chartDirective } from "./chart-builder.ts";
