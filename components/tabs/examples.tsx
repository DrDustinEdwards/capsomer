// Mounts the tabs specimens that need React: the links form with an app's router link. Every
// element with data-mount="<state>" gets that state.
import { StrictMode, useState, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { PageTabs, TabLink, TabsNav, type RenderTabLink } from "./tabs.react.tsx";
import { tabParam } from "./tabs.ts";

// A stand-in for a router's link: it keeps the tab's class and aria-current it is given, and
// navigates without a page load (a click is handed to the router, which says where it went).
function RouterLink({
  to,
  onNavigate,
  children,
  ...rest
}: ComponentProps<"a"> & { to: string; onNavigate: (to: string) => void }) {
  return (
    <a
      {...rest}
      href={to}
      data-router-link=""
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate(to);
      }}
    >
      {children}
    </a>
  );
}

const STATUSES = [
  { id: "all", label: "All", count: 24 },
  { id: "waiting", label: "Waiting", count: 5 },
  { id: "approved", label: "Approved", count: 17 },
  { id: "spam", label: "Spam", count: 2 },
];

// The app's router owns the location: here a state, and the page's own line says where it is.
function RouterTabs({ perLink }: { perLink?: boolean }) {
  const [path, setPath] = useState("/mentions/waiting");
  const current = path.split("/").pop();
  const render: RenderTabLink = ({ href, ...props }) => (
    <RouterLink to={href} onNavigate={setPath} {...props} />
  );
  return (
    <>
      <TabsNav aria-label="Filter mentions by status" renderLink={perLink ? undefined : render}>
        {STATUSES.map((s) => (
          <TabLink
            key={s.id}
            href={`/mentions/${s.id}`}
            current={current === s.id}
            count={s.count}
            renderLink={perLink ? render : undefined}
          >
            {s.label}
          </TabLink>
        ))}
      </TabsNav>
      <p className="cap-muted" data-router-path={path}>
        Router location: {path}
      </p>
    </>
  );
}

const AGENT_TABS = [
  { id: "active", label: "Active", count: 3 },
  { id: "paused", label: "Paused", count: 1 },
  { id: "history", label: "History" },
];

// Page tabs on a router: the address is a state here; the first tab is the bare path.
function PageTabsDemo() {
  const [address, setAddress] = useState("/agents?q=draft");
  const [path = "", search = ""] = address.split("?");
  const current = tabParam(search) ?? "active";
  const render: RenderTabLink = ({ href, ...props }) => (
    <RouterLink to={href} onNavigate={setAddress} {...props} />
  );
  return (
    <>
      <PageTabs
        aria-label="Agents"
        path={path}
        search={search}
        tabs={AGENT_TABS}
        current={current}
        renderLink={render}
      />
      <p className="cap-muted" data-router-path={address}>
        Router location: {address}
      </p>
    </>
  );
}

const SPECIMENS: Record<string, () => React.ReactNode> = {
  "page-tabs": () => <PageTabsDemo />,
  router: () => <RouterTabs />,
  "router-per-link": () => <RouterTabs perLink />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
