import { type GateHold, type GatePublished } from "./publish-gate-model.ts";
import { FIRST_PUBLICATION_NOTE } from "./publish-transition.ts";
export { checkState, sortChecks, gateState, appliesTo, siteState, worstState, countChecks, requiredHeading, advisoryHeading, passedHeading, holdText, nameList, stateWord, describeGate, siteDetail, } from "./publish-gate-model.ts";
export type { GateState, CheckState, GateCheck, GateHold, GatePublished, GateSite, GateCounts, GateReading, } from "./publish-gate-model.ts";
export { FIRST_PUBLICATION_NOTE };
export { TONE, readCheck, readSite, stateStatus } from "./publish-gate-rows.ts";
export interface GateHooks {
    publish?: (siteIds: string[]) => Promise<void>;
    unpublish?: (siteIds: string[]) => Promise<void>;
}
export interface GateHandle {
    refresh(): void;
    setCheck(id: string, patch: {
        ok: boolean;
        cause?: string;
    }): void;
    setHold(siteId: string, hold: GateHold | null): void;
    setPublished(siteId: string, published: GatePublished | null): void;
    detach(): void;
}
export declare function attachPublishGate(region: HTMLElement, hooks?: GateHooks): GateHandle;
export declare function enhance(root?: ParentNode, hooks?: GateHooks): () => void;
