import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "settings-row", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: a switch is named and described by its row; disabled says why", async ({
    page,
  }) => {
    await visitStates(page, "settings-row", theme);
    const alerts = page.getByRole("switch", { name: "Failure alerts" });
    await expect(alerts).toHaveAccessibleDescription("An email the moment a check fails.");
    const auto = page.getByRole("switch", { name: "Send without review" });
    await expect(auto).toBeDisabled();
    await expect(auto).toHaveAccessibleDescription(/Only the account owner can change this\./);
    await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  });

  test("behavior: submitOnChange sends the switch's form when it is flipped", async ({ page }) => {
    await visitStates(page, "settings-row", theme);
    const sent = page.evaluate(
      () =>
        new Promise<string>((done) =>
          document.getElementById("sr-toggle")?.addEventListener("submit", (e) => {
            done(String(new FormData(e.target as HTMLFormElement).get("alerts")));
          }),
        ),
    );
    await page.getByRole("switch", { name: "Failure alerts" }).press("Space");
    expect(await sent).toBe("null");
  });
});
