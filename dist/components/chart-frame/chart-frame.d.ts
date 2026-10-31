export interface FrameOptions {
    inline?: boolean;
    after?: string;
}
export declare function frameHtml(chart: string, o?: FrameOptions): string;
export declare function noDataHtml(title: string, reason: string): string;
