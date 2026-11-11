import { type ReactNode, type RefObject } from "react";
import { type ActionResultView, type Message, type SayOptions } from "./message.ts";
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
export type ActionResultFocus = "always" | "errors" | "never";
export interface UseActionResultOptions {
    focus?: ActionResultFocus;
}
export interface ActionResultState extends ActionResultView {
    ref: RefObject<HTMLParagraphElement | null>;
    regionProps: {
        ref: RefObject<HTMLParagraphElement | null>;
        tabIndex: -1;
        role: "alert" | "status";
        className: string;
        "data-tone": "crit" | "ok";
    };
}
export declare function useActionResult(data: unknown, options?: UseActionResultOptions): ActionResultState;
export interface ActionResultProps extends UseActionResultOptions {
    data: unknown;
}
export declare function ActionResult({ data, focus }: ActionResultProps): import("react").JSX.Element;
