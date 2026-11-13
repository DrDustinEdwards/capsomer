import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import { Select } from "../select/select.react.tsx";
import { Pill } from "../status/status.react.tsx";
import { Table } from "../table/table.react.tsx";
import { Time } from "../time/time.react.tsx";
import { enhance as enhanceFields } from "../field/field.ts";
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { FormMenu } from "../menu/menu.react.tsx";
import { Glyph, type Tone } from "../status/status.react.tsx";
import {
  REASON_MISSING,
  accessText,
  actionText,
  cloudflareText,
  confirmRemove,
  dayText,
  endHelp,
  endsSoon,
  removeBody,
  removeTarget,
  rowActions,
  syncText,
  tallyText,
  timeText,
  personName,
  roleFailedText,
  roleSavedText,
  type HistoryEntry,
  type PersonRow,
  type RoleGridPerson,
  type RoleOption,
  type RoleScope,
  type TitleOption,
} from "./people-roles.ts";
import { useCleanId, useHydrated } from "../hooks/hooks.react.tsx";

export type { HistoryEntry, PersonRow, RoleGridPerson, RoleOption, RoleScope, TitleOption };

export interface PeopleData {
  // The app's name as the heading reads it: "Lab members".
  heading: string;
  // One line under the heading: "You manage Lab workers."
  lead?: string;
  people: PersonRow[];
  // The titles the viewer may give, below their own layer and within their permissions.
  titles: TitleOption[];
  // People whose review is open, with the date their access ends. Empty or absent: no review.
  review?: {
    endDate: string;
    people: Array<Pick<PersonRow, "email" | "name" | "title" | "renewTo">>;
  };
  // One person's history, when the address asks for it (`?person=`).
  history?: { email: string; name: string; entries: HistoryEntry[] };
  // The person whose title is being changed (`?change=`).
  changing?: string;
  // The answer to the last post.
  result?: { ok: boolean; text: string };
}

export interface PeopleRolesProps {
  data: PeopleData;
  // Where every form posts. Each carries `intent`: add, change_title, renew, remove, retry, review.
  action: string;
  // Today, for "ends in 5 days". Defaults to now.
  now?: number;
  // Builds the address that opens a person's history or change-title row. Defaults to `?person=` and `?change=`.
  hrefFor?: (kind: "person" | "change", email: string) => string;
  // Where Close goes, from a history or a change-title row. Defaults to "?".
  closeHref?: string;
  // Runs a post in place instead of a page load. The page shows `data.result` when it comes back.
  onIntent?: (intent: string, fields: FormData) => void | Promise<void>;
  // The `h` level of the heading. The cards and the history use the next one down.
  headingLevel?: 2 | 3;
}

const TONE: Record<PersonRow["sync"], Tone> = { ready: "ok", waiting: "info", failed: "crit" };
const HISTORY_TONE: Record<HistoryEntry["cloudflare"], Tone> = {
  accepted: "ok",
  pending: "info",
  failed: "crit",
};

function defaultHref(kind: "person" | "change", email: string): string {
  return `?${kind}=${encodeURIComponent(email)}`;
}

function Hidden({ fields }: { fields: Record<string, string> }) {
  return (
    <>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export function PeopleRoles({
  data,
  action,
  now: nowProp,
  hrefFor = defaultHref,
  closeHref = "?",
  onIntent,
  headingLevel = 2,
}: PeopleRolesProps) {
  // The time the page was drawn, when the page does not pass one.
  const [drawnAt] = useState(() => Date.now());
  const now = nowProp ?? drawnAt;
  const id = useCleanId();
  const H = `h${headingLevel}` as "h2" | "h3";
  const Sub = `h${headingLevel + 1}` as "h3" | "h4";
  const live = data.people.filter((p) => p.status === "active").length;
  const root = useRef<HTMLElement>(null);
  // The add and change-title forms check their fields beside each field.
  useEffect(
    () => (root.current ? enhanceFields(root.current) : undefined),
    [data.changing, data.titles.length],
  );

  // Every form in the page posts through here: Remove asks first, and with `onIntent` the
  // app runs the post in place instead of the browser loading a page.
  const onSubmitCapture = (e: FormEvent<HTMLElement>) => {
    const form = e.target as HTMLFormElement;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fields = new FormData(form, submitter);
    const intent = String(fields.get("intent") ?? "");
    // A form with a wrong field is the field component's to answer, beside the field.
    if (!form.checkValidity()) return;
    if (intent === "remove" && fields.get("confirmed") !== "yes") {
      e.preventDefault();
      void (onIntent ? confirmRemoveInPlace(form, onIntent) : confirmRemove(form));
      return;
    }
    if (!onIntent || e.defaultPrevented) return;
    e.preventDefault();
    void onIntent(intent, fields);
  };

  return (
    <section
      className="cap-people"
      data-cap="people-roles"
      aria-labelledby={`${id}-h`}
      onSubmitCapture={onSubmitCapture}
      ref={root}
    >
      <div className="cap-people-head">
        <H id={`${id}-h`}>{data.heading}</H>
        <p className="cap-people-count">
          {live} {live === 1 ? "person has" : "people have"} access
        </p>
      </div>
      {data.lead ? <p className="cap-people-lead">{data.lead}</p> : null}
      {data.result ? (
        <p
          className="cap-people-result"
          role={data.result.ok ? "status" : "alert"}
          data-tone={data.result.ok ? "ok" : "crit"}
        >
          <span className="cap-status" data-tone={data.result.ok ? "ok" : "crit"}>
            <Glyph name={data.result.ok ? "ok" : "crit"} />
            <span className="cap-sr-only">{data.result.ok ? "Done:" : "Not done:"}</span>
          </span>
          <span>{data.result.text}</span>
        </p>
      ) : null}

      {data.review && data.review.people.length ? (
        <Review id={id} Sub={Sub} review={data.review} action={action} />
      ) : null}

      <div className="cap-table-wrap" role="region" aria-labelledby={`${id}-h`} tabIndex={0}>
        <table className="cap-table cap-people-table">
          <thead>
            <tr>
              <th scope="col">Person</th>
              <th scope="col">Title</th>
              <th scope="col">Access</th>
              <th scope="col">Cloudflare</th>
              <th scope="col">
                <span className="cap-sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.people.map((p) => (
              <PersonRows
                key={p.email}
                p={p}
                now={now}
                action={action}
                titles={data.titles}
                changing={data.changing === p.email}
                hrefFor={hrefFor}
                closeHref={closeHref}
              />
            ))}
          </tbody>
        </table>
      </div>

      {data.history ? (
        <History id={id} Sub={Sub} history={data.history} closeHref={closeHref} />
      ) : null}

      {data.titles.length ? (
        <AddForm id={id} Sub={Sub} titles={data.titles} action={action} />
      ) : null}
    </section>
  );
}

// Asks, then hands the post to the app with `confirmed=yes`.
function confirmRemoveInPlace(
  form: HTMLFormElement,
  onIntent: NonNullable<PeopleRolesProps["onIntent"]>,
): Promise<boolean> {
  const { name, email } = removeTarget(form);
  return confirm({
    title: `Remove ${name}?`,
    body: removeBody(name, email),
    action: "Remove",
    returnTo: form.closest<HTMLElement>("[data-cap='people-roles']"),
    perform: async () => {
      const fields = new FormData(form);
      fields.set("intent", "remove");
      fields.set("confirmed", "yes");
      await onIntent("remove", fields);
    },
  });
}

interface RowProps {
  p: PersonRow;
  now: number;
  action: string;
  titles: TitleOption[];
  changing: boolean;
  hrefFor: (kind: "person" | "change", email: string) => string;
  closeHref: string;
}

function PersonRows({ p, now, action, titles, changing, hrefFor, closeHref }: RowProps) {
  const soon = endsSoon(p, now);
  const who = <span className="cap-sr-only"> for {p.name}</span>;
  const editId = `pr-change-${p.email.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const { primary, items } = rowActions(
    p,
    titles.length > 0,
    changing ? closeHref : hrefFor("change", p.email),
    hrefFor("person", p.email),
  );
  return (
    <>
      <tr data-status={p.status} data-email={p.email} data-name={p.name}>
        <th scope="row" className="cap-people-who">
          <span className="cap-people-name">
            {p.name}
            {p.you ? (
              <span className="cap-pill cap-people-you" data-variant="secondary">
                You
              </span>
            ) : null}
          </span>
          <span className="cap-people-email cap-mono">{p.email}</span>
        </th>
        <td>{p.title}</td>
        <td>
          <span className="cap-people-end" data-soon={soon ? "" : undefined}>
            {soon ? <Glyph name="warn" /> : null}
            {accessText(p, now)}
          </span>
        </td>
        <td className="cap-people-sync">
          <span className="cap-status" data-tone={TONE[p.sync]}>
            <Glyph name={p.sync === "waiting" ? "running" : TONE[p.sync]} />
            {syncText(p)}
          </span>
          {p.sync === "failed" && p.syncError ? (
            <span className="cap-people-sync-error">{p.syncError}</span>
          ) : null}
        </td>
        <td className="cap-people-actions">
          <div className="cap-people-acts">
            {primary ? (
              <form method="post" action={action}>
                <Hidden fields={{ intent: primary.intent, email: p.email }} />
                <button type="submit" className="cap-btn" data-size="sm">
                  {primary.label}
                  {who}
                </button>
              </form>
            ) : null}
            {p.manageable ? (
              <FormMenu
                label="Actions"
                aria-label={`Actions for ${p.name}`}
                action={action}
                hidden={{ email: p.email }}
                items={items}
              />
            ) : (
              <a className="cap-btn" data-size="sm" href={hrefFor("person", p.email)}>
                History{who}
              </a>
            )}
          </div>
        </td>
      </tr>
      {changing ? (
        <ChangeRow id={editId} p={p} titles={titles} action={action} closeHref={closeHref} />
      ) : null}
    </>
  );
}

function ChangeRow({
  id,
  p,
  titles,
  action,
  closeHref,
}: {
  id: string;
  p: PersonRow;
  titles: TitleOption[];
  action: string;
  closeHref: string;
}) {
  const first = useRef<HTMLSelectElement>(null);
  useEffect(() => first.current?.focus(), []);
  const others = titles.filter((t) => t.label !== p.title);
  return (
    <tr className="cap-people-edit" id={id}>
      <td colSpan={5}>
        <form
          className="cap-people-change cap-field-row"
          data-cap="field"
          method="post"
          action={action}
          aria-label={`Change ${p.name}'s title`}
        >
          <Hidden fields={{ intent: "change_title", email: p.email }} />
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${id}-title`}>
              New title for {p.name}
            </label>
            <div className="cap-select-wrap" data-cap="select" data-native="">
              <select ref={first} className="cap-select" id={`${id}-title`} name="title" required>
                {others.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${id}-reason`}>
              Reason{" "}
              <span className="cap-field-required" aria-hidden="true">
                Required
              </span>
            </label>
            <p className="cap-field-help" id={`${id}-reason-h`}>
              One line, recorded with the change.
            </p>
            <input
              className="cap-input"
              id={`${id}-reason`}
              name="reason"
              required
              autoComplete="off"
              maxLength={200}
              aria-describedby={`${id}-reason-e ${id}-reason-h`}
              data-error-value-missing={REASON_MISSING}
            />
            <p className="cap-field-error" id={`${id}-reason-e`} hidden></p>
          </div>
          <div className="cap-people-change-actions">
            <button type="submit" className="cap-btn" data-variant="primary">
              Change title
            </button>
            <a className="cap-btn" href={closeHref}>
              Cancel
            </a>
          </div>
        </form>
      </td>
    </tr>
  );
}

function Review({
  id,
  Sub,
  review,
  action,
}: {
  id: string;
  Sub: "h3" | "h4";
  review: NonNullable<PeopleData["review"]>;
  action: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const keep = Object.values(answers).filter((v) => v === "keep").length;
  const removeCount = Object.values(answers).filter((v) => v === "remove").length;
  const open = review.people.length - keep - removeCount;
  return (
    <form
      className="cap-people-card cap-people-review"
      data-variant="review"
      method="post"
      action={action}
      aria-labelledby={`${id}-rv`}
    >
      <Hidden fields={{ intent: "review" }} />
      <Sub id={`${id}-rv`}>Still on your team?</Sub>
      <p className="cap-people-lead">
        These people's access ends on {dayText(review.endDate)}. Keep or remove each. Anyone not
        answered loses access on that date.
      </p>
      <div className="cap-people-review-list">
        {review.people.map((p, i) => (
          <fieldset key={p.email} className="cap-people-review-item">
            <legend>
              {p.name} <span className="cap-people-review-who">{p.title}</span>
            </legend>
            <label className="cap-check">
              <input
                type="radio"
                name={`answer-${i}`}
                value="keep"
                onChange={() => setAnswers((a) => ({ ...a, [p.email]: "keep" }))}
              />{" "}
              Keep{p.renewTo ? `, until ${dayText(p.renewTo)}` : ""}
            </label>
            <label className="cap-check">
              <input
                type="radio"
                name={`answer-${i}`}
                value="remove"
                onChange={() => setAnswers((a) => ({ ...a, [p.email]: "remove" }))}
              />{" "}
              Remove
            </label>
            <input type="hidden" name={`email-${i}`} value={p.email} />
          </fieldset>
        ))}
      </div>
      <div className="cap-people-review-foot">
        <button type="submit" className="cap-btn" data-variant="primary">
          Save review
        </button>
        <p className="cap-people-tally" data-cap-part="tally" aria-live="polite">
          {tallyText(keep, removeCount, open)}
        </p>
      </div>
    </form>
  );
}

function History({
  id,
  Sub,
  history,
  closeHref,
}: {
  id: string;
  Sub: "h3" | "h4";
  history: NonNullable<PeopleData["history"]>;
  closeHref: string;
}) {
  return (
    <section className="cap-people-history" aria-labelledby={`${id}-hi`}>
      <div className="cap-people-history-head">
        <Sub id={`${id}-hi`}>History for {history.name}</Sub>
        <a className="cap-btn" data-size="sm" href={closeHref}>
          Close history
        </a>
      </div>
      {history.entries.length ? (
        <ol className="cap-people-history-list">
          {history.entries.map((e) => (
            <li key={`${e.at}-${e.action}`} className="cap-people-history-item">
              <time className="cap-people-history-when" dateTime={e.at}>
                {timeText(e.at)}
              </time>
              <div>
                <p className="cap-people-history-what">{actionText(e)}</p>
                <span className="cap-people-history-by">By {e.by}</span>
                {e.reason ? (
                  <span className="cap-people-history-reason">Reason: {e.reason}</span>
                ) : null}
              </div>
              <span className="cap-status" data-tone={HISTORY_TONE[e.cloudflare]}>
                <Glyph name={e.cloudflare === "pending" ? "running" : HISTORY_TONE[e.cloudflare]} />
                {cloudflareText(e)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cap-people-lead">No changes recorded yet.</p>
      )}
    </section>
  );
}

function AddForm({
  id,
  Sub,
  titles,
  action,
}: {
  id: string;
  Sub: "h3" | "h4";
  titles: TitleOption[];
  action: string;
}) {
  const [title, setTitle] = useState(titles[0]?.value ?? "");
  const chosen = titles.find((t) => t.value === title) ?? titles[0];
  const [end, setEnd] = useState(chosen?.defaultEnd ?? "");
  useEffect(() => {
    if (!chosen?.defaultEnd) return;
    // oxlint-disable-next-line react/set-state-in-effect -- a new title clamps the end date someone typed to its default
    setEnd((v) => (!v || v > (chosen.defaultEnd as string) ? (chosen.defaultEnd as string) : v));
  }, [chosen?.defaultEnd]);
  const expires = !!chosen?.defaultEnd;
  return (
    <form
      className="cap-people-card cap-people-add"
      data-cap="field"
      method="post"
      action={action}
      aria-labelledby={`${id}-add`}
    >
      <Hidden fields={{ intent: "add" }} />
      <Sub id={`${id}-add`}>Add a person</Sub>
      <div className="cap-fields cap-people-add-fields">
        <Field
          id={`${id}-email`}
          label="Email"
          help="The address they sign in with. Cloudflare emails them a code."
        >
          <input
            className="cap-input"
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-email-e ${id}-email-h`}
            data-error-value-missing="Type their email."
            data-error-type-mismatch="Type a full email, such as name@example.edu."
          />
        </Field>
        <Field id={`${id}-name`} label="Name">
          <input
            className="cap-input"
            id={`${id}-name`}
            name="name"
            required
            autoComplete="off"
            aria-describedby={`${id}-name-e`}
            data-error-value-missing="Type their name."
          />
        </Field>
        <Field id={`${id}-title`} label="Title">
          <div className="cap-select-wrap" data-cap="select" data-native="">
            <select
              className="cap-select"
              id={`${id}-title`}
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              {titles.map((t) => (
                <option key={t.value} value={t.value} data-end={t.defaultEnd ?? ""}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field
          id={`${id}-end`}
          label="Access ends"
          help={endHelp(chosen?.defaultEnd ?? null)}
          helpPart="end-help"
          hidden={!expires}
        >
          <input
            className="cap-input"
            id={`${id}-end`}
            name="end_date"
            type="date"
            required={expires}
            disabled={!expires}
            max={chosen?.defaultEnd ?? undefined}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-describedby={`${id}-end-e ${id}-end-h`}
            data-error-value-missing="Choose the date their access ends."
            data-error-range-overflow="Choose a date no later than the end of the term."
          />
        </Field>
      </div>
      <div className="cap-people-add-foot">
        <button type="submit" className="cap-btn" data-variant="primary">
          Add person
        </button>
        <p className="cap-people-tally">
          They can sign in once Cloudflare confirms, usually within a minute.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  help,
  helpPart,
  hidden,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  helpPart?: string;
  hidden?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="cap-field" hidden={hidden}>
      <label className="cap-field-label" htmlFor={id}>
        {label}{" "}
        <span className="cap-field-required" aria-hidden="true">
          Required
        </span>
      </label>
      {help ? (
        <p className="cap-field-help" id={`${id}-h`} data-cap-part={helpPart}>
          {help}
        </p>
      ) : null}
      {children}
      <p className="cap-field-error" id={`${id}-e`} hidden></p>
    </div>
  );
}

// ---- RoleGrid: people by scopes, a role in each cell --------------------------------------

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
