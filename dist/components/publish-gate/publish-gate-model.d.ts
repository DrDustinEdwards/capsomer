export type GateState = "blocked" | "held" | "ready" | "published";
export type CheckState = "failing" | "advisory" | "passed";
export interface GateCheck {
    id: string;
    name: string;
    required: boolean;
    ok: boolean;
    cause: string;
    pass?: string;
    href?: string;
    fix?: string;
    site?: string;
}
export interface GateHold {
    by?: string;
    reason?: string;
    until?: string;
    untilLabel?: string;
    note?: string;
    text?: string;
}
export interface GatePublished {
    at: string;
    url: string;
}
export interface GateSite {
    id: string;
    name: string;
    hold?: GateHold | null;
    published?: GatePublished | null;
    first?: boolean;
}
export declare function checkState(c: Pick<GateCheck, "ok" | "required">): CheckState;
export declare function sortChecks<T extends Pick<GateCheck, "ok" | "required">>(checks: readonly T[]): T[];
export declare function gateState(checks: readonly Pick<GateCheck, "ok" | "required">[], hold?: GateHold | null): Exclude<GateState, "published">;
export declare function appliesTo(check: Pick<GateCheck, "site">, siteId: string): boolean;
export declare function siteState(site: Pick<GateSite, "id" | "hold" | "published">, checks: readonly GateCheck[]): GateState;
export declare function worstState(states: readonly GateState[]): GateState;
export interface GateCounts {
    requiredFailing: number;
    advisoryFailing: number;
    passed: number;
    total: number;
}
export declare function countChecks(checks: readonly Pick<GateCheck, "ok" | "required">[]): GateCounts;
export declare const requiredHeading: (n: number) => string;
export declare const advisoryHeading: (n: number) => string;
export declare const passedHeading: (n: number) => string;
export declare function holdText(h: GateHold): string;
export declare function nameList(names: readonly string[]): string;
export declare const WORD: Record<GateState, string>;
export declare const stateWord: (s: GateState) => string;
export interface GateReading {
    sites: Array<{
        site: GateSite;
        state: GateState;
        failing: GateCheck[];
    }>;
    state: GateState;
    rest: string;
}
export declare function describeGate(sites: readonly GateSite[], checks: readonly GateCheck[]): GateReading;
export declare function siteDetail(state: GateState, failing: readonly GateCheck[], advisory: number, site: Pick<GateSite, "hold">): string;
