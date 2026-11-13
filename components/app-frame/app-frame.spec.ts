import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the address reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "app-frame", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#af-browser .cap-app-frame-address", what: "the address" },
    ]);
  });

  test("behavior: three dots are drawn, and a long address stays on one line", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await visitStates(page, "app-frame", theme);
    const r = await page.locator("#af-browser").evaluate((el) => {
      const dots = el.querySelector(".cap-app-frame-dots")!;
      const sizes = [
        getComputedStyle(dots, "::before").width,
        getComputedStyle(dots, "::after").width,
        getComputedStyle(dots.firstElementChild!).width,
      ];
      const addr = el.querySelector(".cap-app-frame-address") as HTMLElement;
      return { sizes, oneLine: addr.getBoundingClientRect().height < 24 };
    });
    expect(r).toEqual({ sizes: ["10px", "10px", "10px"], oneLine: true });
  });
});
