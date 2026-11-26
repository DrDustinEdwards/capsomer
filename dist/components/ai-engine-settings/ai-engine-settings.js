// The AI engine settings' words and form: which engine runs each job (subscription, API, or Automatic:
// subscription first, API when refused), the API's model and effort, and the month's cap on API spend. The
// shape is site-runtime's ai-engine (EngineSettings), written out here so Capsomer needs no site-runtime.
export const ENGINE_OPTIONS = [
    { value: "auto", label: "Automatic: subscription, the API when it is refused" },
    { value: "subscription", label: "Subscription" },
    { value: "api", label: "API" },
];
export function dollars(micros) {
    return `$${(micros / 1_000_000).toFixed(micros < 10_000 ? 4 : 2)}`;
}
export function engineWord(value) {
    const label = ENGINE_OPTIONS.find((e) => e.value === value)?.label ?? value;
    return label.split(":")[0];
}
// The settings a saved form holds: master, feature-<key>, model-<key> and effort-<key> for each job
// (empty is "follow everything" and "the job's own default"), and cap in dollars. The override is not in the
// form; the app keeps the one it has. An empty cap or 0 is "no cap"; a cap that is not a number of dollars, 0 or more
// throws a RangeError, so a malformed value never switches the cap off.
export function settingsFromForm(get, jobs) {
    const features = {};
    const models = {};
    const efforts = {};
    for (const j of jobs) {
        const f = String(get(`feature-${j.key}`) ?? "");
        if (f)
            features[j.key] = f;
        const m = String(get(`model-${j.key}`) ?? "");
        if (m)
            models[j.key] = m;
        const e = String(get(`effort-${j.key}`) ?? "");
        if (e)
            efforts[j.key] = e;
    }
    const cap = Number(get("cap") || 0);
    if (!Number.isFinite(cap) || cap < 0)
        throw new RangeError("The spend cap is a number of dollars, 0 or more.");
    return {
        master: String(get("master") || "auto"),
        features,
        models,
        efforts,
        apiCapMicros: Math.round(cap * 1_000_000),
    };
}
