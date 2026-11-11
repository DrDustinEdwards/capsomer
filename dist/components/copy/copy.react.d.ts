import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { type ShareOutcome } from "./copy.ts";
export declare function useCopy(messages?: {
    copied?: string;
    failed?: string;
}): {
    copy: (text: string) => Promise<boolean>;
    share: (data: {
        url: string;
        title?: string;
    }) => Promise<ShareOutcome>;
    state: "done" | "failed" | undefined;
    message: string;
};
export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "style" | "children"> {
    text?: string | (() => string);
    share?: {
        url: string;
        title?: string;
    };
    children?: ReactNode;
    copiedMessage?: string;
    failedMessage?: string;
    variant?: "default" | "quiet" | "secondary";
    size?: "xs" | "sm";
    onCopied?: (ok: boolean) => void;
}
export declare const COPY_ICON: import("react").JSX.Element;
export declare const DONE_ICON: import("react").JSX.Element;
export declare function CopyButton(props: CopyButtonProps): import("react").JSX.Element;
