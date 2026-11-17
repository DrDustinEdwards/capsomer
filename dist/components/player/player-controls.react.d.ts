import { type ReactNode } from "react";
import { type LinkProps } from "../shell/shell.react.tsx";
import { type PlayerTrack } from "./player.ts";
export type RenderLink = (props: LinkProps) => ReactNode;
export declare function PlayPauseButton({ track, size, }: {
    track?: PlayerTrack;
    size?: "md" | "lg";
}): import("react").JSX.Element;
export declare function SkipButton({ delta, track }: {
    delta: number;
    track?: PlayerTrack;
}): import("react").JSX.Element;
export declare function NextButton(): import("react").JSX.Element;
export declare function PlayTrackButton({ track, queue, size, }: {
    track: PlayerTrack;
    queue?: PlayerTrack[];
    size?: "sm" | "md" | "lg";
}): import("react").JSX.Element;
export declare function Scrubber({ track, ticks }: {
    track?: PlayerTrack;
    ticks?: boolean;
}): import("react").JSX.Element;
export declare function SpeedOptions(): import("react").JSX.Element;
export declare function SpeedControl({ side }: {
    side?: "top" | "bottom";
}): import("react").JSX.Element;
export declare function VolumeControl({ side }: {
    side?: "top" | "bottom";
}): import("react").JSX.Element;
export declare function SleepOptions(): import("react").JSX.Element;
export declare function SleepControl({ container }: {
    container?: HTMLElement | null;
}): import("react").JSX.Element;
export declare function ChaptersControl({ container }: {
    container?: HTMLElement | null;
}): import("react").JSX.Element | null;
export declare function ChapterOptions({ onSelect }: {
    onSelect?: () => void;
}): import("react").JSX.Element | null;
export declare function TranscriptLink({ href, renderLink, }: {
    href: string;
    renderLink?: RenderLink;
}): ReactNode;
export declare function PlayerStatus(): import("react").JSX.Element;
