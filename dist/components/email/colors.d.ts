export type EmailFamily = "purple" | "fox" | "teal" | "amber" | "navy" | "forest" | "magenta" | "cerulean" | "olive" | "rose";
export type EmailColors = Record<"ground" | "surface" | "line" | "text" | "muted" | "accent-text" | "primary" | "primary-fg" | "ok" | "ok-soft" | "warn" | "warn-soft" | "crit" | "crit-soft" | "info" | "info-soft", string>;
export declare const emailColors: Record<EmailFamily, {
    light: EmailColors;
    dark: EmailColors;
}>;
