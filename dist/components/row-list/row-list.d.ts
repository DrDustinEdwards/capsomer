import { singleKeysOff } from "../shortcuts/shortcuts.ts";
export declare function rowTargets(list: ParentNode): HTMLElement[];
export declare function moveRowFocus(list: ParentNode, step: 1 | -1): HTMLElement | null;
export declare function isTyping(e: KeyboardEvent): boolean;
export declare function isTypingKey(e: KeyboardEvent): boolean;
export { singleKeysOff };
export declare function listOwnsKeys(list: HTMLElement): boolean;
export declare function attachRowList(list: HTMLElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
