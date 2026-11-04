export { HIDE_GRACE_MS, SHOW_DELAY_MS, place, supportsAnchor } from "../popover/popover.ts";
export declare function attach(trigger: HTMLElement, tip: HTMLElement): () => void;
export declare function showTip(trigger: HTMLElement): void;
export declare function hideTip(trigger: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
