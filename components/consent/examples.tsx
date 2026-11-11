// Mounts the consent screen specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ConsentRefusal, ConsentScreen, PermissionList } from "./consent.react.tsx";

const base = {
  client: "Example Assistant",
  product: "Example Co",
  redirectHost: "assistant.example.com",
  account: { name: "Acme Supply Co.", email: "alex@example.com" },
  can: ["Read failed payments and their recovery steps", "Read disputes and their deadlines"],
  hidden: { client_id: "https://assistant.example.com/client.json", state: "abc" },
  footnote: "Example Co never shares your payment provider's token with other apps.",
};

const SPECIMENS: Record<string, () => ReactNode> = {
  published: () => (
    <ConsentScreen
      {...base}
      publishedBy="assistant.example.com"
      write={{
        items: ["Pause and resume recovery for a payment"],
        scope: "example.write",
        defaultChecked: true,
      }}
    />
  ),
  registered: () => (
    <ConsentScreen
      {...base}
      publishedBy={null}
      redirectHost="localhost"
      redirectWarning="Its access goes to this computer (localhost). Allow it only if you are running the app here."
      error="The request expired. Start again from the app."
    />
  ),
  refused: () => (
    <ConsentRefusal title="This request cannot be shown">
      The app sent a redirect address it did not register.
    </ConsentRefusal>
  ),
  lists: () => (
    <main id="main" className="cap-panel-pad">
      <PermissionList
        id="pl-yes"
        heading="What the audit reads"
        items={["Payments", "Disputes"]}
        allowed
      />
      <PermissionList
        id="pl-no"
        heading="What it never does"
        items={["Charge a customer", "Change a subscription"]}
        allowed={false}
      />
    </main>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
