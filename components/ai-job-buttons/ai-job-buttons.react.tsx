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
  job: string;
  label: string;
}

export interface AiJobButtonsProps {
  action: string;
  buttons: readonly AiJobButton[];
  fields?: Record<string, string>;
  // The form to post with: a fetcher's Form keeps the page where it is; a plain <form> without it.
  Form?: FormComponent;
  answer?: AiJobAnswer | null;
  pending?: boolean;
  engineNames?: Record<JobEngine, string>;
  openLabel?: string;
}

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
