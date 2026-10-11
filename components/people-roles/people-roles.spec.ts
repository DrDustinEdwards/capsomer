import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const lead = (page: Page) => page.locator("[aria-labelledby='s-lead'] [data-cap='people-roles']");
// A row's Actions menu trigger. Chromium does not give a summary the button role, so it is found by tag.
const actionsFor = (page: Page, name: string) => lead(page).locator(`tr[data-name='${name}'] summary`);

// The posts a page sends to the specimens' action, answered with an empty page.
async function catchPosts(page: Page): Promise<URLSearchParams[]> {
  const posts: URLSearchParams[] = [];
  await page.route("**/lab/members", async (route) => {
    posts.push(new URLSearchParams(route.request().postData() ?? ""));
    await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Posted</title><main><h1>Posted</h1></main>" });
  });
  return posts;
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    await expectContrast(page, [
      { sel: "#pr-lead-h ~ .cap-people-count", what: "the count" },
      { sel: "[aria-labelledby='s-lead'] .cap-people-lead", what: "the lead line" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Rosa Park'] .cap-people-email", what: "an email" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Rosa Park'] .cap-people-end", what: "an end date close enough to mark" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Rosa Park'] .cap-status", what: "Ready" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Sam Ortiz'] .cap-status", what: "Waiting for Cloudflare" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Lee Wong'] .cap-status", what: "Cloudflare refused" },
      { sel: "[aria-labelledby='s-lead'] .cap-people-sync-error", what: "Cloudflare's reason" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Jo Kim'] .cap-people-name", what: "a removed person's name" },
      { sel: "[aria-labelledby='s-lead'] tr[data-name='Ana Ruiz'] td", what: "an expired person's title" },
      { sel: "[aria-labelledby='s-review'] .cap-people-review-who", what: "a title in the review" },
      { sel: "[aria-labelledby='s-review'] [data-cap-part='tally']", what: "the review's tally" },
      { sel: "[aria-labelledby='s-history'] .cap-people-history-when", what: "a history time" },
      { sel: "[aria-labelledby='s-history'] .cap-people-history-reason", what: "a recorded reason" },
      { sel: "[aria-labelledby='s-refused'] .cap-people-result", what: "a refused result" },
      { sel: "[aria-labelledby='s-review'] .cap-people-card", what: "the review card's edge", part: "border" },
      { sel: "[aria-labelledby='s-review'] input[type='radio']", what: "a review choice's edge", part: "border" },
    ]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    await expect(lead(page).locator("tr[data-name='Rosa Park']")).toMatchAriaSnapshot(`
      - rowheader "Rosa Park rosa.park@example.edu"
      - cell "Lab worker"
      - cell "Ends 18 Dec 2026, in 18 days"
      - 'cell "Ready: they can sign in"'
      - cell "Renew to 14 May 2027 for Rosa Park":
        - button "Renew to 14 May 2027 for Rosa Park"
        - group
    `);
    await expect(lead(page).locator("tr[data-name='Rosa Park'] summary")).toHaveAccessibleName("Actions for Rosa Park");
    await expect(lead(page).getByRole("region", { name: "Lab members" })).toBeVisible();
    await expect(page.locator("[aria-labelledby='s-owner'] .cap-people-result")).toHaveRole("status");
    await expect(page.locator("[aria-labelledby='s-refused'] .cap-people-result")).toHaveRole("alert");
    await expect(page.locator("[aria-labelledby='s-change']").getByRole("textbox", { name: "Reason" })).toHaveAccessibleDescription("One line, recorded with the change.");
  });

  test("keyboard: Tab moves from the table through a row's inline action to its Actions menu", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    await lead(page).locator("tr[data-name='Maya Chen'] a").focus();
    await page.keyboard.press("Tab");
    await expect(lead(page).getByRole("button", { name: "Renew to 14 May 2027 for Rosa Park" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(actionsFor(page, "Rosa Park")).toBeFocused();
  });

  test("keyboard: Remove asks first, and Esc cancels without posting", async ({ page }) => {
    const posts = await catchPosts(page);
    await visitStates(page, "people-roles", theme);
    const actions = actionsFor(page, "Rosa Park");
    await actions.focus();
    await page.keyboard.press("Enter");
    const remove = lead(page).locator("tr[data-name='Rosa Park']").getByRole("button", { name: "Remove" });
    await remove.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Remove Rosa Park?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("rosa.park@example.edu comes off the allow list and their Cloudflare seat is freed.");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(posts).toHaveLength(0);
  });

  test("behaviour: a confirmed Remove posts intent=remove with confirmed=yes", async ({ page }) => {
    const posts = await catchPosts(page);
    await visitStates(page, "people-roles", theme);
    await actionsFor(page, "Rosa Park").click();
    await lead(page).locator("tr[data-name='Rosa Park']").getByRole("button", { name: "Remove" }).click();
    await page.getByRole("alertdialog", { name: "Remove Rosa Park?" }).getByRole("button", { name: "Remove" }).click();
    await expect.poll(() => posts.length).toBe(1);
    const [post] = posts;
    expect(post?.get("intent")).toBe("remove");
    expect(post?.get("email")).toBe("rosa.park@example.edu");
    expect(post?.get("confirmed")).toBe("yes");
  });

  test("keyboard: Enter in an empty reason says so beside the field and keeps focus there", async ({ page }) => {
    const posts = await catchPosts(page);
    await visitStates(page, "people-roles", theme);
    const reason = page.locator("[aria-labelledby='s-change']").getByRole("textbox", { name: "Reason" });
    await reason.focus();
    await page.keyboard.press("Enter");
    await expect(reason).toBeFocused();
    await expect(reason).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("[aria-labelledby='s-change'] .cap-people-change .cap-field-error").last()).toHaveText("Type a reason. It is recorded with the change.");
    expect(posts).toHaveLength(0);
  });

  test("keyboard: arrow keys move between Keep and Remove, and the tally counts", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    const review = page.locator("[aria-labelledby='s-review'] form.cap-people-review");
    const tally = review.locator("[data-cap-part='tally']");
    await expect(tally).toHaveText("0 to keep, 0 to remove, 2 not answered.");
    // A group with nothing chosen is :indeterminate; its radios must still paint as unchosen.
    const keep = review.getByRole("radio", { name: "Keep, until 14 May 2027" }).first();
    const fill = () => keep.evaluate((el) => getComputedStyle(el).backgroundColor);
    // What a chosen radio fills with (field.css: background var(--primary)), resolved here.
    const chosen = await keep.evaluate((el) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--primary)";
      el.parentElement!.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(await fill(), "an unanswered radio paints as unchosen").not.toBe(chosen);
    await keep.check();
    // The fill is a transition, so wait for it to arrive rather than read its first frame.
    await expect.poll(fill, { message: "a chosen radio fills" }).toBe(chosen);
    await expect(tally).toHaveText("1 to keep, 0 to remove, 1 not answered.");
    await page.keyboard.press("ArrowDown");
    await expect(review.getByRole("radio", { name: "Remove" }).first()).toBeChecked();
    await expect(tally).toHaveText("0 to keep, 1 to remove, 1 not answered.");
  });

  test("behaviour: the add form's end date follows the title, and a title that does not expire has none", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    const add = page.locator("[aria-labelledby='s-owner'] form.cap-people-add");
    // Found by name attribute: a hidden field leaves the accessibility tree.
    const end = add.locator("input[name='end_date']");
    await expect(end).toHaveAccessibleName("Access ends");
    await expect(end).toHaveValue("2027-05-14");
    await expect(end).toHaveAttribute("max", "2027-05-14");
    await add.getByRole("combobox", { name: "Title" }).selectOption("lab_worker");
    await expect(end).toHaveValue("2026-12-18");
    await expect(end).toHaveAttribute("max", "2026-12-18");
    await add.getByRole("combobox", { name: "Title" }).selectOption("owner");
    await expect(end).toBeHidden();
    await expect(end).toBeDisabled();
    await expect(add.locator("[data-cap-part='end-help']")).toHaveText("This title does not expire.");
  });

  test("behaviour: the viewer's own row offers only their history", async ({ page }) => {
    await visitStates(page, "people-roles", theme);
    const own = lead(page).locator("tr[data-name='Maya Chen']");
    await expect(own.getByText("You", { exact: true })).toBeVisible();
    await expect(own.getByRole("button")).toHaveCount(0);
    await expect(own.getByRole("link", { name: "History for Maya Chen" })).toBeVisible();
  });
});
