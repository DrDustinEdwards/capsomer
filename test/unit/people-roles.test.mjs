// The members page's words and row actions, imported straight from the TypeScript source:
// the module touches no DOM until enhance() or a confirm runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accessText,
  cloudflareText,
  daysLeft,
  endsSoon,
  rowActions,
  syncText,
} from "../../components/people-roles/people-roles.ts";

const NOW = Date.parse("2026-11-30T15:00:00Z");

test("days left counts the end date itself as the last day", () => {
  assert.equal(daysLeft("2026-11-30", NOW), 0);
  assert.equal(daysLeft("2026-12-01", NOW), 1);
  assert.equal(daysLeft("2026-12-18", NOW), 18);
});

test("the access column: a date, and how soon only within three weeks", () => {
  const row = (endDate, status = "active", endedOn) => ({ endDate, status, endedOn });
  assert.equal(accessText(row("2027-05-14"), NOW), "Ends May 14, 2027");
  assert.equal(accessText(row("2026-12-18"), NOW), "Ends Dec 18, 2026, in 18 days");
  assert.equal(accessText(row("2026-12-01"), NOW), "Ends Dec 1, 2026, in 1 day");
  assert.equal(accessText(row("2026-11-30"), NOW), "Ends today, Nov 30, 2026");
  assert.equal(accessText(row(null), NOW), "Does not expire");
  assert.equal(accessText(row("2026-08-14", "expired"), NOW), "Ended Aug 14, 2026");
  assert.equal(accessText(row("2026-12-18", "removed", "2026-10-02"), NOW), "Removed Oct 2, 2026");
  assert.equal(endsSoon(row("2026-12-21"), NOW), true, "21 days is inside the review window");
  assert.equal(endsSoon(row("2026-12-22"), NOW), false);
  assert.equal(endsSoon(row(null), NOW), false);
  assert.equal(endsSoon(row("2026-12-18", "removed"), NOW), false);
});

test("the Cloudflare column never says ready before the allow list matches", () => {
  assert.equal(syncText({ sync: "ready", status: "active" }), "Ready: they can sign in");
  assert.equal(syncText({ sync: "ready", status: "removed" }), "Ready: signed out");
  assert.equal(syncText({ sync: "waiting", status: "active" }), "Waiting for Cloudflare");
  assert.equal(syncText({ sync: "failed", status: "active" }), "Cloudflare refused");
  assert.equal(
    cloudflareText({ cloudflare: "failed", cloudflareError: "rate limited" }),
    "Cloudflare refused: rate limited",
  );
  assert.equal(cloudflareText({ cloudflare: "accepted" }), "Cloudflare accepted");
});

test("row actions: Retry first while Cloudflare lags, Renew otherwise, nothing for a person the viewer cannot manage", () => {
  const base = { manageable: true, status: "active", sync: "ready", renewTo: "2027-05-14" };
  const values = (r) => r.items.map((i) => i.value);
  let r = rowActions(base, true, "?change=a", "?person=a");
  assert.deepEqual(r.primary, { intent: "renew", label: "Renew to May 14, 2027" });
  assert.deepEqual(values(r), ["change", "history", "remove"]);
  r = rowActions({ ...base, sync: "waiting" }, true, "?change=a", "?person=a");
  assert.equal(r.primary?.intent, "retry");
  assert.deepEqual(values(r), ["renew", "change", "history", "remove"]);
  r = rowActions({ ...base, status: "removed" }, true, "?change=a", "?person=a");
  assert.equal(r.primary, null);
  assert.deepEqual(
    values(r),
    ["history"],
    "a removed person is added again, not renewed or removed",
  );
  r = rowActions(
    { ...base, status: "expired", renewTo: "2026-12-18" },
    true,
    "?change=a",
    "?person=a",
  );
  assert.equal(r.primary?.intent, "renew");
  assert.deepEqual(values(r), ["history", "remove"], "no title change for an expired person");
  assert.deepEqual(rowActions({ ...base, manageable: false }, true, "", ""), {
    primary: null,
    items: [],
  });
  assert.equal(
    rowActions(base, true, "", "").items.find((i) => i.value === "remove")?.danger,
    true,
  );
});

test("personFromParam: names only a person the page lists, and for a change one the viewer manages", async () => {
  const { personFromParam } = await import("../../components/people-roles/people-roles.ts");
  const emails = ["rosa@example.com", "lee@example.com"];
  const p = (q) => new URLSearchParams(q);
  assert.equal(personFromParam(p("person=Rosa@Example.com"), "person", emails), "rosa@example.com");
  assert.equal(personFromParam(p("person=someone@example.com"), "person", emails), undefined);
  assert.equal(
    personFromParam(p("change=lee@example.com"), "change", emails, (e) => e !== "lee@example.com"),
    undefined,
  );
});
