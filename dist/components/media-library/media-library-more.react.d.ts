import type { ReactNode } from "react";
import type { MediaData } from "../content/content.ts";
import type { FormComponent } from "../content/content.react.tsx";
import { type MediaRecord } from "../media/media.ts";
export interface MediaMoreProps {
    item: MediaRecord;
    data: Pick<MediaData, "offers" | "can" | "history" | "suggestions">;
    Tool: FormComponent;
    ident: (intent: string) => ReactNode;
    base: string;
    action: string;
    inspectHref: (key: string) => string;
    suggestHref: string;
    unsuggestHref: string;
}
export declare function MediaMore({ item, data, Tool, ident, base, action, inspectHref, suggestHref, unsuggestHref }: MediaMoreProps): import("react").JSX.Element;
