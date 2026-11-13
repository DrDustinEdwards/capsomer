// Editor workspace in React: the layout switch and its remembered choice, the two panes, the
// sandboxed preview, the preview's refresh once typing pauses, Ctrl or Cmd+S, and the chrome that
// steps back while someone types (editor-workspace.ts).

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Segmented } from "../segmented/segmented.react.tsx";
import {
  LAYOUT_KEY,
  onSaveKey,
  readLayout,
  storeLayout,
  storedLayout,
  typingRecede,
  type Layout,
} from "./editor-workspace.ts";
import { subscribeStored } from "../hooks/hooks.ts";

// The layout remembered in this browser under `key`; Write on the server and in the render that
// hydrates, so they agree, then the stored one.
export function useWorkspaceLayout(key = LAYOUT_KEY): [Layout, (next: Layout) => void] {
  const layout = useSyncExternalStore(
    subscribeStored,
    () => storedLayout(key) ?? "write",
    () => "write" as Layout,
  );
  const choose = useCallback((next: Layout) => storeLayout(next, key), [key]);
  return [layout, choose];
}

// Ctrl or Cmd+S calls `save` in place of the browser's save-page; `save` decides whether a save
// may run now. The latest `save` is called, so it may close over fresh state.
export function useSaveShortcut(save: () => void): void {
  const latest = useRef(save);
  useLayoutEffect(() => {
    latest.current = save;
  });
  useEffect(() => onSaveKey(() => latest.current()), []);
}

// The chrome steps back while someone types in a writing surface (`.cm-editor`, or any element
// with data-cap-typing-surface), and returns on a mouse move or when focus enters it.
export function useTypingRecede(surface?: string): void {
  useEffect(() => typingRecede(surface ? { surface } : {}), [surface]);
}

// A stamp that changes `delay` ms after `value` stops changing: the preview's refresh, so the
// site renders the text once the typing pauses, not on every key.
export function usePausedStamp(value: unknown, delay = 2000, initial = ""): string {
  const [stamp, setStamp] = useState(initial);
  // The value the stamp was last taken for: a mount (or StrictMode's second mount) is no change.
  const seen = useRef(value);
  useEffect(() => {
    if (Object.is(seen.current, value)) return;
    const timer = window.setTimeout(() => {
      seen.current = value;
      setStamp(Date.now().toString(36));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return stamp;
}

export interface LayoutSwitchProps {
  value: Layout;
  onChange: (next: Layout) => void;
  // Names the group for a screen reader; visually hidden. Default "Layout".
  legend?: string;
  labels?: Partial<Record<Layout, string>>;
}

// Write, Split, Preview: the Segmented control, small, its legend hidden.
export function LayoutSwitch({
  value,
  onChange,
  legend = "Layout",
  labels = {},
}: LayoutSwitchProps) {
  return (
    <div data-cap-layout="">
      <Segmented
        legend={legend}
        hideLegend
        size="sm"
        value={value}
        onChange={(v) => onChange(readLayout(v))}
        options={[
          { value: "write", label: labels.write ?? "Write" },
          { value: "split", label: labels.split ?? "Split" },
          { value: "preview", label: labels.preview ?? "Preview" },
        ]}
      />
    </div>
  );
}

export interface EditorWorkspaceProps {
  layout: Layout;
  // The writing surface; not rendered in Preview.
  write: ReactNode;
  // The preview, usually a PreviewPane; not rendered in Write.
  preview: ReactNode;
  // The write pane's name. Default "Write".
  writeLabel?: string;
  // The write pane's id, for a skip link. Default "write".
  writeId?: string;
}

// The two panes: one column, or side by side in Split once the workspace is 48rem wide.
export function EditorWorkspace({
  layout,
  write,
  preview,
  writeLabel = "Write",
  writeId = "write",
}: EditorWorkspaceProps) {
  return (
    <div className="cap-workspace">
      <div className="cap-workspace-body" data-layout={layout}>
        {layout !== "preview" ? (
          <section
            className="cap-workspace-pane"
            data-pane="write"
            id={writeId}
            aria-label={writeLabel}
          >
            {write}
          </section>
        ) : null}
        {layout !== "write" ? preview : null}
      </div>
    </div>
  );
}

export interface PreviewPaneProps {
  // The site's render of the text: a preview route the app serves.
  src: string;
  // The frame's title: what it shows, "Preview of Spring update as example.com renders it".
  title: string;
  // The pane's name. Default "Preview".
  label?: string;
  // A form may post into the frame by this name.
  name?: string;
}

// The site's own page in a frame with an empty sandbox: it runs no script and has an opaque
// origin, so a post's markup cannot reach the app.
export function PreviewPane({ src, title, label = "Preview", name }: PreviewPaneProps) {
  return (
    <section className="cap-preview-pane" data-pane="preview" aria-label={label}>
      <iframe title={title} src={src} name={name} sandbox="" />
    </section>
  );
}

export { LAYOUTS, LAYOUT_KEY, previewUrl, readLayout, type Layout } from "./editor-workspace.ts";
