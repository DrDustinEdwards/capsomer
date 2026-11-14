// The AI engine settings' words and form: which engine runs each job (the subscription, the API, or
// Automatic: the subscription first and the API when it is refused), the model and effort the API
// uses for it, and the month's cap on API spend. The settings' shape is site-runtime's ai-engine
// (EngineSettings), written out here so Capsomer needs no site-runtime to draw them.

export type Engine = "subscription" | "api" | "auto";

export interface EngineSettingsLike {
  // An Engine, or whatever the site stored.
  master: string;
  features: Record<string, string>;
  override: { engine: string; until: string } | null;
  // Millionths of a dollar. 0: no cap.
  apiCapMicros: number;
}

export interface EngineJob {
  // Posted in the field names: feature-<key>, model-<key>, effort-<key>.
  key: string;
  label: string;
  // What each engine does for this job, in a sentence.
  note?: string;
}

export const ENGINE_OPTIONS: ReadonlyArray<{ value: Engine; label: string }> = [
  { value: "auto", label: "Automatic: subscription, the API when it is refused" },
  { value: "subscription", label: "Subscription" },
  { value: "api", label: "API" },
];

// "$0.0042" under a cent, "$12.40" above.
export function dollars(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(micros < 10_000 ? 4 : 2)}`;
}

// The short name of an engine setting, for "Follow everything (Automatic)".
export function engineWord(value: string): string {
  const label = ENGINE_OPTIONS.find((e) => e.value === value)?.label ?? value;
  return label.split(":")[0]!;
}

// The settings a saved form holds: master, feature-<key>, model-<key> and effort-<key> for each job
// (empty is "follow everything" and "the job's own default"), and cap in dollars. The override is not in the
// form; the app keeps the one it has.
export function settingsFromForm(
  get: (name: string) => unknown,
  jobs: readonly Pick<EngineJob, "key">[],
): {
  master: string;
  features: Record<string, string>;
  models: Record<string, string>;
  efforts: Record<string, string>;
  apiCapMicros: number;
} {
  const features: Record<string, string> = {};
  const models: Record<string, string> = {};
  const efforts: Record<string, string> = {};
  for (const j of jobs) {
    const f = String(get(`feature-${j.key}`) ?? "");
    if (f) features[j.key] = f;
    const m = String(get(`model-${j.key}`) ?? "");
    if (m) models[j.key] = m;
    const e = String(get(`effort-${j.key}`) ?? "");
    if (e) efforts[j.key] = e;
  }
  const cap = Number(get("cap") || 0);
  return {
    master: String(get("master") || "auto"),
    features,
    models,
    efforts,
    apiCapMicros: Number.isFinite(cap) && cap > 0 ? Math.round(cap * 1_000_000) : 0,
  };
}
