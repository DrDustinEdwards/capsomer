import { useId, useRef, type FormEvent } from "react";
import { Button } from "../button/button.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import { Select } from "../select/select.react.tsx";
import { Pill } from "../status/status.react.tsx";
import { Table } from "../table/table.react.tsx";
import { Time } from "../time/time.react.tsx";
import {
  personName,
  roleFailedText,
  roleSavedText,
  type RoleGridPerson,
  type RoleOption,
  type RoleScope,
} from "./people-roles.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";

export interface RoleGridProps {
  people: RoleGridPerson[];
  scopes: RoleScope[];
  // The table's caption, for screen readers: "People, and their role on each project".
  caption: string;
  // The first column's heading. Default "Person".
  personHeading?: string;
  // The roles this person may have on this scope (a reviewer is offered no Editor). "" is no
  // access and is always offered first.
  options: (person: RoleGridPerson, scope: RoleScope) => RoleOption[];
  // With the script: a cell saves as soon as it changes. The grid says "Saved: ..." when it
  // resolves. Without the script, each row's Save posts every scope's role at once (intent
  // "roles", person, and role-<scope id> per scope).
  onRoleChange?: (person: RoleGridPerson, scope: RoleScope, role: string) => void | Promise<void>;
  // Disable and Enable. With the script it is called and Disable offers Undo; without it, the
  // row's form posts intent "disable" or "enable" and person.
  onAccess?: (person: RoleGridPerson, intent: "disable" | "enable") => void | Promise<void>;
  // Where the no-script forms post. Default: the page itself.
  action?: string;
  // The words for no access. Default "No access".
  noAccess?: string;
}

function GridRow({
  person,
  scopes,
  options,
  onRoleChange,
  onAccess,
  action,
  noAccess,
  hydrated,
}: Omit<RoleGridProps, "people" | "caption" | "personHeading"> & {
  person: RoleGridPerson;
  hydrated: boolean;
  noAccess: string;
}) {
  const message = useOptionalMessage();
  const formId = `cap-roles-${useId()}`;
  const name = personName(person);
  const disabled = Boolean(person.disabledAt);
  // The role each select last saved, so a refused save puts the select back.
  const saved = useRef<Record<string, string>>({});
  const access = async (e: FormEvent<HTMLFormElement>) => {
    if (!onAccess) return;
    e.preventDefault();
    const intent = disabled ? "enable" : "disable";
    try {
      await onAccess(person, intent);
    } catch (error) {
      message?.say(`${name} could not be ${intent === "disable" ? "disabled" : "enabled"}.`, {
        failure: true,
      });
      reportError(error);
      return;
    }
    if (intent === "disable")
      message?.say(`${name} is disabled. They are refused on their next request.`, {
        undo: () => onAccess(person, "enable"),
        undone: `${name} is enabled again.`,
      });
    else message?.say(`${name} is enabled again.`);
  };
  return (
    <tr>
      <th scope="row">
        <span className="cap-role-person">{name}</span>
        {person.name ? <span className="cap-role-email">{person.email}</span> : null}
        <span className="cap-role-pills">
          {(person.badges ?? []).map((b) => (
            <Pill key={b} variant="outline">
              {b}
            </Pill>
          ))}
          {person.disabledAt ? (
            <Pill variant="secondary">
              Disabled <Time at={person.disabledAt} format="date" />
            </Pill>
          ) : null}
        </span>
        {person.everyScope ? null : (
          <span className="cap-role-actions">
            {hydrated && onRoleChange ? null : (
              <Button type="submit" form={formId} size="sm">
                Save<span className="cap-sr-only"> roles for {name}</span>
              </Button>
            )}
            <form method="post" action={action} onSubmit={(e) => void access(e)}>
              <input type="hidden" name="person" value={person.id} />
              <Button type="submit" name="intent" value={disabled ? "enable" : "disable"} size="sm">
                {disabled ? "Enable" : "Disable"}
                <span className="cap-sr-only"> {name}</span>
              </Button>
            </form>
          </span>
        )}
        {person.everyScope ? null : (
          <form id={formId} method="post" action={action} hidden>
            <input type="hidden" name="intent" value="roles" />
            <input type="hidden" name="person" value={person.id} />
          </form>
        )}
      </th>
      {person.everyScope ? (
        <td colSpan={scopes.length} className="cap-muted">
          {person.everyScope}
        </td>
      ) : (
        scopes.map((scope) => {
          const choices = [{ value: "", label: noAccess }, ...options(person, scope)];
          return (
            <td key={scope.id}>
              <Select
                form={formId}
                name={`role-${scope.id}`}
                size="sm"
                aria-label={`${name} on ${scope.name}`}
                defaultValue={person.roles[scope.id] ?? ""}
                onChange={(event) => {
                  // Without a handler the row's Save posts the change; nothing is saved yet.
                  if (!onRoleChange) return;
                  const select = event.currentTarget;
                  const value = select.value;
                  const before = saved.current[scope.id] ?? person.roles[scope.id] ?? "";
                  const label = choices.find((c) => c.value === value)?.label ?? value;
                  Promise.resolve(onRoleChange(person, scope, value)).then(
                    () => {
                      saved.current[scope.id] = value;
                      message?.say(roleSavedText(name, scope.name, label));
                    },
                    (error: unknown) => {
                      select.value = before;
                      message?.say(roleFailedText(name, scope.name), { failure: true });
                      reportError(error);
                    },
                  );
                }}
                options={choices}
              />
            </td>
          );
        })
      )}
    </tr>
  );
}

// People as rows, scopes (projects, sites) as columns, a role select in each cell that saves on
// change; each row has Disable (with Undo) and, before the script runs, Save. The person stays in
// view while the scopes scroll sideways. From Carrel's People page (routes/people.tsx).
export function RoleGrid({
  people,
  scopes,
  caption,
  personHeading = "Person",
  noAccess = "No access",
  ...rest
}: RoleGridProps) {
  const hydrated = useHydrated();
  return (
    <Table
      caption={caption}
      captionHidden
      className="cap-role-grid-wrap"
      tableClassName="cap-role-grid"
    >
      <thead>
        <tr>
          <th scope="col">{personHeading}</th>
          {scopes.map((s) => (
            <th scope="col" key={s.id}>
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {people.map((p) => (
          <GridRow
            key={p.id}
            person={p}
            scopes={scopes}
            hydrated={hydrated}
            noAccess={noAccess}
            {...rest}
          />
        ))}
      </tbody>
    </Table>
  );
}
