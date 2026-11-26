import { type PlayerChapter } from "./player.ts";
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
export declare function ChapterButtons({ chapters, current, onGo, }: {
    chapters: readonly PlayerChapter[];
    current: number;
    onGo: (seconds: number) => void;
}): import("react").JSX.Element;
export declare function ChapterOptions({ onSelect }: {
    onSelect?: () => void;
}): import("react").JSX.Element | null;
