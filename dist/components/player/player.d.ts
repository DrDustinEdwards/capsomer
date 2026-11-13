export interface PlayerChapter {
    title: string;
    start: number;
}
export interface PlayerArtwork {
    src: string;
    sizes?: string;
    type?: string;
}
export interface PlayerTrack {
    id: string | number;
    title: string;
    src: string;
    artist?: string;
    album?: string;
    artwork?: string | PlayerArtwork[];
    chapters?: PlayerChapter[];
    href?: string;
    transcript?: string;
    duration?: number;
}
export type SleepMode = "end" | number;
export declare const RATE_MIN = 0.5;
export declare const RATE_MAX = 3;
export declare const RATE_STEP = 0.05;
export declare const SPEEDS: number[];
export declare const SLEEP_MINUTES: number[];
export declare const RESUME_TAIL_SECONDS = 5;
export declare const RESUME_SAVE_SECONDS = 5;
export declare const RESTART_SECONDS = 3;
export declare const clampRate: (r: number) => number;
export declare const clampVolume: (v: number) => number;
export interface PlayerStorage {
    prefix: string;
    rate(): number | null;
    volume(): number | null;
    muted(): boolean | null;
    resumeAt(id: string | number, duration: number): number | null;
    saveRate(rate: number): void;
    saveVolume(volume: number): void;
    saveMuted(muted: boolean): void;
    saveResume(id: string | number, seconds: number): void;
}
export declare function resumePoint(saved: number, duration: number): number | null;
export declare function playerStorage(prefix?: string): PlayerStorage;
export declare const formatTime: (seconds?: number | null) => string;
export declare const spokenTime: (seconds?: number | null) => string;
export declare function formatRate(r: number): string;
export declare function sleepLabel(mode: SleepMode | null, noun?: string): string;
export declare function activeChapterIndex(chapters: readonly {
    start: number;
}[], t: number): number;
export declare function mediaSession(): MediaSession | null;
export declare function setPositionState(audio: HTMLMediaElement | null): void;
export declare function clearPositionState(): void;
export interface MetadataDefaults {
    artist?: string;
    album?: string;
    artwork?: PlayerArtwork[];
}
export declare function trackMetadata(track: PlayerTrack, defaults?: MetadataDefaults): MediaMetadataInit & {
    chapterInfo?: {
        title: string;
        startTime: number;
    }[];
};
export interface SessionHandlers {
    play: () => void;
    pause: () => void;
    stop: () => void;
    previoustrack: () => void;
    nexttrack: () => void;
    seekbackward: (offset?: number) => void;
    seekforward: (offset?: number) => void;
    seekto: (seconds: number, fast: boolean) => void;
}
export declare function setSessionHandlers(handlers: SessionHandlers): () => void;
export declare const STARTED_ATTRIBUTE = "data-cap-player-started";
export declare const AUDIO_SELECTOR = "audio[data-cap-player-audio]";
export declare function loadTrack(audio: HTMLAudioElement, track: {
    id: string | number;
    src: string;
}, storage: PlayerStorage): void;
export declare function startTrack(audio: HTMLAudioElement, track: {
    id: string | number;
    src: string;
}, storage: PlayerStorage): boolean;
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
export interface TranscriptCue {
    start: number;
    end: number;
    text: string;
    speaker?: string | null;
    nonVerbal?: boolean;
}
export declare function playheadCue(cues: readonly {
    start: number;
}[], t: number): number | null;
export declare const TRANSCRIPT_TRACK_LABEL = "cap-player-transcript";
export declare function wireClip(root: HTMLElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
