// The React Time as a server sends it and as the browser hydrates it. The specimen has no server,
// so it renders the server's HTML in the page (renderToString takes the server's path), then
// hydrates it, and keeps any hydration error React reports in window.timeHydration.
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Time } from "./time.react.tsx";

function Demo() {
  return (
    <p>
      Went live <Time at="2026-10-02T09:12:00Z" format="exact" />
    </p>
  );
}

const host = document.getElementById("time-hydrate");
if (host) {
  const errors: string[] = [];
  (window as unknown as { timeHydration: { errors: string[]; server: string } }).timeHydration = { errors, server: "" };
  host.innerHTML = renderToString(<Demo />);
  (window as unknown as { timeHydration: { server: string } }).timeHydration.server = host.textContent ?? "";
  hydrateRoot(host, <Demo />, { onRecoverableError: (e) => errors.push(String((e as Error).message ?? e)) });
}
