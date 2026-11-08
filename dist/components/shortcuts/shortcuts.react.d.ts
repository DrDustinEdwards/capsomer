export declare function useShortcut(key: string | string[], run: (e: KeyboardEvent) => void, opts?: {
    label?: string;
    about?: string;
    group?: string;
    when?: () => boolean;
}): void;
export declare function Keys({ spec }: {
    spec: string | string[];
}): import("react").JSX.Element;
export interface ShortcutSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
export declare function ShortcutSheet({ open, onOpenChange }: ShortcutSheetProps): import("react").JSX.Element;
