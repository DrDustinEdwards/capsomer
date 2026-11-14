export type Engine = "subscription" | "api" | "auto";
export interface EngineSettingsLike {
    master: string;
    features: Record<string, string>;
    override: {
        engine: string;
        until: string;
    } | null;
    apiCapMicros: number;
}
export interface EngineJob {
    key: string;
    label: string;
    note?: string;
}
export declare const ENGINE_OPTIONS: ReadonlyArray<{
    value: Engine;
    label: string;
}>;
export declare function dollars(micros: number): string;
export declare function engineWord(value: string): string;
export declare function settingsFromForm(get: (name: string) => unknown, jobs: readonly Pick<EngineJob, "key">[]): {
    master: string;
    features: Record<string, string>;
    models: Record<string, string>;
    efforts: Record<string, string>;
    apiCapMicros: number;
};
