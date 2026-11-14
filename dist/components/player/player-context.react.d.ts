import { type ReactNode, type RefObject } from "react";
import { type PlayerArtwork, type PlayerTrack, type SleepMode } from "./player.ts";
export interface PlayerState {
    queue: PlayerTrack[];
    index: number;
    current: PlayerTrack | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    rate: number;
    volume: number;
    muted: boolean;
    buffering: boolean;
    errored: boolean;
    sleep: SleepMode | null;
    surfaceVisible: boolean;
}
export interface PlayerApi extends PlayerState {
    audioRef: RefObject<HTMLAudioElement | null>;
    noun: string;
    skipBack: number;
    skipForward: number;
    setQueue: (tracks: PlayerTrack[]) => void;
    playTrack: (track: PlayerTrack) => void;
    playQueueAt: (tracks: PlayerTrack[], index: number) => void;
    playTrackAt: (track: PlayerTrack, seconds: number) => void;
    toggle: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
    seek: (seconds: number) => void;
    skip: (delta: number) => void;
    setRate: (rate: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    setSleep: (mode: SleepMode | null) => void;
    setSurfaceVisible: (visible: boolean) => void;
    dismiss: () => void;
}
export interface PlayerProviderProps {
    storagePrefix?: string;
    artist?: string;
    album?: string;
    artwork?: PlayerArtwork[];
    noun?: string;
    skipBack?: number;
    skipForward?: number;
    children: ReactNode;
}
export declare function PlayerProvider({ storagePrefix, artist, album, artwork, noun, skipBack, skipForward, children, }: PlayerProviderProps): import("react").JSX.Element;
export declare function usePlayer(): PlayerApi;
