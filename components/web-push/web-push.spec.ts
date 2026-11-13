import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the notes and details reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "web-push", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#push-devices .cap-web-push-device-detail", what: "a device's detail" },
      { sel: "#push-setup .cap-web-push-note", what: "the not set up note" },
      { sel: "#push-setup .cap-web-push-unsupported", what: "the no Web Push line" },
    ]);
  });
});
