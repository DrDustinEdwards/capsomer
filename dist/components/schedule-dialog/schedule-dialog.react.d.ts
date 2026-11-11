import { type ReactNode } from "react";
export interface ScheduleDialogProps {
    open: boolean;
    onClose: () => void;
    returnTo?: HTMLElement | null;
    onSchedule: (iso: string) => Promise<void> | void;
    title: ReactNode;
    description?: ReactNode;
    current?: string | null;
    label?: string;
    confirm?: ReactNode;
    lead?: string;
}
export declare function ScheduleDialog({ open, onClose, returnTo, onSchedule, title, description, current, label, confirm, lead, }: ScheduleDialogProps): import("react").JSX.Element;
