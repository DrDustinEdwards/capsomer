import type { ReactNode } from "react";
export interface ReadStateProps {
    what: string;
    loading: boolean;
    error?: string | null;
    hasData: boolean;
    empty?: ReactNode;
    onRetry?: () => void;
    children: ReactNode;
}
export declare function ReadState({ what, loading, error, hasData, empty, onRetry, children, }: ReadStateProps): import("react").JSX.Element;
export interface ReadAgainProps {
    at?: number | Date | string;
    reading: boolean;
    onRead: () => void;
    now?: number;
}
export declare function ReadAgain({ at, reading, onRead, now }: ReadAgainProps): import("react").JSX.Element;
export type SourceResult<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    kind: "empty" | "nodata" | "error";
    reason: string;
};
export interface SourceStateProps<T> {
    src: SourceResult<T>;
    children: (data: T) => ReactNode;
}
export declare function SourceState<T>({ src, children }: SourceStateProps<T>): import("react").JSX.Element;
