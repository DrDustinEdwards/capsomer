export interface SortMove {
    id: string;
    from: number;
    to: number;
}
export declare function moveId(order: readonly string[], id: string, to: number): string[];
export interface Box {
    top: number;
    left: number;
    width: number;
    height: number;
}
export declare function indexAtPoint(others: readonly Box[], x: number, y: number, layout?: Layout): number;
export type Layout = "rows" | "cards" | "stack";
export type Lists = Record<string, string[]>;
export declare function locate(lists: Lists, id: string): {
    list: string;
    index: number;
} | null;
export declare function moveBetween(lists: Lists, id: string, toList: string, to: number): Lists;
export declare function keyMove(key: string, at: {
    list: number;
    index: number;
}, sizes: readonly number[]): {
    list: number;
    index: number;
} | null;
export declare const sortText: {
    help: string;
    lift: (label: string, pos: number, count: number) => string;
    over: (label: string, pos: number, count: number) => string;
    drop: (label: string, pos: number, count: number, moved: boolean) => string;
    cancel: (label: string, pos: number, count: number) => string;
    step: (label: string, pos: number, count: number) => string;
    moveTo: (label: string, list: string, pos: number, count: number) => string;
    removed: (label: string, left: number) => string;
    added: (label: string, count: number) => string;
};
export type SortMessages = typeof sortText;
export declare function keyTarget(key: string, index: number, count: number): number | null;
