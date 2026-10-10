// The members page's words and row actions, imported straight from the TypeScript source:
// the module touches no DOM until enhance() or a confirm runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { accessText, actionText, cloudflareText, dayText, daysLeft, endHelp, endsSoon, rowActions, syncText, tallyText, timeText } from "../../components/people-roles/people-roles.ts";

const NOW = Date.parse("2026-11-30T15:00:00Z");

test("dates read as day, month and year in UTC", () => {
  assert.equal(dayText("2026-12-18"), "18 Dec 2026");
  assert.equal(dayText("2027-01-01"), "1 Jan 2027");
  assert.equal(timeText("2026-10-02T14:52:00Z"), "2 Oct 2026, 14:52 UTC");
});

test("days left counts the end date itself as the last day", () => {
  assert.equal(daysLeft("2026-11-30", NOW), 0);
  assert.equal(daysLeft("2026-12-01", NOW), 1);
  assert.equal(daysLeft("2026-12-18", NOW), 18);
});

test("the access column: a date, and how soon only within three weeks", () => {
  const row = (endDate, status = "active", endedOn) => ({ endDate, status, endedOn });
  assert.equal(accessText(row("2027-05-14"), NOW), "Ends 14 May 2027");
  assert.equal(accessText(row("2026-12-18"), NOW), "Ends 18 Dec 2026, in 18 days");
  assert.equal(accessText(row("2026-12-01"), NOW), "Ends 1 Dec 2026, in 1 day");
  assert.equal(accessText(row("2026-11-30"), NOW), "Ends today, 30 Nov 2026");
  assert.equal(accessText(row(null), NOW), "Does not expire");
  assert.equal(accessText(row("2026-08-14", "expired"), NOW), "Ended 14 Aug 2026");
  assert.equal(accessText(row("2026-12-18", "removed", "2026-10-02"), NOW), "Removed 2 Oct 2026");
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
  assert.equal(cloudflareText({ cloudflare: "failed", cloudflareError: "rate limited" }), "Cloudflare refused: rate limited");
  assert.equal(cloudflareText({ cloudflare: "accepted" }), "Cloudflare accepted");
});

test("history lines say what changed", () => {
  assert.equal(actionText({ action: "add", toTitle: "Lab worker", endDate: "2026-12-18" }), "Added as Lab worker, until 18 Dec 2026");
  assert.equal(actionText({ action: "change_title", fromTitle: "Lab worker", toTitle: "Safety officer" }), "Title changed from Lab worker to Safety officer");
  assert.equal(actionText({ action: "renew", endDate: "2027-05-14" }), "Renewed, until 14 May 2027");
  assert.equal(actionText({ action: "expire" }), "Access ended on the end date");
});

test("the add form's end date help and the review tally", () => {
  assert.equal(endHelp("2026-12-18"), "Defaults to the end of the term, 18 Dec 2026. You can choose an earlier date.");
  assert.equal(endHelp(null), "This title does not expire.");
  assert.equal(tallyText(1, 0, 2), "1 to keep, 0 to remove, 2 not answered.");
  assert.equal(tallyText(2, 1, 0), "2 to keep, 1 to remove.");
});

test("row actions: Retry first while Cloudflare lags, Renew otherwise, nothing for a person the viewer cannot manage", () => {
  const base = { manageable: true, status: "active", sync: "ready", renewTo: "2027-05-14" };
  const values = (r) => r.items.map((i) => i.value);
  let r = rowActions(base, true, "?change=a", "?person=a");
  assert.deepEqual(r.primary, { intent: "renew", label: "Renew to 14 May 2027" });
  assert.deepEqual(values(r), ["change", "history", "remove"]);
  r = rowActions({ ...base, sync: "waiting" }, true, "?change=a", "?person=a");
  assert.equal(r.primary?.intent, "retry");
  assert.deepEqual(values(r), ["renew", "change", "history", "remove"]);
  r = rowActions({ ...base, status: "removed" }, true, "?change=a", "?person=a");
  assert.equal(r.primary, null);
  assert.deepEqual(values(r), ["history"], "a removed person is added again, not renewed or removed");
  r = rowActions({ ...base, status: "expired", renewTo: "2026-12-18" }, true, "?change=a", "?person=a");
  assert.equal(r.primary?.intent, "renew");
  assert.deepEqual(values(r), ["history", "remove"], "no title change for an expired person");
  assert.deepEqual(rowActions({ ...base, manageable: false }, true, "", ""), { primary: null, items: [] });
  assert.equal(rowActions(base, true, "", "").items.find((i) => i.value === "remove")?.danger, true);
});
