// Mounts the React sortable list specimens: a corkboard of cards, and rows inside a form.
// The page holds the items and saves each new order, as an app would.
import { StrictMode, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { SortableBoard, SortableList, useRows, type Lists } from "./sortable-list.react.tsx";

interface Card {
  id: string;
  title: string;
  summary: string;
  pov: string;
}

const CARDS: Card[] = [
  {
    id: "rain",
    title: "Rain at Glen Rose",
    summary: "The forecast turns, and Ines moves the casts above the flood line.",
    pov: "Ines",
  },
  {
    id: "second",
    title: "The second set",
    summary: "Wade finds a trackway nobody has mapped, crossing the first.",
    pov: "Wade",
  },
  {
    id: "line",
    title: "The flood line",
    summary: "The river takes the lower ledge; the notebook goes with it.",
    pov: "Ines",
  },
  {
    id: "after",
    title: "After the water",
    summary: "Mud, a missing cast, and a phone call from the museum.",
    pov: "Wade",
  },
];

function Corkboard() {
  const [cards, setCards] = useState(CARDS);
  return (
    <>
      <SortableList
        aria-label="Scenes in 02 Flood stage"
        layout="cards"
        items={cards}
        getId={(c) => c.id}
        getLabel={(c) => c.title}
        onReorder={(order) => setCards(order.map((id) => cards.find((c) => c.id === id)!))}
        renderItem={(c) => (
          <>
            <span className="cap-sortable-label">
              <span>{c.title}</span>
            </span>
            <span className="cap-sortable-detail">{c.pov}</span>
            <p className="cap-sortable-detail">{c.summary}</p>
          </>
        )}
      />
      <output className="sortable-sample-out" id="cards-out">
        Order: {cards.map((c) => c.id).join(", ")}.
      </output>
    </>
  );
}

const POSTS = [
  { id: "trackway", title: "Reading a trackway" },
  { id: "river", title: "What the river keeps" },
  { id: "casts", title: "Casts, molds and mistakes" },
];

function Rows() {
  const [posts, setPosts] = useState(POSTS);
  return (
    <form className="sortable-sample-form" method="post" action="#reorder">
      <SortableList
        aria-label="Posts in the series"
        name="order"
        items={posts}
        getId={(p) => p.id}
        getLabel={(p) => p.title}
        onReorder={(order) => setPosts(order.map((id) => posts.find((p) => p.id === id)!))}
        renderItem={(p) => (
          <span className="cap-sortable-label">
            <span>{p.title}</span>
          </span>
        )}
      />
      <output className="sortable-sample-out" id="rows-out">
        Order: {posts.map((p) => p.id).join(", ")}.
      </output>
    </form>
  );
}

// Repeatable rows: a form's rows with fields of their own, added, removed and put in order. The
// host keeps a plain array; useRows gives each row an id that follows it.
interface Person {
  name: string;
  role: string;
}

function Hosts() {
  const [people, setPeople] = useState<Person[]>([
    { name: "Alex Rivera", role: "Host" },
    { name: "Sam Lee", role: "Producer" },
  ]);
  const rows = useRows(people, setPeople);
  const update = (index: number, patch: Partial<Person>) =>
    setPeople(people.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  return (
    <>
      <SortableList
        aria-label="Hosts"
        layout="stack"
        items={rows.items}
        getId={rows.getId}
        getLabel={(r) => r.value.name || `Host ${r.index + 1}`}
        renderItem={(r) => (
          <div className="sortable-sample-fields">
            <input
              className="cap-input"
              aria-label={`Host ${r.index + 1} name`}
              placeholder="Name"
              value={r.value.name}
              onChange={(e) => update(r.index, { name: e.target.value })}
            />
            <input
              className="cap-input"
              aria-label={`Host ${r.index + 1} role`}
              placeholder="Role"
              value={r.value.role}
              onChange={(e) => update(r.index, { role: e.target.value })}
            />
          </div>
        )}
        onReorder={rows.onReorder}
        onRemove={rows.onRemove}
        onAdd={() => setPeople([...people, { name: "", role: "" }])}
        addLabel="Add host"
        max={3}
        empty="No hosts yet."
      />
      <output className="sortable-sample-out" id="hosts-out">
        {people.map((p) => p.name || "(blank)").join(", ")}
      </output>
    </>
  );
}

// Steps whose number is their place: a head line, Alt and an arrow anywhere in the card, and the
// list's own words for a move.
function Steps() {
  const [steps, setSteps] = useState([
    { id: "s1", text: "Rinse the tube twice." },
    { id: "s2", text: "Add the buffer." },
    { id: "s3", text: "Mix by inverting." },
  ]);
  return (
    <SortableList
      aria-label="Steps"
      layout="stack"
      altKeys
      items={steps}
      getId={(s) => s.id}
      getLabel={(s) => s.text}
      messages={{
        step: (_label, pos, count) => `Moved to step ${pos} of ${count}.`,
        over: (_label, pos, count) => `Step ${pos} of ${count}.`,
      }}
      renderHead={(_s, { index }) => <span>Step {index + 1}</span>}
      renderItem={(s) => (
        <textarea
          className="cap-textarea"
          aria-label="Step text"
          value={s.text}
          rows={2}
          onChange={(e) =>
            setSteps(steps.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))
          }
        />
      )}
      onReorder={(order) => setSteps(order.map((id) => steps.find((s) => s.id === id)!))}
    />
  );
}

// Items between lists: a book's sections. Dragging into another section, the arrow keys at the end
// of a section, or the select in each item; locked once the book is published.
interface Entry {
  id: string;
  title: string;
  author: string;
}

function Sections() {
  const [lists, setLists] = useState<Lists>({
    talks: ["a1", "a2"],
    posters: ["a3"],
    late: [],
  });
  const [locked, setLocked] = useState(false);
  const entries: Entry[] = [
    { id: "a1", title: "Getting started with field samples", author: "Alex Rivera" },
    { id: "a2", title: "Release notes for the new protocol", author: "Sam Lee" },
    { id: "a3", title: "Field notes on slow growth", author: "Jordan Park" },
  ];
  const byId = new Map(entries.map((e) => [e.id, e]));
  const lanes = [
    { id: "talks", label: "Talks" },
    { id: "posters", label: "Posters" },
    { id: "late", label: "Late additions" },
  ].map((l) => ({
    ...l,
    items: (lists[l.id] ?? []).map((id) => byId.get(id)!),
    empty: "Empty. Drag an abstract here.",
  }));
  return (
    <>
      <label className="sortable-sample-out">
        <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />{" "}
        Published (locked)
      </label>
      <SortableBoard
        lanes={lanes}
        readOnly={locked}
        getId={(e) => e.id}
        getLabel={(e) => e.title}
        renderLaneHead={(lane) => <h3 className="sortable-sample-lane">{lane.label}</h3>}
        renderItem={(e) => (
          <>
            <span className="cap-sortable-label">
              <span>{e.title}</span>
            </span>
            <span className="cap-sortable-detail">{e.author}</span>
          </>
        )}
        onMove={(next) => setLists(next)}
      />
      <output className="sortable-sample-out" id="sections-out">
        {Object.entries(lists)
          .map(([l, ids]) => `${l}: ${ids.join(", ") || "none"}`)
          .join("; ")}
      </output>
    </>
  );
}

const mounts: Record<string, () => JSX.Element> = {
  cards: Corkboard,
  rows: Rows,
  hosts: Hosts,
  steps: Steps,
  sections: Sections,
};
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const C = mounts[el.dataset.mount ?? ""];
  if (C)
    createRoot(el).render(
      <StrictMode>
        <C />
      </StrictMode>,
    );
}
