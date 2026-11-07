import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { familyFooterHtml } from "./family-footer.ts";

test("behavior: another site's footer points the family's paths at dustinedwards.info, and the site itself keeps them its own", () => {
  const away = familyFooterHtml({ year: 2026 });
  expect(away).toContain('href="https://dustinedwards.info/privacy"');
  expect(away).toContain('href="https://portal.dustinedwards.info"');
  const home = familyFooterHtml({ origin: "", published: [], year: 2026 });
  expect(home).toContain('href="/privacy"');
  expect(home).not.toContain("/accessibility");
  // A site with its own statement links its own, even where the family's page is unpublished.
  const own = familyFooterHtml({ statement: "/accessibility", published: [], year: 2026 });
  expect(own).toContain('href="/accessibility"');
  expect(own).not.toContain("dustinedwards.info/accessibility");
  // Privacy and Terms sit under Legal, not Site; Features is a Site link that waits for its page.
  const legal = away.slice(away.indexOf('id="cap-family-footer-legal"'));
  expect(legal).toContain("/privacy");
  expect(away.slice(0, away.indexOf('id="cap-family-footer-legal"'))).not.toContain("/privacy");
  expect(familyFooterHtml({ origin: "", published: [], year: 2026 })).toContain("/features");
  expect(away).toContain("Lab Bench");
  expect(familyFooterHtml({ site: "capsid" }).match(/aria-current="page"/g)).toHaveLength(1);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "family-footer", theme);
    await expectNoAxeViolations(page);
  });
});
