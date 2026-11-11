import { useId, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { Field } from "../field/field.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { Row, RowList } from "../row-list/row-list.react.tsx";
import { Select, type SelectOption } from "../select/select.react.tsx";
import { Status } from "../status/status.react.tsx";
import {
  ENGINE_OPTIONS,
  dollars,
  engineWord,
  type EngineJob,
  type EngineSettingsLike,
} from "./ai-engine-settings.ts";

export type { EngineJob, EngineSettingsLike, FormComponent };

export interface AiEngineSettingsProps {
  settings: EngineSettingsLike;
  // The model each job's API run uses: "fast", "standard", "deep", or none (left out) for the
  // job's default. A partial map, as site-runtime's settings reader returns it.
  models: Readonly<Partial<Record<string, string>>>;
  jobs: readonly EngineJob[];
  // The model choices, with their prices (from site-runtime's MODEL_IDS and PRICES). The first is
  // "The job's own default", value "".
  modelOptions: readonly SelectOption[];
  // Whether each engine can work now: the routine connected, an API key set.
  ready: { subscription: boolean; api: boolean };
  // What to do when one cannot, in a sentence.
  readyNote?: ReactNode;
  // This month's API spend, and by job.
  spentMicros: number;
  usage: ReadonlyArray<{ job: string; calls: number; micros: number }>;
  // The cap field's help, and the note under the spend, where the site has more to say.
  capHelp?: ReactNode;
  costNote?: ReactNode;
  action?: string;
  Form?: FormComponent;
  pending?: boolean;
}

// Which engine does each AI job: one table, everything then a row per job with its engine and the
// model the API uses, saved together with the month's cap on API spend; beside it, the spend.
export function AiEngineSettings({
  settings,
  models,
  jobs,
  modelOptions,
  ready,
  readyNote,
  spentMicros,
  usage,
  capHelp = "At the cap the API closes: Subscription is used instead, and Automatic stops falling back. 0 is no cap. Saved with the table.",
  costNote = "Costs are the list prices times the tokens each call used. A subscription has no meter to read here.",
  action,
  Form = PlainForm,
  pending = false,
}: AiEngineSettingsProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const formId = `${uid}-engines`;
  const until = settings.override?.until.slice(0, 10);
  const engines = ENGINE_OPTIONS.map((e) => ({ value: e.value, label: e.label }));
  return (
    <div className="cap-ai-engine" data-cap="ai-engine-settings">
      <dl className="cap-ai-engine-status" aria-label="What each engine can do now">
        <div>
          <dt>Subscription</dt>
          <dd>
            {ready.subscription ? (
              <Status tone="ok">Connected</Status>
            ) : (
              <Status tone="warn">Not connected</Status>
            )}
          </dd>
        </div>
        <div>
          <dt>API</dt>
          <dd>
            {ready.api ? <Status tone="ok">Ready</Status> : <Status tone="warn">No key</Status>}
          </dd>
        </div>
        <div>
          <dt>Running on</dt>
          <dd>
            {until ? `The API for everything until ${until}, with no cap` : "The settings below"}
          </dd>
        </div>
      </dl>
      {readyNote && (!ready.subscription || !ready.api) ? (
        <p className="cap-ai-engine-note">{readyNote}</p>
      ) : null}

      <Form method="post" action={action} id={formId}>
        <Panel
          title="Engine for each job"
          flush
          footer={
            <Button type="submit" variant="primary" pending={pending}>
              Save
            </Button>
          }
        >
          <div className="cap-table-wrap" role="region" aria-labelledby={`${uid}-cap`} tabIndex={0}>
            <table className="cap-table cap-ai-engine-table">
              <caption id={`${uid}-cap`} className="cap-sr-only">
                The engine and model for each job
              </caption>
              <thead>
                <tr>
                  <th scope="col">Job</th>
                  <th scope="col">Engine</th>
                  <th scope="col">Model when the API does it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    Everything
                    <span className="cap-ai-engine-job-note">
                      Each job follows this unless it says otherwise.
                    </span>
                  </th>
                  <td>
                    <Select
                      name="master"
                      aria-label="Engine for everything"
                      defaultValue={settings.master}
                      options={engines}
                    />
                  </td>
                  <td className="cap-muted">Each job's own</td>
                </tr>
                {jobs.map((j) => (
                  <tr key={j.key}>
                    <th scope="row">
                      {j.label}
                      {j.note ? <span className="cap-ai-engine-job-note">{j.note}</span> : null}
                    </th>
                    <td>
                      <Select
                        name={`feature-${j.key}`}
                        aria-label={`${j.label}: engine`}
                        defaultValue={settings.features[j.key] ?? ""}
                        options={[
                          {
                            value: "",
                            label: `Follow everything (${engineWord(settings.master)})`,
                          },
                          ...engines,
                        ]}
                      />
                    </td>
                    <td>
                      <Select
                        name={`model-${j.key}`}
                        aria-label={`${j.label}: model when the API does it`}
                        defaultValue={models[j.key] ?? ""}
                        options={[...modelOptions]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Form>

      <Panel title="API spend this month" src={`${dollars(spentMicros)} so far`}>
        <div className="cap-ai-engine-spend">
          <Field label="Cap a month, $" help={capHelp}>
            <input
              className="cap-input"
              name="cap"
              form={formId}
              type="number"
              min={0}
              step="0.01"
              defaultValue={(settings.apiCapMicros / 1_000_000).toFixed(2)}
            />
          </Field>
          {usage.length === 0 ? (
            <Empty kind="all-clear" flush title="Nothing spent">
              No API calls this month.
            </Empty>
          ) : (
            <RowList label="API spend by job">
              {usage.map((u) => (
                <Row
                  key={u.job}
                  title={jobs.find((j) => j.key === u.job)?.label ?? u.job}
                  detail={`${u.calls.toLocaleString("en-US")} ${u.calls === 1 ? "call" : "calls"} · ${dollars(u.micros)}`}
                />
              ))}
            </RowList>
          )}
          <p className="cap-ai-engine-note">{costNote}</p>
        </div>
      </Panel>
    </div>
  );
}
