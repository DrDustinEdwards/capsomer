// The publish gate's data and its pure helpers (publish-gate.ts).

export type GateState = "blocked" | "held" | "ready" | "published";
export type CheckState = "failing" | "advisory" | "passed";

export interface GateCheck {
  id: string;
  // The rule's name in words the operator uses: "Alt text".
  name: string;
  // Required checks block publishing; advisory ones do not.
  required: boolean;
  ok: boolean;
  // What causes it, when failing: "The cover image has no alt text".
  cause: string;
  // What it says when it passes: "Every image has alt text".
  pass?: string;
  // Where the cause is: the passage, field or setting (href="#field-alt").
  href?: string;
  // How to fix it: "Describe what the image shows."
  fix?: string;
  // The destination it concerns. Without it the check applies to every destination.
  site?: string;
}

export interface GateHold {
  // A person or a schedule holds it.
  by?: string;
  // "review", "legal check".
  reason?: string;
  // The time it is held until, ISO, and how it reads: "Fri 09:00".
  until?: string;
  untilLabel?: string;
  // Anything more the person needs to know.
  note?: string;
  // A hold read back from the page carries its sentence whole, and it wins over the parts.
  text?: string;
}

export interface GatePublished {
  // ISO.
  at: string;
  // The live page.
  url: string;
}

export interface GateSite {
  id: string;
  name: string;
  hold?: GateHold | null;
  published?: GatePublished | null;
  // It has never been public: publishing is one-way, so it is previewed first.
  first?: boolean;
}

// ---------------------------------------------------------------------------------------
// Pure helpers.

export function checkState(c: Pick<GateCheck, "ok" | "required">): CheckState {
  return c.ok ? "passed" : c.required ? "failing" : "advisory";
}

// Failing required checks first, then failing advisory ones, then the ones that pass. Stable.
export function sortChecks<T extends Pick<GateCheck, "ok" | "required">>(checks: readonly T[]): T[] {
  const rank = (c: T) => (c.ok ? 2 : c.required ? 0 : 1);
  return checks
    .map((c, i) => [c, i] as const)
    .sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j)
    .map(([c]) => c);
}

// Blocked while a required check fails; else held while someone or something holds it; else ready.
export function gateState(checks: readonly Pick<GateCheck, "ok" | "required">[], hold?: GateHold | null): Exclude<GateState, "published"> {
  if (checks.some((c) => c.required && !c.ok)) return "blocked";
  return hold ? "held" : "ready";
}

export function appliesTo(check: Pick<GateCheck, "site">, siteId: string): boolean {
  return !check.site || check.site === siteId;
}

// A destination's own state: published once published, else what its checks and hold say.
export function siteState(site: Pick<GateSite, "id" | "hold" | "published">, checks: readonly GateCheck[]): GateState {
  if (site.published) return "published";
  return gateState(checks.filter((c) => appliesTo(c, site.id)), site.hold);
}

const WORST: GateState[] = ["blocked", "held", "ready", "published"];

// The overall state is the worst of the destinations'.
export function worstState(states: readonly GateState[]): GateState {
  return WORST.find((s) => states.includes(s)) ?? "ready";
}

export interface GateCounts {
  requiredFailing: number;
  advisoryFailing: number;
  passed: number;
  total: number;
}

export function countChecks(checks: readonly Pick<GateCheck, "ok" | "required">[]): GateCounts {
  const requiredFailing = checks.filter((c) => c.required && !c.ok).length;
  const advisoryFailing = checks.filter((c) => !c.required && !c.ok).length;
  return { requiredFailing, advisoryFailing, passed: checks.length - requiredFailing - advisoryFailing, total: checks.length };
}

const plural = (n: number, one: string, many: string = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The headings: "Required, 2 failing", "Advisory, 3", "9 checks passed".
export const requiredHeading = (n: number) => `Required, ${n} failing`;
export const advisoryHeading = (n: number) => `Advisory, ${n}`;
export const passedHeading = (n: number) => `${plural(n, "check")} passed`;

// "Held for review by Rosa until Fri 09:00".
export function holdText(h: GateHold): string {
  if (h.text) return h.text;
  return `Held${h.reason ? ` for ${h.reason}` : ""}${h.by ? ` by ${h.by}` : ""}${h.untilLabel ? ` until ${h.untilLabel}` : ""}`;
}

// Names in a sentence: "a", "a and b", "a, b and c", "4 sites" beyond three.
export function nameList(names: readonly string[]): string {
  if (names.length <= 2) return names.join(" and ");
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names.length} sites`;
}

export const WORD: Record<GateState, string> = { blocked: "Blocked", held: "Held", ready: "Ready", published: "Published" };
export const stateWord = (s: GateState) => WORD[s];

export interface GateReading {
  sites: Array<{ site: GateSite; state: GateState; failing: GateCheck[] }>;
  state: GateState;
  // The words after the status word, with the colon: "Blocked" then ": 2 required checks failing on dustinedwards.info".
  rest: string;
}

// The one sentence for the whole region: "Blocked: 2 required checks failing on dustinedwards.info".
export function describeGate(sites: readonly GateSite[], checks: readonly GateCheck[]): GateReading {
  const read = sites.map((site) => ({ site, state: siteState(site, checks), failing: checks.filter((c) => appliesTo(c, site.id) && !c.ok && c.required) }));
  const state = worstState(read.map((r) => r.state));
  const of = (s: GateState) => read.filter((r) => r.state === s);
  const where = nameList(of(state).map((r) => r.site.name));
  let rest = "";
  if (state === "blocked") {
    // A check that applies to every destination is one check, however many it blocks.
    const distinct = new Set(of("blocked").flatMap((r) => r.failing.map((c) => c.id))).size;
    rest = `: ${plural(distinct, "required check")} failing on ${where}`;
  } else if (state === "held") {
    const held = of("held").map((r) => r.site);
    // "Held for review by Rosa until Fri 09:00": the word, then what the hold says.
    const said = held.length === 1 && held[0]?.hold ? holdText(held[0].hold).replace(/^Held/, "") : "";
    rest = held.length === 1 ? `${said}${sites.length > 1 ? ` on ${where}` : ""}` : `: ${where}`;
  } else if (state === "ready") {
    const adv = new Set(checks.filter((c) => !c.required && !c.ok).map((c) => c.id)).size;
    rest = `: nothing required is failing on ${where}${adv ? `, ${plural(adv, "advisory check")} failing` : ""}`;
  } else rest = `: live on ${where}`;
  return { sites: read, state, rest };
}

// The line under a destination's name.
export function siteDetail(state: GateState, failing: readonly GateCheck[], advisory: number, site: Pick<GateSite, "hold">): string {
  if (state === "blocked") return `${plural(failing.length, "required check")} failing: ${failing.map((c) => c.cause).join("; ")}`;
  if (state === "held") return `${site.hold ? holdText(site.hold) : "Held"}.${site.hold?.note ? ` ${site.hold.note}` : ""}`;
  if (state === "ready") return `Nothing required is failing.${advisory ? ` ${plural(advisory, "advisory check")} failing.` : ""}`;
  return "Live.";
}
