import { type ReactNode } from "react";
import { type PlayerChapter, type PlayerTrack } from "./player.ts";
export interface ChapterListProps {
    track: PlayerTrack;
    chapters?: readonly PlayerChapter[];
    heading?: string;
    level?: 2 | 3;
}
export declare function ChapterList({ track, chapters, heading, level, }: ChapterListProps): import("react").JSX.Element | null;
export interface KeyMoment {
    seconds: number;
    label: string;
}
export interface KeyMomentsProps {
    track: PlayerTrack;
    moments: readonly KeyMoment[];
    heading?: string;
    level?: 2 | 3;
    playerId?: string;
}
export declare function KeyMoments({ track, moments, heading, level, playerId, }: KeyMomentsProps): import("react").JSX.Element | null;
export interface PlayerHost {
    name: string;
    role?: string;
    href?: string;
    img?: string;
}
export interface HostsProps {
    hosts: readonly PlayerHost[];
    heading?: string;
    level?: 2 | 3;
    avatar?: (host: PlayerHost) => ReactNode;
}
export declare function Hosts({ hosts, heading, level, avatar }: HostsProps): import("react").JSX.Element | null;
export interface PlayClipProps {
    src: string;
    label: string;
}
export declare function PlayClip({ src, label }: PlayClipProps): import("react").JSX.Element;
