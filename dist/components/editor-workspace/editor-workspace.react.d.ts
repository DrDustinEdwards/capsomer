import { type ReactNode } from "react";
import { type Layout } from "./editor-workspace.ts";
export declare function useWorkspaceLayout(key?: string): [Layout, (next: Layout) => void];
export declare function useSaveShortcut(save: () => void): void;
export declare function useTypingRecede(surface?: string): void;
export declare function usePausedStamp(value: unknown, delay?: number, initial?: string): string;
export interface LayoutSwitchProps {
    value: Layout;
    onChange: (next: Layout) => void;
    legend?: string;
    labels?: Partial<Record<Layout, string>>;
}
export declare function LayoutSwitch({ value, onChange, legend, labels, }: LayoutSwitchProps): import("react").JSX.Element;
export interface EditorWorkspaceProps {
    layout: Layout;
    write: ReactNode;
    preview: ReactNode;
    writeLabel?: string;
    writeId?: string;
}
export declare function EditorWorkspace({ layout, write, preview, writeLabel, writeId, }: EditorWorkspaceProps): import("react").JSX.Element;
export interface PreviewPaneProps {
    src: string;
    title: string;
    label?: string;
    name?: string;
}
export declare function PreviewPane({ src, title, label, name }: PreviewPaneProps): import("react").JSX.Element;
export { LAYOUTS, LAYOUT_KEY, previewUrl, readLayout, type Layout } from "./editor-workspace.ts";
