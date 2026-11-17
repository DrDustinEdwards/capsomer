import { type ReactNode } from "react";
export declare function SecretReveal({ title, secret, note, copy, headingLevel: H, focusOnShow, }: {
    title: ReactNode;
    secret: string;
    note?: ReactNode;
    copy?: ReactNode;
    headingLevel?: "h2" | "h3" | "h4";
    focusOnShow?: boolean;
}): import("react").JSX.Element;
