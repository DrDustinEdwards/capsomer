export declare function localValue(at: string | number | Date, zone?: string): string;
export interface ScheduleCheck {
    at: Date | null;
    problem: string | null;
}
export declare const NO_TIME = "Choose a time first.";
export declare const PAST_TIME = "Choose a time in the future.";
export declare function checkSchedule(value: string, now: number): ScheduleCheck;
