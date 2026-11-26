import type { MediaRecord } from "./media.ts";
import type { MediaInspectorProps } from "./media.react.tsx";
export declare function PictureTools({ item, base, tools, action, Tool, }: {
    item: MediaRecord;
    base: string;
    tools: NonNullable<MediaInspectorProps["tools"]>;
    action: string;
    Tool: NonNullable<MediaInspectorProps["Form"]>;
}): import("react").JSX.Element;
export declare function nestedTool(handler: {
    current: ((form: FormData) => void) | undefined;
}): NonNullable<MediaInspectorProps["Form"]>;
