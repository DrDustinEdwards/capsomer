import { type ReactNode } from "react";
import { type Message, type SayOptions } from "./message.ts";
export type { Message, SayOptions };
export interface MessageApi {
    say: (text: string, opts?: SayOptions) => void;
    fail: (text: string) => void;
    dismiss: () => void;
}
export interface MessageProviderProps {
    children: ReactNode;
    region?: boolean;
    undoKey?: boolean;
}
export declare function MessageProvider({ children, region, undoKey }: MessageProviderProps): import("react").JSX.Element;
export declare function useMessage(): MessageApi;
export declare function useOptionalMessage(): MessageApi | null;
export declare function MessageRegion(): import("react").JSX.Element;
