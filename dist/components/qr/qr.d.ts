export declare function qrPath(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet?: number): string;
export declare function qrSize(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet?: number): number;
export declare function qrLabel(url: string): string;
/** Refuses anything but an absolute http(s) address: a code a reader scans opens a page. */
export declare function checkQrUrl(url: string): string;
