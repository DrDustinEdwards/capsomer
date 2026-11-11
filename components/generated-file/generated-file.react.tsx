import type { ReactNode } from "react";
import { Panel } from "../panel/panel.react.tsx";
import { Status, type Tone } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import {
  STATE_WORDS,
  fileMeta,
  fileState,
  type GeneratedRecord,
  type GeneratedState,
} from "./generated-file.ts";

const TONES: Record<GeneratedState, Tone> = {
  none: "nodata",
  generating: "info",
  ready: "ok",
  stale: "warn",
  failed: "crit",
};

export interface GeneratedFileFormProps {
  className: string;
  children: ReactNode;
}

export interface GeneratedFileProps {
  // The panel's heading: "Program PDF".
  title: ReactNode;
  // What the file is made from and how long a run takes.
  description?: ReactNode;
  // What the store recorded; null when nothing has run.
  record: GeneratedRecord | null | undefined;
  // A fixed now, for a report or a test.
  now?: number;
  // How long a run holds the lock (default LOCK_MS, 5 minutes).
  lockMs?: number;
  // The file's format, said beside the link with its size: "PDF".
  format?: string;
  downloadHref: string;
  downloadLabel?: string;
  // The button's words before a first run, and after.
  generateLabel?: string;
  regenerateLabel?: string;
  // The form: its action and hidden fields ({ intent: "document-generate" }), or a router's
  // Form drawn by renderForm, which is given the class and the button.
  action?: string;
  fields?: Record<string, string>;
  renderForm?: (props: GeneratedFileFormProps) => ReactNode;
  // The form is being sent: the button says so and takes no second press.
  busy?: boolean;
  // The sentence after a state's word, in the app's own words, in place of the default.
  messages?: Partial<Record<GeneratedState, ReactNode>>;
  level?: 2 | 3;
  // More of the file's actions, after Generate: Publish to the archive.
  children?: ReactNode;
}

function sentence(
  state: GeneratedState,
  view: ReturnType<typeof fileState>,
  messages: GeneratedFileProps["messages"],
): ReactNode {
  const own = messages?.[state];
  if (own != null) return own;
  const made = view.generatedAt !== null ? <Time at={view.generatedAt} format="exact" /> : null;
  switch (state) {
    case "none":
      return "Nothing has been generated yet.";
    case "generating":
      return view.hasFile
        ? "This can take a minute. The current file stays available until the new one is ready; refresh to see it."
        : "This can take a minute; refresh to see the result.";
    case "ready":
      return made ? <>Made {made}.</> : "Made and stored.";
    case "stale":
      return made ? (
        <>Made {made}, before the latest changes. Regenerate it to include them.</>
      ) : (
        "Made before the latest changes. Regenerate it to include them."
      );
    case "failed":
      return `${view.reason ?? "The last run failed."} Try again.`;
  }
}

const plainForm =
  (action: string | undefined) =>
  ({ className, children }: GeneratedFileFormProps) => (
    <form method="post" action={action} className={className}>
      {children}
    </form>
  );

// The HTML contract in generated-file.md: a panel with the state's word and sentence, the
// download link with its format and size, and the Generate or Regenerate button.
export function GeneratedFile({
  title,
  description,
  record,
  now,
  lockMs,
  format = "PDF",
  downloadHref,
  downloadLabel = `Download the ${format}`,
  generateLabel = `Generate the ${format}`,
  regenerateLabel = `Regenerate the ${format}`,
  action,
  fields,
  renderForm,
  busy = false,
  messages,
  level = 2,
  children,
}: GeneratedFileProps) {
  const view = fileState(record, now, lockMs);
  const { state } = view;
  const running = state === "generating" || busy;
  const label = state === "none" ? generateLabel : regenerateLabel;
  const form = renderForm ?? plainForm(action);
  return (
    <Panel
      title={title}
      level={level}
      description={description}
      className="cap-generated"
      footer={
        <div className="cap-generated-actions">
          {form({
            className: "cap-generated-form",
            children: (
              <>
                {Object.entries(fields ?? {}).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <button
                  type="submit"
                  className="cap-btn"
                  data-variant={state === "ready" ? undefined : "primary"}
                  disabled={running}
                  aria-busy={running ? true : undefined}
                >
                  {running ? "Generating" : label}
                </button>
              </>
            ),
          })}
          {children}
        </div>
      }
    >
      <div className="cap-generated-body" data-state={state}>
        <p className="cap-generated-status" role="status">
          <Status tone={TONES[state]} running={state === "generating"}>
            {STATE_WORDS[state]}
          </Status>{" "}
          <span className="cap-generated-says">{sentence(state, view, messages)}</span>
        </p>
        {view.hasFile && (
          <p className="cap-generated-file">
            <a href={downloadHref} data-link="file" download>
              {downloadLabel}
            </a>{" "}
            <span className="cap-link-meta">{fileMeta(format, view.bytes)}</span>
          </p>
        )}
      </div>
    </Panel>
  );
}
