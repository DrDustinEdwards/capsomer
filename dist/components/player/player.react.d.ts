import { type ReactElement, type ReactNode } from "react";
export interface PosterProps {
    src: string;
    srcSet?: string;
    sizes?: string;
    width?: number;
    height?: number;
}
export interface VideoProps {
    src: string;
    title: string;
    poster: string;
    width: number;
    height: number;
    captions?: {
        src: string;
        lang?: string;
        label?: string;
    };
    transcript?: string;
    caption?: ReactNode;
    loading?: "lazy" | "eager";
}
export declare function Video({ src, title, poster, width, height, captions, transcript, caption, loading, }: VideoProps): ReactElement;
export interface AudioProps {
    src: string;
    title: string;
    transcript: string;
    caption?: ReactNode;
    loading?: "lazy" | "eager";
}
export declare function Audio({ src, title, transcript, caption, loading, }: AudioProps): ReactElement;
export interface EmbedProps {
    service: string;
    href: string;
    player: string;
    title: string;
    action: string;
    poster?: PosterProps;
    caption?: ReactNode;
}
export declare function Embed({ service, href, player, title, action, poster, caption, }: EmbedProps): ReactElement;
export { PlayerProvider, usePlayer } from "./player-context.react.tsx";
export type { PlayerApi, PlayerProviderProps, PlayerState } from "./player-context.react.tsx";
export { ChapterOptions, ChaptersControl, NextButton, PlayPauseButton, PlayTrackButton, PlayerStatus, Scrubber, SkipButton, SleepControl, SleepOptions, SpeedControl, SpeedOptions, TranscriptLink, VolumeControl, } from "./player-controls.react.tsx";
export type { RenderLink } from "./player-controls.react.tsx";
export { DOCK_SHEET_BELOW, PlayerDock, PlayerSurface } from "./player-dock.react.tsx";
export type { PlayerDockProps, PlayerSurfaceProps } from "./player-dock.react.tsx";
export { PlayerTranscript } from "./player-transcript.react.tsx";
export type { PlayerTranscriptProps } from "./player-transcript.react.tsx";
export { Waveform, WaveformPreview } from "./player-waveform.react.tsx";
export type { WaveformPreviewProps, WaveformProps } from "./player-waveform.react.tsx";
export { ChapterList, Hosts, KeyMoments, PlayClip } from "./player-extras.react.tsx";
export type { ChapterListProps, HostsProps, KeyMoment, KeyMomentsProps, PlayClipProps, PlayerHost, } from "./player-extras.react.tsx";
export type { PlayerArtwork, PlayerChapter, PlayerTrack, SleepMode, TranscriptCue, } from "./player.ts";
