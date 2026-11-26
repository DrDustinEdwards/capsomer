export type JobEngine = "api" | "subscription";
export interface AiJobAnswer {
    job?: string;
    engine?: JobEngine | null;
    message?: string;
    error?: string;
    href?: string | null;
}
export declare const ENGINE_NAME: Record<JobEngine, string>;
export declare function otherEngine(engine: JobEngine | null | undefined): JobEngine;
export declare function retryLabel(engine: JobEngine | null | undefined, names?: Record<JobEngine, string>): string;
export declare function canRetry(answer: AiJobAnswer | null | undefined): boolean;
