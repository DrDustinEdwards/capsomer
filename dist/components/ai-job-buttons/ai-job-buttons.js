// The AI job buttons' words: which engine a job ran on, and the button that runs it again on the
// other one. The deciding (which engine a job uses, falling back, the cap) is site-runtime's
// ai-engine; these only say what came of a run.
export const ENGINE_NAME = {
    api: "the API",
    subscription: "the subscription",
};
// The engine a retry runs on: the other one. A run with no engine (refused before it started)
// retries on the API, which answers at once.
export function otherEngine(engine) {
    return engine === "api" ? "subscription" : "api";
}
// "Run it on the subscription": offered after a run that said something, so a refused or slow
// run can go the other way without a trip to the settings.
export function retryLabel(engine, names = ENGINE_NAME) {
    return `Run it on ${names[otherEngine(engine)]}`;
}
export function canRetry(answer) {
    return Boolean(answer?.job && (answer.error || answer.message));
}
