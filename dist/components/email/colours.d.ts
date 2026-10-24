export type EmailFamily = "purple" | "fox" | "teal" | "navy" | "forest";
export type EmailColours = Record<"ground" | "surface" | "line" | "text" | "muted" | "accent-text" | "primary" | "primary-fg" | "ok" | "ok-soft" | "warn" | "warn-soft" | "crit" | "crit-soft" | "info" | "info-soft", string>;
export declare const emailColours: Record<EmailFamily, {
    light: EmailColours;
    dark: EmailColours;
}>;
