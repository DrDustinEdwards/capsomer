import { type ReactNode } from "react";
export type ActionStatus = {
    ok: true;
    message: ReactNode;
} | {
    ok: false;
    message: ReactNode;
};
export declare function actionStatus(data: unknown): ActionStatus | null;
export type FormStatusFocus = boolean | "errors";
export interface FormStatusProps {
    status: ActionStatus | null;
    focus?: FormStatusFocus;
    className?: string;
}
export declare function FormStatus({ status, focus, className }: FormStatusProps): import("react").JSX.Element;
export declare function useActionStatus(data: unknown): ActionStatus | null;
