// Mounts the role grid specimens. Every element with data-mount="<state>" gets that state. Saves
// are held in the page: a change is recorded in data-saved so the spec can read what was sent.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MessageProvider } from "../message/message.react.tsx";
import { RoleGrid, type RoleGridPerson, type RoleScope } from "./people-roles.react.tsx";

const SCOPES: RoleScope[] = [
  { id: "1", name: "Field notes" },
  { id: "2", name: "Letters" },
];

const PEOPLE: RoleGridPerson[] = [
  {
    id: "o",
    email: "owner@example.com",
    name: "Alex Rivera",
    roles: {},
    everyScope: "Owner of every project.",
  },
  { id: "p", email: "rosa@example.com", name: "Rosa Park", roles: { "1": "editor" } },
  { id: "r", email: "reviewer@example.com", roles: { "2": "reader" }, badges: ["Reviewer (AI)"] },
];

function Grid() {
  const [people, setPeople] = useState(PEOPLE);
  return (
    <div data-saved="">
      <RoleGrid
        people={people}
        scopes={SCOPES}
        caption="People, and their role on each project"
        options={(person) =>
          person.badges?.includes("Reviewer (AI)")
            ? [{ value: "reader", label: "Reader" }]
            : [
                { value: "reader", label: "Reader" },
                { value: "editor", label: "Editor" },
              ]
        }
        onRoleChange={(person, scope, role) => {
          document
            .querySelector("[data-saved]")
            ?.setAttribute("data-saved", `${person.id}:${scope.id}:${role}`);
        }}
        onAccess={(person, intent) =>
          setPeople((list) =>
            list.map((p) =>
              p.id === person.id
                ? { ...p, disabledAt: intent === "disable" ? "2026-10-02T09:00:00Z" : undefined }
                : p,
            ),
          )
        }
      />
    </div>
  );
}

const SPECIMENS: Record<string, () => React.ReactNode> = { grid: () => <Grid /> };

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render)
    createRoot(el).render(
      <StrictMode>
        <MessageProvider>{render()}</MessageProvider>
      </StrictMode>,
    );
}
