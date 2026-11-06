// The React Embed: the poster and play button, then the player in place on a click. The player
// address is a blank page, so the specimen calls no service.
import { createRoot } from "react-dom/client";
import { Embed } from "./player.react.tsx";

const host = document.querySelector<HTMLElement>("[data-mount='embed']");
if (host) {
  createRoot(host).render(
    <Embed
      service="youtube"
      href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      player="about:blank"
      title="A keynote on publishing with Prelum"
      action="Watch on YouTube"
      poster={{ src: new URL("./specimen/poster.svg", import.meta.url).href, width: 1280, height: 720 }}
    />,
  );
}
