import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { advisoryHeading, appliesTo, checkState, countChecks, describeGate, gateState, holdText, nameList, passedHeading, requiredHeading, siteState, sortChecks, worstState, type GateCheck, type GateSite } from "./publish-gate.ts";

const region = (page: Page, id: string) => page.locator(`#${id}`);
const publishBtn = (page: Page, id: string) => page.locator(`[data-cap-actions][data-gate="${id}"] [data-cap-part="publish"]`);

// ---------------------------------------------------------------------------------------
// Pure helpers.

const c = (id: string, required: boolean, ok: boolean, extra: Partial<GateCheck> = {}): GateCheck => ({ id, name: id, required, ok, cause: `${id} is wrong`, ...extra });

test("behaviour: gateState is blocked by a failing required check, then held, then ready", () => {
  expect(gateState([c("a", true, false), c("b", false, true)])).toBe("blocked");
  expect(gateState([c("a", true, true), c("b", false, false)])).toBe("ready");
  expect(gateState([c("a", true, true)], { by: "Rosa" })).toBe("held");
  expect(gateState([c("a", true, false)], { by: "Rosa" })).toBe("blocked");
  expect(gateState([])).toBe("ready");
});

test("behaviour: sortChecks puts failing required first, then failing advisory, then passing, keeping order", () => {
  const sorted = sortChecks([c("p1", true, true), c("a1", false, false), c("r1", true, false), c("p2", false, true), c("r2", true, false)]);
  expect(sorted.map((x) => x.id)).toEqual(["r1", "r2", "a1", "p1", "p2"]);
  expect(checkState(c("x", true, false))).toBe("failing");
  expect(checkState(c("x", false, false))).toBe("advisory");
  expect(checkState(c("x", true, true))).toBe("passed");
});

test("behaviour: the headings and the hold are said in words", () => {
  expect(requiredHeading(2)).toBe("Required, 2 failing");
  expect(advisoryHeading(3)).toBe("Advisory, 3");
  expect(passedHeading(9)).toBe("9 checks passed");
  expect(passedHeading(1)).toBe("1 check passed");
  expect(holdText({ by: "Rosa", reason: "review", untilLabel: "Fri 09:00" })).toBe("Held for review by Rosa until Fri 09:00");
  expect(nameList(["a"])).toBe("a");
  expect(nameList(["a", "b"])).toBe("a and b");
  expect(nameList(["a", "b", "c"])).toBe("a, b and c");
  expect(nameList(["a", "b", "c", "d"])).toBe("4 sites");
  expect(countChecks([c("a", true, false), c("b", false, false), c("c", true, true)])).toEqual({ requiredFailing: 1, advisoryFailing: 1, passed: 1, total: 3 });
});

test("behaviour: the overall state is the worst of the destinations, and a shared check counts once", () => {
  const sites: GateSite[] = [{ id: "a", name: "a.example" }, { id: "b", name: "b.example", published: { at: "2026-10-02T09:00:00Z", url: "https://b.example/" } }];
  const checks = [c("shared", true, false), c("only-a", true, false, { site: "a" })];
  expect(appliesTo(checks[1] as GateCheck, "b")).toBe(false);
  expect(siteState(sites[0] as GateSite, checks)).toBe("blocked");
  expect(siteState(sites[1] as GateSite, checks)).toBe("published");
  expect(worstState(["ready", "published", "held"])).toBe("held");
  const d = describeGate(sites, checks);
  expect(d.state).toBe("blocked");
  expect(d.rest).toBe(": 2 required checks failing on a.example");
  expect(describeGate([{ id: "a", name: "a.example" }], [c("x", true, true), c("y", false, false)]).rest).toBe(": nothing required is failing on a.example, 1 advisory check failing");
});

eachTheme((theme) => {
  // -------------------------------------------------------------------------------------
  // Accessibility.

  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone and control boundary reaches its contrast", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await expectContrast(page, [
      { sel: "#pg-blocked-sum .cap-status", what: "the Blocked status word" },
      { sel: "#pg-blocked-sum", what: "the summary sentence" },
      { sel: "#pg-ready-sum .cap-status", what: "the Ready status word" },
      { sel: "#pg-held-sum .cap-status", what: "the Held status word" },
      { sel: "#pg-pub-sum .cap-status", what: "the Published status word" },
      { sel: "#pg-blocked .cap-gate-title", what: "the region's heading" },
      { sel: "#pg-blocked .cap-gate-group-title", what: "a group heading" },
      { sel: "#pg-blocked-c-alt-s .cap-status", what: "a Failing status word" },
      { sel: "#pg-blocked-c-length-s .cap-status", what: "an Advisory status word" },
      { sel: "#pg-blocked-c-alt a", what: "a cause link" },
      { sel: "#pg-blocked-c-alt-d .cap-check-name", what: "a check's name" },
      { sel: "#pg-blocked-c-alt-d .cap-check-fix", what: "a fix hint" },
      { sel: "#pg-blocked-s-dustinedwards .cap-gate-site-name", what: "a destination's name" },
      { sel: "#pg-blocked-s-dustinedwards-d", what: "a destination's cause line" },
      { sel: "#pg-held-s-dustinedwards-d", what: "the hold's words" },
      { sel: "#pg-multi-c-canon .cap-row-meta", what: "the site a check concerns" },
      { sel: "[data-gate='pg-ready'] [data-cap-part='publish']", what: "the Publish button's label" },
      { sel: "[data-gate='pg-blocked'] [data-cap-part='publish']", what: "the blocked button's label" },
      { sel: "[data-gate='pg-blocked'] [data-cap-part='publish']", what: "the blocked button's edge", part: "border" },
      { sel: "[data-gate='pg-pub'] [data-cap-part='view']", what: "the View button's label" },
      { sel: "[data-gate='pg-pub'] [data-cap-part='view']", what: "the View button's edge", part: "border" },
      { sel: "#pg-blocked .cap-disclosure summary", what: "the passing checks' summary" },
    ]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await expect(page.getByRole("region", { name: "Publish checks", exact: true }).first()).toBeVisible();
    await expect(region(page, "pg-blocked").getByRole("list", { name: "Required, 2 failing" })).toBeVisible();
    await expect(region(page, "pg-blocked").getByRole("list", { name: "Advisory, 3" })).toBeVisible();
    await expect(region(page, "pg-blocked").getByRole("status")).toHaveText("Blocked: 2 required checks failing on dustinedwards.info");
    await expect(region(page, "pg-blocked-c-alt")).toMatchAriaSnapshot(`
      - listitem:
        - text: Failing
        - link /The cover image has no alt text/:
          - /url: "#field-alt"
        - paragraph: /Alt text.*Fix.*Describe what the image shows/
    `);
    // The folded passes are a disclosure with a count.
    await expect(region(page, "pg-blocked").getByText("9 checks passed")).toBeVisible();
    await expect(region(page, "pg-blocked").getByRole("link", { name: /Every image has alt text/ })).toBeHidden();
  });

  test("accessibility: the blocked button is aria-disabled, focusable and described by the summary", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const b = publishBtn(page, "pg-blocked");
    await expect(b).toHaveAttribute("aria-disabled", "true");
    await expect(b).not.toHaveAttribute("disabled", /.*/);
    await expect(b).toHaveAttribute("aria-describedby", "pg-blocked-sum");
    await b.focus();
    await expect(b).toBeFocused();
    await expect(b).toHaveAccessibleName("Publish blocked");
    await expect(b).toHaveAccessibleDescription("Blocked: 2 required checks failing on dustinedwards.info");
    await expect(publishBtn(page, "pg-held")).toHaveAccessibleName("Publish held");
    await expect(publishBtn(page, "pg-held")).toHaveAccessibleDescription(/^Held for review by Rosa until Fri 09:00/);
  });

  test("accessibility: status is a glyph, a word and a colour", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    for (const [id, word] of [["pg-blocked", "Blocked"], ["pg-ready", "Ready"], ["pg-held", "Held"], ["pg-pub", "Published"]] as const) {
      const s = region(page, id).locator(`#${id}-sum .cap-status`);
      await expect(s).toHaveText(word);
      await expect(s.locator("svg[aria-hidden='true']")).toHaveCount(1);
    }
    // The glyph differs by state, so shape alone tells blocked from ready.
    const shape = (id: string) => region(page, id).locator(`#${id}-sum svg`).innerHTML();
    expect(await shape("pg-blocked")).not.toBe(await shape("pg-ready"));
    expect(await shape("pg-held")).not.toBe(await shape("pg-ready"));
  });

  // -------------------------------------------------------------------------------------
  // Keyboard, one test per row of the doc page's table.

  test("keyboard: Tab reaches the blocked Publish button and the checks' links", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await publishBtn(page, "pg-blocked").focus();
    await expect(publishBtn(page, "pg-blocked")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(region(page, "pg-blocked-c-alt").getByRole("link")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(region(page, "pg-blocked-c-title").getByRole("link")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(region(page, "pg-blocked-c-length").getByRole("link")).toBeFocused();
  });

  test("keyboard: Enter on a blocked Publish button does nothing", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const b = publishBtn(page, "pg-blocked");
    await b.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(region(page, "pg-blocked")).toHaveAttribute("data-state", "blocked");
    await expect(b).toBeFocused();
  });

  test("keyboard: Enter on a held Publish button does nothing", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const b = publishBtn(page, "pg-held");
    await b.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(region(page, "pg-held")).toHaveAttribute("data-state", "held");
  });

  test("keyboard: Enter on Publish for a first publication opens the preview with focus on Cancel, and Esc closes it", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const b = publishBtn(page, "pg-ready");
    await b.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Publish to dustinedwards.info?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog).toContainText("dustinedwards.info: It has never been public. Publishing puts it on the blog, in the feed, the sitemap, the search index and the AI answer layer.");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(b).toBeFocused();
    await expect(region(page, "pg-ready")).toHaveAttribute("data-state", "ready");
  });

  test("keyboard: Enter on the preview's action publishes, and the button becomes View and Unpublish", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await publishBtn(page, "pg-ready").focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Publish to dustinedwards.info?" });
    await dialog.getByRole("button", { name: "Publish to dustinedwards.info" }).focus();
    await page.keyboard.press("Enter");
    await expect(region(page, "pg-ready")).toHaveAttribute("data-state", "published");
    await expect(region(page, "pg-ready-sum")).toHaveText("Published: live on dustinedwards.info");
    const box = page.locator("[data-cap-actions][data-gate='pg-ready']");
    await expect(box.getByRole("link", { name: /^View/ })).toHaveAttribute("href", "https://dustinedwards.info/blog/why-foxhound-waits");
    await expect(box.getByRole("button", { name: "Unpublish" })).toBeVisible();
    await expect(page.locator(".cap-message-item").first()).toContainText("Published to dustinedwards.info.");
  });

  test("keyboard: Enter on a check's link goes to its cause", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await region(page, "pg-blocked-c-alt").getByRole("link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#field-alt$/);
  });

  test("keyboard: Enter on Unpublish takes it off at once and says so with Undo, and z undoes it", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const box = page.locator("[data-cap-actions][data-gate='pg-pub']");
    await box.getByRole("button", { name: "Unpublish" }).focus();
    await page.keyboard.press("Enter");
    await expect(region(page, "pg-pub")).toHaveAttribute("data-state", "ready");
    await expect(page.locator(".cap-message-item").first()).toContainText("Unpublished from dustinedwards.info.");
    // Focus is not lost: it goes to the Publish button that replaced it.
    await expect(box.getByRole("button", { name: "Publish" })).toBeFocused();
    await page.keyboard.press("z");
    await expect(region(page, "pg-pub")).toHaveAttribute("data-state", "published");
    await expect(page.locator(".cap-message-item").first()).toContainText("Published to dustinedwards.info again.");
  });

  test("keyboard: Enter or Space on the passed-checks summary opens and closes them", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const summary = region(page, "pg-blocked").locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(region(page, "pg-blocked").getByRole("link", { name: "Every image has alt text" }).or(region(page, "pg-blocked").getByRole("link", { name: "The slug is unique" }))).toBeVisible();
    await page.keyboard.press("Space");
    await expect(region(page, "pg-blocked").getByRole("link", { name: "The slug is unique" })).toBeHidden();
  });

  test("keyboard: j and k move between the checks' links", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await region(page, "pg-blocked-c-alt").getByRole("link").focus();
    await page.keyboard.press("j");
    await expect(region(page, "pg-blocked-c-title").getByRole("link")).toBeFocused();
    await page.keyboard.press("j");
    await expect(region(page, "pg-blocked-c-length").getByRole("link")).toBeFocused();
    await page.keyboard.press("k");
    await expect(region(page, "pg-blocked-c-title").getByRole("link")).toBeFocused();
  });

  test("keyboard: single-key shortcuts off leave j alone", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await page.evaluate(() => document.documentElement.setAttribute("data-cap-single-keys", "off"));
    await region(page, "pg-blocked-c-alt").getByRole("link").focus();
    await page.keyboard.press("j");
    await expect(region(page, "pg-blocked-c-alt").getByRole("link")).toBeFocused();
  });

  // -------------------------------------------------------------------------------------
  // Behaviour.

  test("behaviour: every row is in the delivered HTML, with its cause, link and fix", async ({ page }) => {
    const html = await (await page.request.get("components/publish-gate/states.html")).text();
    expect(html).toContain("Blocked</span>: 2 required checks failing on dustinedwards.info");
    expect(html).toContain("Required, 2 failing");
    expect(html).toContain("Advisory, 3");
    expect(html).toContain("9 checks passed");
    expect(html).toContain('href="#field-alt"');
    expect(html).toContain("The cover image has no alt text");
    expect(html).toContain("Fix: Describe what the image shows, in a sentence.");
    expect(html).toContain("Every image has alt text");
    expect(html).toContain("Held for review by Rosa until Fri 09:00");
    expect(html).toContain('aria-disabled="true" aria-describedby="pg-blocked-sum"');
  });

  test("behaviour: failing checks come before the passing ones, required before advisory", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const order = await region(page, "pg-blocked").locator("li.cap-check").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.check));
    expect(order.slice(0, 5)).toEqual(["alt", "title", "length", "links", "sentences"]);
    await expect(region(page, "pg-blocked").locator("[data-section='passed'] li.cap-check")).toHaveCount(9);
  });

  test("behaviour: the region redraws when a check changes, and the summary announces once", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const sum = region(page, "pg-ready-sum");
    await expect(sum).toHaveText("Ready: nothing required is failing on dustinedwards.info, 3 advisory checks failing");
    await expect(publishBtn(page, "pg-ready")).not.toHaveAttribute("aria-disabled", /.+/);
    await page.getByRole("button", { name: "Break the alt text check" }).click();
    await expect(sum).toHaveText("Blocked: 1 required check failing on dustinedwards.info");
    await expect(region(page, "pg-ready")).toHaveAttribute("data-state", "blocked");
    await expect(publishBtn(page, "pg-ready")).toHaveAccessibleName("Publish blocked");
    await expect(publishBtn(page, "pg-ready")).toHaveAttribute("aria-disabled", "true");
    await expect(region(page, "pg-ready").getByRole("list", { name: "Required, 1 failing" })).toBeVisible();
    await expect(region(page, "pg-ready").getByText("10 checks passed")).toBeVisible();
    await expect(region(page, "pg-ready-s-dustinedwards-d")).toHaveText("1 required check failing: The cover image has no alt text");
    // Fixing it brings the button back.
    await page.evaluate(() => (window as unknown as { gates: Record<string, { setCheck(id: string, p: { ok: boolean }): void }> }).gates["pg-ready"]?.setCheck("alt", { ok: true }));
    await expect(sum).toHaveText("Ready: nothing required is failing on dustinedwards.info, 3 advisory checks failing");
    await expect(publishBtn(page, "pg-ready")).toHaveAccessibleName("Publish");
    await expect(region(page, "pg-ready").locator("[data-section='required']")).toBeHidden();
  });

  test("behaviour: an app only flips the data and the region follows", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await page.evaluate(() => document.getElementById("pg-blocked-c-alt")?.setAttribute("data-ok", "true"));
    await expect(region(page, "pg-blocked-sum")).toHaveText("Blocked: 1 required check failing on dustinedwards.info");
    await page.evaluate(() => document.getElementById("pg-blocked-c-title")?.setAttribute("data-ok", "true"));
    await expect(region(page, "pg-blocked-sum")).toHaveText("Ready: nothing required is failing on dustinedwards.info, 3 advisory checks failing");
    await expect(publishBtn(page, "pg-blocked")).toHaveAccessibleName("Publish");
  });

  test("behaviour: a held destination says who holds it, until when and why", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await expect(region(page, "pg-held-sum")).toHaveText("Held for review by Rosa until Fri 09:00");
    await expect(region(page, "pg-held-s-dustinedwards-d")).toHaveText("Held for review by Rosa until Fri 09:00. Waiting on the legal check for the quoted figures.");
    await expect(publishBtn(page, "pg-held")).toHaveAttribute("aria-disabled", "true");
  });

  test("behaviour: a published destination shows when, and links to the live page", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await expect(region(page, "pg-pub-sum")).toHaveText("Published: live on dustinedwards.info");
    await expect(region(page, "pg-pub-s-dustinedwards").locator("time")).toHaveAttribute("datetime", "2026-10-02T09:12:00Z");
    await expect(page.locator("[data-cap-actions][data-gate='pg-pub']").getByRole("link", { name: /^View/ })).toHaveAttribute("href", "https://dustinedwards.info/blog/why-foxhound-waits");
  });

  test("behaviour: one row per destination, the overall state is the worst, and each is published on its own", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const multi = region(page, "pg-multi");
    await expect(multi.locator("li.cap-gate-site")).toHaveCount(3);
    await expect(region(page, "pg-multi-sum")).toHaveText("Blocked: 1 required check failing on dustinedwards.info");
    await expect(region(page, "pg-multi-s-dustinedwards")).toHaveAttribute("data-state", "blocked");
    await expect(region(page, "pg-multi-s-foxhound")).toHaveAttribute("data-state", "ready");
    await expect(region(page, "pg-multi-s-carrel")).toHaveAttribute("data-state", "published");
    await expect(region(page, "pg-multi-c-canon").locator(".cap-row-meta")).toHaveText("on dustinedwards.info");
    // The blocked site's button is described by the one summary; the ready one is not blocked by it.
    await expect(multi.getByRole("button", { name: "Publish blocked, dustinedwards.info" })).toHaveAttribute("aria-disabled", "true");
    await multi.getByRole("button", { name: "Publish, foxhound.app" }).click();
    await expect(region(page, "pg-multi-s-foxhound")).toHaveAttribute("data-state", "published");
    await expect(region(page, "pg-multi-s-dustinedwards")).toHaveAttribute("data-state", "blocked");
    await expect(multi.getByRole("link", { name: "View live page, foxhound.app" })).toBeVisible();
    // A republication of what has been public is not previewed.
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.locator(".cap-message-item").first()).toContainText("Published to foxhound.app.");
  });

  test("behaviour: publishing shows Publishing... while it works", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await page.locator("#pg-multi").getByRole("button", { name: "Publish, foxhound.app" }).click();
    const b = page.locator("#pg-multi-s-foxhound [data-cap-part='publish']");
    await expect(b).toHaveAttribute("aria-busy", "true");
    await expect(b).toContainText("Publishing...");
    await expect(page.locator("#pg-multi-s-foxhound")).toHaveAttribute("data-state", "published");
  });

  test("behaviour: a failed publish says so, leaves the destination as it was, and keeps focus on the button", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const b = publishBtn(page, "pg-fail");
    await b.click();
    await expect(page.locator(".cap-message-item").first()).toContainText("Could not publish to foxhound.app: The site did not answer.");
    await expect(region(page, "pg-fail")).toHaveAttribute("data-state", "ready");
    await expect(b).toHaveAccessibleName("Publish");
    await expect(b).toBeFocused();
  });

  test("behaviour: without a script hook the button posts its form, a first publication after the preview", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await publishBtn(page, "pg-form").click();
    const dialog = page.getByRole("alertdialog", { name: "Publish to dustinedwards.info?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Publish to dustinedwards.info" }).click();
    await expect(page).toHaveURL(/intent=publish-confirmed/);
  });

  test("behaviour: the markup the server sent is the markup the module draws", async ({ page, baseURL }) => {
    await visitStates(page, "publish-gate", theme);
    const norm = (html: string) =>
      html
        .replace(/\sdata-cap-ready=""/g, "")
        .replace(/>\s+</g, "><")
        .replace(/\s+/g, " ");
    const served = await (await page.request.get(`${baseURL}components/publish-gate/states.html`)).text();
    for (const id of ["pg-blocked", "pg-held", "pg-multi"]) {
      const live = await page.evaluate((i) => {
        const el = document.getElementById(i)?.cloneNode(true) as HTMLElement;
        // Time elements are redrawn in the viewer's zone.
        for (const t of el.querySelectorAll("time")) t.textContent = "";
        return el.outerHTML;
      }, id);
      const sent = await page.evaluate(
        ([html, i]) => {
          const doc = new DOMParser().parseFromString(html as string, "text/html");
          const el = doc.getElementById(i as string) as HTMLElement;
          for (const t of el.querySelectorAll("time")) t.textContent = "";
          return el.outerHTML;
        },
        [served, id],
      );
      expect(norm(live), id).toBe(norm(sent));
    }
  });

  test("behaviour: the React component draws the same region, and its paired button follows the checks", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const sum = page.locator("#react-gate-sum");
    await expect(sum).toHaveText("Blocked: 1 required check failing on dustinedwards.info");
    const b = page.locator("[data-cap-actions][data-gate='react-gate'] [data-cap-part='publish']");
    await expect(b).toHaveAccessibleName("Publish blocked");
    await expect(b).toHaveAccessibleDescription("Blocked: 1 required check failing on dustinedwards.info");
    await expect(page.locator("#react-gate").getByRole("link", { name: "The cover image has no alt text" })).toHaveAttribute("href", "#react-field-alt");
    await expect(page.locator("#react-gate").getByRole("list", { name: "Advisory, 1" })).toBeVisible();
    await page.locator("#react-fix").click();
    await expect(sum).toHaveText("Ready: nothing required is failing on dustinedwards.info, 1 advisory check failing");
    await expect(b).toHaveAccessibleName("Publish");
    await b.click();
    await expect(b).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("#react-gate")).toHaveAttribute("data-state", "published");
    await expect(page.locator("[data-cap-actions][data-gate='react-gate']").getByRole("link", { name: "View" })).toHaveAttribute("href", "https://dustinedwards.info/blog/react-post");
    await page.locator("[data-cap-actions][data-gate='react-gate']").getByRole("button", { name: "Unpublish" }).click();
    await expect(page.locator("#react-gate")).toHaveAttribute("data-state", "ready");
  });

  for (const width of [1280, 375]) {
    test(`behaviour: at ${width}px nothing in a row overflows it and every title has room to be read`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await visitStates(page, "publish-gate", theme);
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const row of document.querySelectorAll<HTMLElement>("li.cap-row")) {
          const r = row.getBoundingClientRect();
          if (r.width === 0) continue;
          for (const el of row.querySelectorAll<HTMLElement>("*")) {
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.height === 0 || el.closest("[hidden], .cap-sr-only")) continue;
            if (b.right > r.right + 1 || b.left < r.left - 1) out.push(`${row.id} ${el.className || el.tagName} sticks out of its row`);
          }
          const t = row.querySelector<HTMLElement>(".cap-row-title");
          if (t && t.getBoundingClientRect().width < 100) out.push(`${row.id} title is ${Math.round(t.getBoundingClientRect().width)}px wide`);
        }
        return out;
      });
      expect(bad).toEqual([]);
    });
  }

  test("behaviour: at phone width the page does not scroll sideways, and every control is still reachable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await visitStates(page, "publish-gate", theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator("#pg-narrow-c-alt a")).toBeVisible();
    await expect(page.locator("#pg-multi").getByRole("button", { name: "Publish, foxhound.app" })).toBeVisible();
  });

  test("behaviour: comfortable density makes the rows taller than the compact default", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    const pad = (sel: string) => page.locator(sel).evaluate((e) => parseFloat(getComputedStyle(e).paddingTop));
    expect(await pad("#pg-comfy-s-dustinedwards")).toBeGreaterThan(await pad("#pg-narrow-s-dustinedwards"));
  });

  test("behaviour: the state is reported to the app when it changes", async ({ page }) => {
    await visitStates(page, "publish-gate", theme);
    await page.evaluate(() => {
      (window as unknown as { seen: unknown[] }).seen = [];
      document.getElementById("pg-ready")?.addEventListener("cap:gate-state", (e) => (window as unknown as { seen: unknown[] }).seen.push((e as CustomEvent).detail));
    });
    await page.getByRole("button", { name: "Break the alt text check" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { seen: Array<{ state: string }> }).seen.length)).toBe(1);
    const seen = await page.evaluate(() => (window as unknown as { seen: Array<{ state: string; sites: Record<string, string> }> }).seen);
    expect(seen[0]).toMatchObject({ state: "blocked", sites: { dustinedwards: "blocked" } });
  });
});
