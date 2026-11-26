import type { ReactNode } from "react";
import type { MediaData } from "../content/content.ts";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
export declare function MediaSuggest({ base, Tool, ident, action, offers, suggestions, suggestHref, unsuggestHref, }: {
    base: string;
    Tool: FormComponent;
    ident: (intent: string) => ReactNode;
    action: string;
    offers: MediaData["offers"];
    suggestions: MediaData["suggestions"];
    suggestHref: string;
    unsuggestHref: string;
}): import("react").JSX.Element;
