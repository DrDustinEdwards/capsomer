import { setSwitch } from "../switch/switch.ts";
export { setSwitch };
export declare const EVENT = "cap:switch-applied";
export declare const MISSING = "Type a reason. It is recorded with the change.";
export interface SwitchAppliedDetail {
    checked: boolean;
    reason: string;
    waitUntil(promise: Promise<unknown>): void;
}
export declare function verbFor(name: string, checked: boolean): string;
export declare function reasonLabel(verb: string): string;
export declare function failedMessage(name: string, checked: boolean, err: unknown): string;
export declare function enhance(root?: ParentNode): () => void;
