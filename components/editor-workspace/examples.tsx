// Mounts the React specimen: the layout held by useWorkspaceLayout, a text, and a preview whose
// address takes a new stamp two seconds after the typing pauses.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  EditorWorkspace,
  LayoutSwitch,
  PreviewPane,
  usePausedStamp,
  useWorkspaceLayout,
} from "./editor-workspace.react.tsx";

const page = (text: string) =>
  `data:text/html;charset=utf-8,${encodeURIComponent(
    `<!doctype html><html lang="en"><title>Field notes</title><main><p>${text.replace(/[<&]/g, "")}</p></main></html>`,
  )}`;

function Workspace() {
  const [layout, choose] = useWorkspaceLayout("cap-specimen-react-layout");
  const [text, setText] = useState("Field notes from the first week.");
  const stamp = usePausedStamp(text, 2000, "first");
  // What the preview shows: the text as it was when the stamp last changed.
  const [shown, setShown] = useState({ stamp, text });
  if (shown.stamp !== stamp) setShown({ stamp, text });
  return (
    <>
      <LayoutSwitch value={layout} onChange={choose} />
      <EditorWorkspace
        layout={layout}
        writeId="ws-react-write"
        write={
          <div className="cap-field">
            <label className="cap-field-label" htmlFor="ws-react-text">
              Note
            </label>
            <textarea
              className="cap-input"
              id="ws-react-text"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              data-cap-typing-surface=""
            />
          </div>
        }
        preview={
          <PreviewPane
            // A real app passes its preview route: previewUrl("/p/site/e/item/preview", stamp).
            src={page(shown.text)}
            title="Preview of Field notes as example.com renders it"
          />
        }
      />
      <p className="cap-muted">
        Preview refreshed: <output id="ws-react-stamp">{stamp}</output>
      </p>
    </>
  );
}

const el = document.querySelector<HTMLElement>("[data-mount=react]");
if (el)
  createRoot(el).render(
    <StrictMode>
      <Workspace />
    </StrictMode>,
  );
