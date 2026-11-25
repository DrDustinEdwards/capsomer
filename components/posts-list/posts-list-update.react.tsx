import { useMemo, useState } from "react";
import {
  nounsOf,
  type ContentLabels,
  type IntentResult,
  type ScheduledUpdateView,
  type SubmitIntent,
} from "../content/content.ts";
import { useIntents } from "../content/content.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import { Time } from "../time/time.react.tsx";
import { DraftCompare, DraftPatch } from "../draft-compare/draft-compare.react.tsx";
import { PageHead } from "../page-head/page-head.react.tsx";
import { inDays } from "./posts-list.ts";
import { useCleanId, useHydrated } from "../hooks/hooks.react.tsx";
import {
  RescheduleDialog,
  RescheduleField,
  cancelRequest,
  type Moving,
} from "./posts-list-dialogs.react.tsx";

export interface PostScheduledUpdateProps {
  // site-api's loadScheduledUpdate(source, id): the update's source, the live one, the patch and
  // the times.
  data: ScheduledUpdateView;
  // Where Reschedule and Cancel post: the posts list's action, which runs the kit's intents.
  action: string;
  Form?: FormComponent;
  submit?: SubmitIntent;
  result?: IntentResult | null;
  // When the live version went out (the row's publishedAt), for the live side's heading.
  liveSince?: string | null;
  // The trail above the title: the posts list, then this post.
  crumbs?: Array<{ label: string; href?: string }>;
  // The title's level: the page's h1 by default.
  headingLevel?: "h1" | "h2" | "h3";
  labels?: ContentLabels;
  now?: number;
}

// The page of the update waiting on a live post: a page head with the post's title and its
// actions, then the update beside the live post (with when it goes live) in the draft compare,
// with the unified patch under it. Reschedule… opens the dialog and Cancel the update asks
// first, posting the posts list's own intents; with no script both are plain forms under the
// head.
export function PostScheduledUpdate({
  data,
  action,
  Form = PlainForm,
  submit,
  result = null,
  liveSince,
  crumbs,
  headingLevel,
  labels,
  now,
}: PostScheduledUpdateProps) {
  const uid = useCleanId();
  const { noun } = nounsOf(labels, "post");
  const name = data.title || "Untitled";
  const names = useMemo(() => new Map([[data.id, name]]), [data.id, name]);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: action });
  // False on the server and while hydrating, true once hydrated.
  const mounted = useHydrated();
  const [moving, setMoving] = useState<Moving | null>(null);
  // The time the list was drawn, when the page does not pass one.
  const [drawnAt] = useState(() => Date.now());
  const clock = now ?? drawnAt;
  const scripted = mounted && !!submit;
  const Side = headingLevel === "h3" ? "h4" : headingLevel === "h2" ? "h3" : "h2";
  const may = data.can.publish;
  const actions = (
    <>
      {may && scripted ? (
        <button
          type="button"
          className="cap-btn"
          data-variant="primary"
          onClick={() =>
            setMoving({ id: data.id, name, at: data.publishAt, version: data.live.version })
          }
        >
          Reschedule…
        </button>
      ) : null}
      {data.can.edit ? (
        <a className="cap-btn" href={data.editorHref}>
          Edit the update
        </a>
      ) : null}
      {data.live.href ? (
        <a className="cap-btn" href={data.live.href}>
          View the live {noun}
        </a>
      ) : null}
      {may && scripted ? (
        <button
          type="button"
          className="cap-btn"
          data-variant="danger"
          data-cap-part="cancel-update"
          onClick={() => intents.ask(cancelRequest(data.id, name, noun, data.live.version))}
        >
          Cancel the update
        </button>
      ) : null}
    </>
  );
  return (
    <section
      className="cap-posts-update-view"
      data-cap="posts-list"
      aria-labelledby={`${uid}-h`}
      ref={intents.setRoot}
      // oxlint-disable-next-line react/refs -- intents holds the root ref for its handlers; rendering reads none of it
      onSubmit={intents.onSubmit}
    >
      <PageHead
        crumbs={crumbs}
        headingLevel={headingLevel}
        title={<span id={`${uid}-h`}>{name}</span>}
        actions={actions}
      />

      {intents.resultBox}

      {may && !scripted ? (
        <Form method="post" action={action} className="cap-field-row">
          <input type="hidden" name="ids" value={data.id} />
          <input type="hidden" name="versions" value={data.live.version} />
          <RescheduleField id={`${uid}-at`} at={data.publishAt} />
          <button
            type="submit"
            className="cap-btn"
            data-variant="primary"
            name="intent"
            value="reschedule"
          >
            Reschedule
          </button>
          <button
            type="submit"
            className="cap-btn"
            data-variant="danger"
            name="intent"
            value="cancel-schedule"
          >
            Cancel the update
          </button>
        </Form>
      ) : null}
      {!may ? (
        <ul className="cap-posts-withheld">
          <li>Rescheduling or canceling it needs a publisher's role.</li>
        </ul>
      ) : null}

      <div className="cap-posts-update-sides">
        <Side className="cap-posts-update-side">
          Live {noun}
          {liveSince ? (
            <span className="cap-posts-update-side-when">
              {" "}
              · on the site since <Time at={liveSince} format="exact" />
            </span>
          ) : null}
        </Side>
        <Side className="cap-posts-update-side">
          Scheduled update
          <span className="cap-posts-update-side-when">
            {" "}
            · goes live <Time at={data.publishAt} format="exact" />, {inDays(data.publishAt, clock)}
          </span>
        </Side>
      </div>
      <DraftCompare
        before={{ title: `Live ${noun}`, text: data.live.source }}
        after={{ title: "Scheduled update", text: data.source }}
        labels={{ before: "Live", after: "Scheduled" }}
        id={`${uid}-cmp`}
        heads={false}
      />
      <details className="cap-disclosure cap-posts-update-patch">
        <summary>The change as a patch</summary>
        <DraftPatch
          patch={data.patch}
          title={`The scheduled update to ${name}`}
          id={`${uid}-patch`}
        />
      </details>

      <RescheduleDialog
        moving={moving}
        action={action}
        Form={Form}
        onClose={() => setMoving(null)}
      />
      {intents.confirmDialog}
    </section>
  );
}
