export type PatchOp = "same" | "ins" | "del";
export interface PatchLine {
    op: PatchOp;
    text: string;
    oldNo: number | null;
    newNo: number | null;
    noEol?: boolean;
}
export interface PatchHunk {
    header: string;
    context: string;
    lines: PatchLine[];
}
export interface PatchFile {
    oldPath: string;
    newPath: string;
    hunks: PatchHunk[];
    note?: string;
    added: number;
    removed: number;
}
export declare function parsePatch(patch: string): PatchFile[];
export interface PatchOptions {
    id?: string;
    title?: string;
}
export interface PatchCounts {
    files: number;
    added: number;
    removed: number;
}
export declare function patchCounts(files: readonly PatchFile[]): PatchCounts;
export declare function patchCountsText(c: PatchCounts): string;
export declare function revisionPair(oldPath: string, newPath: string): {
    name: string;
    from: string;
    to: string;
} | null;
export declare function renderPatch(patch: string, options?: PatchOptions): string;
