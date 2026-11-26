export interface Command {
    id: string;
    label: string;
    group: string;
    keywords?: string[];
    shortcut?: string | string[];
    hint?: string;
    snippet?: string;
    of?: string;
    run: () => void;
}
export declare function navCommands(nav: ReadonlyArray<{
    id: string;
    label: string;
    href: string;
    group?: string;
}>, go: (href: string) => void, group?: string): Command[];
export declare function markQuery(text: string, query: string): Array<{
    text: string;
    mark: boolean;
}>;
export declare const RECENT_MAX = 5;
export declare function readRecent(key: string): string[];
export declare function rememberRecent(key: string, id: string): string[];
export declare const STOP_GROUP = "Stop";
export declare const STOP_HINTS: {
    readonly reason: "asks a reason";
    readonly preview: "preview first";
};
export declare function stopCommand(o: {
    id: string;
    label: string;
    ask: keyof typeof STOP_HINTS;
    keywords?: string[];
    run: () => void;
}): Command;
export declare function groupCommands<T extends {
    group: string;
}>(commands: T[]): Array<{
    group: string;
    items: T[];
}>;
export declare function emptyText(query: string): string;
export declare const SEARCHING = "Searching\u2026";
