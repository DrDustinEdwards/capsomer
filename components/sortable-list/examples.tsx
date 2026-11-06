// Mounts the React sortable list specimens: a corkboard of cards, and rows inside a form.
// The page holds the items and saves each new order, as an app would.
import { StrictMode, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { SortableList } from "./sortable-list.react.tsx";

interface Card {
  id: string;
  title: string;
  summary: string;
  pov: string;
}

const CARDS: Card[] = [
  { id: "rain", title: "Rain at Glen Rose", summary: "The forecast turns, and Ines moves the casts above the flood line.", pov: "Ines" },
  { id: "second", title: "The second set", summary: "Wade finds a trackway nobody has mapped, crossing the first.", pov: "Wade" },
  { id: "line", title: "The flood line", summary: "The river takes the lower ledge; the notebook goes with it.", pov: "Ines" },
  { id: "after", title: "After the water", summary: "Mud, a missing cast, and a phone call from the museum.", pov: "Wade" },
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
            <span className="cap-sortable-label">{c.title}</span>
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
        renderItem={(p) => <span className="cap-sortable-label">{p.title}</span>}
      />
      <output className="sortable-sample-out" id="rows-out">
        Order: {posts.map((p) => p.id).join(", ")}.
      </output>
    </form>
  );
}

const mounts: Record<string, () => JSX.Element> = { cards: Corkboard, rows: Rows };
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const C = mounts[el.dataset.mount ?? ""];
  if (C)
    createRoot(el).render(
      <StrictMode>
        <C />
      </StrictMode>,
    );
}
