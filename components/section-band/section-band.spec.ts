import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the band's words reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "section-band", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [{ sel: "#sb-straight .band-demo", what: "the band's text" }]);
  });

  test("behavior: a slanted band clips to its slant and its words stay inside the slab", async ({
    page,
  }) => {
    await visitStates(page, "section-band", theme);
    const r = await page.locator("#sb-slant").evaluate((el) => {
      const band = el.getBoundingClientRect();
      const text = el.querySelector(".band-demo")!.getBoundingClientRect();
      const rise = parseFloat(getComputedStyle(el).getPropertyValue("--cap-band-rise")) * 16;
      return {
        clipped: getComputedStyle(el).clipPath.startsWith("polygon"),
        clear: text.top - band.top >= rise,
      };
    });
    expect(r).toEqual({ clipped: true, clear: true });
  });
});
