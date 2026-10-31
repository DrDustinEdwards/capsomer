import { type ReactNode } from "react";
import { type SayOptions } from "../message/message.ts";
import { type GateCheck, type GateSite, type GateState } from "./publish-gate.ts";
export type { GateCheck, GateHold, GatePublished, GateSite, GateState } from "./publish-gate.ts";
export interface PublishButtonProps {
    gateId: string;
    site: GateSite;
    state: GateState;
    busy?: boolean;
    summaryId: string;
    named?: boolean;
    size?: "sm" | "default";
    onPublish: () => void;
    onUnpublish: () => void;
}
export declare function PublishButton({ gateId, site, state, busy, summaryId, named, size, onPublish, onUnpublish }: PublishButtonProps): import("react").JSX.Element;
export declare function publishWithPreview(site: GateSite, perform: () => Promise<void>): Promise<void>;
export interface PublishGateProps {
    label: ReactNode;
    sites: GateSite[];
    checks: GateCheck[];
    publish?: (siteIds: string[]) => Promise<void>;
    unpublish?: (siteIds: string[]) => Promise<void>;
    actions?: "rows" | "none";
    say?: (text: string, opts?: SayOptions) => void;
    fail?: (text: string) => void;
    primary?: boolean;
    id?: string;
    summaryId?: string;
}
export declare function PublishGate({ label, sites, checks, publish, unpublish, actions, say, fail, primary, id, summaryId }: PublishGateProps): import("react").JSX.Element;
export declare function gateStates(sites: GateSite[], checks: GateCheck[]): {
    overall: GateState;
    sites: Record<string, GateState>;
};
