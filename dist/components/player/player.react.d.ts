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
}
export declare function Video({ src, title, poster, width, height, captions, transcript, caption }: VideoProps): ReactElement;
export interface AudioProps {
    src: string;
    title: string;
    transcript: string;
    caption?: ReactNode;
}
export declare function Audio({ src, title, transcript, caption }: AudioProps): ReactElement;
export interface EmbedProps {
    service: string;
    href: string;
    player: string;
    title: string;
    action: string;
    poster?: PosterProps;
    caption?: ReactNode;
}
export declare function Embed({ service, href, player, title, action, poster, caption }: EmbedProps): ReactElement;
