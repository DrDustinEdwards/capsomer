// The AI job buttons' words: which engine a job ran on, and the button that runs it again on the
// other one. Which engine a job uses is site-runtime's ai-engine; these only say what came of a run.

export type JobEngine = "api" | "subscription";

export interface AiJobAnswer {
  job?: string;
  engine?: JobEngine | null;
  message?: string;
  error?: string;
  href?: string | null;
}

export const ENGINE_NAME: Record<JobEngine, string> = {
  api: "the API",
  subscription: "the subscription",
};

// The engine a retry runs on: the other one. A run with no engine (refused before it started) retries on the API.
export function otherEngine(engine: JobEngine | null | undefined): JobEngine {
  return engine === "api" ? "subscription" : "api";
}

// Offered after a run that said something, so a refused or slow run can go the other way.
export function retryLabel(engine: JobEngine | null | undefined, names = ENGINE_NAME): string {
  return `Run it on ${names[otherEngine(engine)]}`;
}

export function canRetry(answer: AiJobAnswer | null | undefined): boolean {
  return Boolean(answer?.job && (answer.error || answer.message));
}
