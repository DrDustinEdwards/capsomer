// The AI engine settings' words and form: which engine runs each job (the subscription, the API, or
// Automatic: the subscription first and the API when it is refused), the model and effort the API
// uses for it, and the month's cap on API spend. The settings' shape is site-runtime's ai-engine
// (EngineSettings), written out here so Capsomer needs no site-runtime to draw them.
export const ENGINE_OPTIONS = [
    { value: "auto", label: "Automatic: subscription, the API when it is refused" },
    { value: "subscription", label: "Subscription" },
    { value: "api", label: "API" },
];
// "$0.0042" under a cent, "$12.40" above.
export function dollars(micros) {
    return `$${(micros / 1_000_000).toFixed(micros < 10_000 ? 4 : 2)}`;
}
// The short name of an engine setting, for "Follow everything (Automatic)".
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
