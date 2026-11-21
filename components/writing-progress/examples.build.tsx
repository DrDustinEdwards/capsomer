// WritingProgress's specimens drawn when the states page is built (bin/states.mjs fills each
// <!-- build:name --> in examples.html), so each reads with scripts off: the server's own render.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { mounts } from "./specimen/mounts.tsx";

export default Object.fromEntries(
  Object.entries(mounts).map(([name, make]) => [name, renderToString(<StrictMode>{make()}</StrictMode>)]),
);
