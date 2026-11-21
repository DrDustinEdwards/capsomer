export interface ButtonLook {
    variant?: "default" | "primary" | "secondary" | "danger" | "quiet" | "link";
    size?: "xs" | "sm" | "default" | "lg";
    iconOnly?: boolean;
    wrap?: boolean;
    block?: boolean;
}
export declare function buttonAttrs(look: ButtonLook & {
    label?: string;
    "aria-label"?: string;
}, className: string | undefined): {
    className: string;
    "data-variant": "link" | "quiet" | "secondary" | "primary" | "danger" | undefined;
    "data-size": "sm" | "xs" | "lg" | undefined;
    "data-icon-only": string | undefined;
    "data-wrap": string | undefined;
    "data-block": string | undefined;
    "aria-label": string | undefined;
};
