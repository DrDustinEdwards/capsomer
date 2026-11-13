import { type ReactNode } from "react";
export interface NewsletterFormProps {
    className: string;
    method: "post";
    action?: string;
    "aria-labelledby": string;
    children: ReactNode;
}
export type NewsletterState = {
    ok: true;
} | {
    ok: false;
    error: string;
} | undefined;
export interface NewsletterSignupProps {
    action?: string;
    title?: ReactNode;
    text?: ReactNode;
    consent?: ReactNode;
    state?: NewsletterState;
    done?: ReactNode;
    button?: ReactNode;
    placeholder?: string;
    plain?: boolean;
    headingLevel?: "h2" | "h3";
    renderForm?: (props: NewsletterFormProps) => ReactNode;
}
export declare function NewsletterSignup({ action, title, text, consent, state, done, button, placeholder, plain, headingLevel: H, renderForm, }: NewsletterSignupProps): import("react").JSX.Element;
