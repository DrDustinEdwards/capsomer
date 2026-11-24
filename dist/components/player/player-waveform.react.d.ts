export interface WaveformProps {
    peaks: readonly number[] | null | undefined;
    position: number;
    duration: number;
    region?: [number, number] | null;
    onSeek: (share: number) => void;
    bars?: number;
    previewLabel?: string;
}
export declare function Waveform({ peaks, position, duration, region, onSeek, bars, previewLabel, }: WaveformProps): import("react").JSX.Element;
export interface WaveformPreviewProps {
    peaks: readonly number[];
    markers?: readonly number[];
    label?: string;
    empty?: string;
    bars?: number;
}
export declare function WaveformPreview({ peaks, markers, label, empty, bars, }: WaveformPreviewProps): import("react").JSX.Element;
