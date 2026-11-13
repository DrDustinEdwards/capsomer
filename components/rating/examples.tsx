// Mounts the rating specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Rating, RatingInput } from "./rating.react.tsx";

const SPECIMENS: Record<string, () => ReactNode> = {
  show: () => <Rating value={3.5}>(12 ratings)</Rating>,
  sizes: () => (
    <div className="cap-specimen-row">
      <Rating value={1} size="sm" />
      <Rating value={4.5} />
      <Rating value={5} size="lg" />
    </div>
  ),
  input: () => <RatingInput name="rating" label="Your rating" defaultValue={4} />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
