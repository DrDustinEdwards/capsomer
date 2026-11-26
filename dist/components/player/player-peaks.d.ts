export declare const PEAKS_LENGTH = 400;
export declare const WAVEFORM_BARS = 120;
export declare function computePeaks(channels: Float32Array[], n?: number): number[];
export declare function decodePeaks(source: ArrayBuffer, n?: number): Promise<{
    peaks: number[];
    duration: number;
} | null>;
export declare function probeDuration(file: Blob): Promise<number | null>;
export declare function normalizePeaks(peaks: readonly number[] | null | undefined, bars?: number): number[] | null;
export declare function syntheticPeaks(bars?: number): number[];
