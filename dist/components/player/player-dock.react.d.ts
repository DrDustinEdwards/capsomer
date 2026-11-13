import { type ReactNode } from "react";
import { type RenderLink } from "./player-controls.react.tsx";
import type { PlayerTrack } from "./player.ts";
export declare const DOCK_SHEET_BELOW = 768;
export interface PlayerDockProps {
    label?: string;
    idle?: string;
    renderLink?: RenderLink;
}
export declare function PlayerDock({ label, idle, renderLink, }: PlayerDockProps): import("react").JSX.Element | null;
export interface PlayerSurfaceProps {
    track: PlayerTrack;
    peaks?: readonly number[] | null;
    waveform?: boolean;
    label?: string;
    transcriptHref?: string;
    renderLink?: RenderLink;
    children?: ReactNode;
}
export declare function PlayerSurface({ track, peaks, waveform, label, transcriptHref, renderLink, children, }: PlayerSurfaceProps): import("react").JSX.Element;
