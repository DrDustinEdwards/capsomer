export type PermView = "agent" | "permission";
export interface PermAgent {
    name: string;
    holds: readonly string[];
}
export interface PermMatrix {
    permissions: readonly string[];
    agents: readonly PermAgent[];
}
export interface Holding {
    agent: string;
    held: string[];
    text: string;
}
export interface Holders {
    permission: string;
    agents: string[];
    text: string;
}
export declare function holdings(m: PermMatrix): Holding[];
export declare function holders(m: PermMatrix): Holders[];
export declare function showView(root: HTMLElement, view: PermView): void;
export declare function enhance(root?: ParentNode): () => void;
