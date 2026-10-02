// Mounts the React specimen: the MarkdownEditor wrapper, controlled, in StrictMode (which
// mounts, unmounts and mounts again, so the editor must survive being upgraded twice).
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MarkdownEditor } from "./markdown-editor.react.tsx";

const targets = [
  { href: "/writing/moving-the-monitors", title: "Moving the monitors to the edge" },
  { href: "/writing/first-incident", title: "The first incident write-up" },
];

function Held() {
  const [text, setText] = useState("## Draft from React\n\nServer-rendered as a textarea, upgraded in place.");
  return (
    <>
      <MarkdownEditor
        label="Body"
        name="body"
        value={text}
        onChange={setText}
        help="Controlled by React: the count below follows what you type."
        linkTargets={targets}
        maxLength={400}
      />
      <p>
        <button type="button" className="cap-btn" onClick={() => setText("Replaced by the app.")}>
          Replace the text
        </button>
      </p>
      <p>
        Characters held by React: <output id="react-count">{text.length}</output>
      </p>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<StrictMode><Held /></StrictMode>);

// What a server render of the wrapper produces, kept for the spec to read: the labelled
// textarea with its text, no toolbar, no style attribute.
(window as unknown as { capReactSsr: string }).capReactSsr = renderToString(
  <MarkdownEditor label="Body" name="body" defaultValue="## Server text" help="Help here." error="Say what is wrong." required maxLength={200} />,
);
