/** The matrix as one path, each row's runs of dark modules as rectangles, offset by the quiet zone. */
export declare function qrPath(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet?: number): string;
/** The side of the drawing in modules, quiet zone included. */
export declare function qrSize(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet?: number): number;
/** The code's name: what scanning it opens. */
export declare function qrLabel(url: string): string;
/** Refuses anything but an absolute http(s) address: a code a reader scans opens a page. */
export declare function checkQrUrl(url: string): string;
