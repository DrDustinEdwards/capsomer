import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations in any state", async ({ page }) => {
    await visitStates(page, "sign-in", theme);
    await expect(
      page.getByRole("button", { name: "Sign in with a passkey" }).first(),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations on a page of its own", async ({ page }) => {
    await visitStates(page, "sign-in", theme, "screen");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test("behavior: the ways in are one column of full-width buttons, at 320px too", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await visitStates(page, "sign-in", "light");
  const card = page.locator("[data-mount='social'] .cap-auth-card");
  const box = (await card.boundingBox())!;
  for (const name of [
    "Sign in with a passkey",
    "Continue with Google",
    "Continue with Apple",
    "Email me a sign-in link",
  ]) {
    const button = (await card.getByRole("button", { name }).boundingBox())!;
    expect(button.width, name).toBeGreaterThan(box.width - 2 * 40);
    expect(button.x + button.width, name).toBeLessThanOrEqual(box.x + box.width);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("behavior: the email field offers saved passkeys, and the code field takes a pasted code with its space", async ({
  page,
}) => {
  await visitStates(page, "sign-in", "light");
  const email = page.locator("[data-mount='plain']").getByLabel("Email");
  await expect(email).toHaveAttribute("autocomplete", "username webauthn");
  await expect(email).toHaveAttribute("type", "email");
  const code = page.locator("[data-mount='sent']").getByLabel("Code");
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await expect(code).toHaveAttribute("inputmode", "numeric");
  await code.fill("123 456");
  await expect(code).toHaveValue("123 456");
});

test("behavior: a refused passkey says so beside its button; a refused link and a wrong code describe their field", async ({
  page,
}) => {
  await visitStates(page, "sign-in", "light");
  const plain = page.locator("[data-mount='plain']");
  await plain.getByRole("button", { name: "Sign in with a passkey" }).click();
  await expect(plain.getByRole("alert")).toHaveText(
    "That passkey did not sign you in. Try again, or use another way.",
  );

  const email = page.locator("[data-mount='error']").getByLabel("Email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("Complete the check, then send the link again.");
  const code = page.locator("[data-mount='code-error']").getByLabel("Code");
  await expect(code).toHaveAttribute("aria-invalid", "true");
});

test("behavior: the code form posts the intent, the address and the code; a new link is a plain GET", async ({
  page,
}) => {
  await visitStates(page, "sign-in", "light");
  const sent = page.locator("[data-mount='sent']");
  const post = sent.locator("form[method='post']");
  await expect(post.locator("input[name='intent']")).toHaveValue("code");
  await expect(post.locator("input[name='email']")).toHaveValue("reader@example.com");
  await expect(sent.locator("form[method='get']").getByRole("button")).toHaveText(
    "Send a new link and code",
  );
});
