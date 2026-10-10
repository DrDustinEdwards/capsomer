// Mounts the React tree specimen: a blog's series, which the page holds and saves.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Tree, type TreeNode } from "./tree.react.tsx";

const SERIES: TreeNode[] = [
  {
    id: "field-notes",
    label: "Field notes from the Paluxy",
    children: [
      { id: "fn-1", label: "Reading a trackway" },
      { id: "fn-2", label: "What the river keeps" },
      { id: "fn-3", label: "Casts, molds and mistakes" },
    ],
  },
  {
    id: "lab",
    label: "Lab notebook",
    children: [
      { id: "lab-1", label: "Phage plaques at 37 degrees" },
      { id: "lab-2", label: "When a control fails" },
    ],
  },
  { id: "loose", label: "Loose posts", children: [] },
];

const flat = (nodes: TreeNode[]): string =>
  nodes.map((n) => (n.children ? `${n.label}: ${n.children.map((c) => c.label).join(", ") || "nothing"}` : n.label)).join(". ");

function Series() {
  const [nodes, setNodes] = useState(SERIES);
  const [chosen, setChosen] = useState<string[]>(["fn-2"]);
  return (
    <div className="tree-sample">
      <Tree
        aria-label="Series"
        variant="surface"
        nodes={nodes}
        defaultExpanded={["field-notes", "lab"]}
        selected={chosen}
        onSelectedChange={setChosen}
        onMove={(_, next) => setNodes(next)}
        // A post stays inside a series: nothing moves to the top level.
        canMove={(m) => m.to.parent !== null}
      />
      <output className="tree-sample-out" id="series-out">
        {flat(nodes)}.
      </output>
    </div>
  );
}

const el = document.querySelector('[data-mount="react"]');
if (el)
  createRoot(el).render(
    <StrictMode>
      <Series />
    </StrictMode>,
  );
