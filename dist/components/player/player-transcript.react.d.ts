import { type PlayerTrack, type TranscriptCue } from "./player.ts";
export interface PlayerTranscriptProps {
    cues: readonly TranscriptCue[];
    track: PlayerTrack;
    fallback?: string;
    shareUrl?: (seconds: number) => string;
    attribution?: (title: string, url: string) => string;
    search?: boolean;
    copy?: boolean;
}
export declare function PlayerTranscript({ cues, track, fallback, shareUrl, attribution, search, copy, }: PlayerTranscriptProps): import("react").JSX.Element;
