import { type ConfirmRequest } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
export declare function RescheduleField({ id, at }: {
    id: string;
    at: string;
}): import("react").JSX.Element;
export interface Moving {
    id: string;
    name: string;
    at: string;
    version?: string;
}
export declare function RescheduleDialog({ moving, action, Form, onClose, }: {
    moving: Moving | null;
    action: string;
    Form: FormComponent;
    onClose: () => void;
}): import("react").JSX.Element;
export interface Renaming {
    id: string;
    name: string;
    path: string | null;
    version?: string;
}
export declare function RenameDialog({ renaming, action, Form, onClose, }: {
    renaming: Renaming | null;
    action: string;
    Form: FormComponent;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function PreviewLinkBox({ link, name, noun, scripted, }: {
    link: {
        url: string;
        expiresAt: string;
    } | undefined;
    name?: string;
    noun: string;
    scripted: boolean;
}): import("react").JSX.Element;
export declare const cancelRequest: (id: string, name: string, noun: string, version?: string) => ConfirmRequest;
