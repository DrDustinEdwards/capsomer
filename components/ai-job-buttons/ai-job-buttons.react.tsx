import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import {
  ENGINE_NAME,
  canRetry,
  otherEngine,
  retryLabel,
  type AiJobAnswer,
  type JobEngine,
} from "./ai-job-buttons.ts";

export type { AiJobAnswer, FormComponent, JobEngine };

export interface AiJobButton {
  // Posted as `job`: "continue", "edit".
  job: string;
  label: string;
}

export interface AiJobButtonsProps {
  // Where the jobs post: the route that runs them on the engine the settings name.
  action: string;
  buttons: readonly AiJobButton[];
  // Hidden fields the route needs, such as a file's path.
  fields?: Record<string, string>;
  // The form to post with: a fetcher's Form (useFetcher().Form), so the page stays where it is.
  // A plain <form> without it.
  Form?: FormComponent;
  // The route's answer to the last post (fetcher.data, or the action's data with no script).
  answer?: AiJobAnswer | null;
  // A post in flight (fetcher.state !== "idle").
  pending?: boolean;
  // The engines' names, for the retry button: "Run it on the subscription".
  engineNames?: Record<JobEngine, string>;
  // The words of the link to the result.
  openLabel?: string;
}

// A few buttons that each post one AI job, and what came of it: the message with a link to the
// draft it saved, or the error, and a button that runs the same job on the other engine.
export function AiJobButtons({
  action,
  buttons,
  fields,
  Form = PlainForm,
  answer = null,
  pending = false,
  engineNames = ENGINE_NAME,
  openLabel = "Open it",
}: AiJobButtonsProps) {
  const hidden = Object.entries(fields ?? {}).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
  return (
    <div className="cap-ai-jobs" data-cap="ai-job-buttons">
      <Form method="post" action={action} className="cap-ai-jobs-row" aria-label="AI jobs">
        {hidden}
        {buttons.map((b) => (
          <Button key={b.job} type="submit" name="job" value={b.job} size="sm" pending={pending}>
            {b.label}
          </Button>
        ))}
      </Form>
      {answer && canRetry(answer) ? (
        <Form method="post" action={action} className="cap-ai-jobs-row" aria-label="Run it again">
          {hidden}
          <input type="hidden" name="job" value={answer.job} />
          <Button
            type="submit"
            name="engine"
            value={otherEngine(answer.engine)}
            size="sm"
            pending={pending}
          >
            {retryLabel(answer.engine, engineNames)}
          </Button>
        </Form>
      ) : null}
      {answer?.error ? <Alert tone="crit">{answer.error}</Alert> : null}
      {answer?.message ? (
        <Alert tone="ok">
          {answer.message}
          {answer.href ? (
            <>
              {" "}
              <a href={answer.href}>{openLabel}</a>
            </>
          ) : null}
        </Alert>
      ) : null}
    </div>
  );
}
