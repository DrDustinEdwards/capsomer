import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../../test/helpers.ts";
import { FOX, UPTIME, alt, inspector, library, link, saveStatus, tile } from "./media-helpers.ts";

eachTheme((theme) => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  // behavior

  test("behavior: wide, the inspector is a pane beside the grid; narrow, a closed sheet", async ({
    page,
  }) => {
    await library(page, theme);
    const grid = await page.locator("#library-tiles").boundingBox();
    const pane = await inspector(page).boundingBox();
    expect(grid && pane && pane.x >= grid.x + grid.width - 1).toBe(true);
    expect(
      await inspector(page).evaluate((el: HTMLDialogElement) => el.open && !el.matches(":modal")),
    ).toBe(true);
    await page.setViewportSize({ width: 420, height: 800 });
    await library(page, theme, "sheet");
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.open)).toBe(false);
  });

  test("behavior: with no script the inspector is in the page, open, with its form and a Save button", async ({
    page,
  }) => {
    await page.route("**/*.js", (r) => r.abort());
    await page.goto("components/media/states.html");
    const ins = page.locator("#ins-static-ins");
    await expect(ins).toBeVisible();
    await expect(ins.getByLabel("Alt text")).toBeVisible();
    await expect(ins.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(ins.getByRole("link", { name: "Why the uptime strip counts gaps" })).toBeVisible();
  });

  test("behavior: typing alt text saves after 800 ms of quiet, with Saving then Saved, and the tile updates", async ({
    page,
  }) => {
    await page.clock.install();
    await library(page, theme);
    await page.clock.pauseAt(Date.now() + 60_000);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(saveStatus(page)).toHaveText("Changes save by themselves.");
    await page.keyboard.type("The uptime strip");
    await expect(saveStatus(page)).toHaveText("Unsaved changes");
    await page.clock.runFor(500);
    await page.keyboard.type(": 29 green days");
    await page.clock.runFor(700);
    expect(
      await page.evaluate(() => (window as unknown as { saves: unknown[] }).saves.length),
    ).toBe(0);
    await page.clock.runFor(150);
    await expect(saveStatus(page)).toHaveText("Saving…");
    await expect(inspector(page).locator("form")).toHaveAttribute("aria-busy", "true");
    await page.clock.runFor(200);
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(inspector(page).locator("form")).not.toHaveAttribute("aria-busy", "true");
    const saves = await page.evaluate(
      () => (window as unknown as { saves: Array<{ key: string; fields: { alt: string } }> }).saves,
    );
    expect(saves).toHaveLength(1);
    expect(saves[0]?.fields.alt).toBe("The uptime strip: 29 green days");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "set");
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveCount(0);
  });

  test("behavior: leaving a field saves what was typed at once", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Four green sites");
    await page.keyboard.press("Tab");
    await expect(saveStatus(page)).toHaveText("Saved");
    expect(
      await page.evaluate(() => (window as unknown as { saves: unknown[] }).saves.length),
    ).toBe(1);
  });

  test("behavior: a save that fails says so, keeps the typed text, and Retry saves it", async ({
    page,
  }) => {
    await library(page, theme);
    await page.evaluate(() => ((window as unknown as { failSave: boolean }).failSave = true));
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("A strip of thirty days");
    await page.keyboard.press("Tab");
    await expect(inspector(page).locator("[data-cap-part=save-error]")).toContainText(
      "Could not save: The server answered 502. What you typed is still here.",
    );
    await expect(inspector(page).getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(alt(page)).toHaveValue("A strip of thirty days");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "missing");
    await page.evaluate(() => ((window as unknown as { failSave: boolean }).failSave = false));
    await inspector(page).getByRole("button", { name: "Retry" }).click();
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(inspector(page).getByRole("button", { name: "Retry" })).toBeHidden();
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "set");
  });

  test("behavior: typed text that failed to save is still there after moving to another file and back", async ({
    page,
  }) => {
    await library(page, theme);
    await page.evaluate(() => ((window as unknown as { failSave: boolean }).failSave = true));
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Thirty days of checks");
    await page.keyboard.press("Tab");
    await expect(inspector(page).locator("[data-cap-part=save-error]")).toContainText(
      "Could not save",
    );
    await link(page, UPTIME).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(inspector(page).getByRole("heading", { name: FOX })).toBeVisible();
    await expect(saveStatus(page)).toHaveText("Changes save by themselves.");
    await page.keyboard.press("ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(alt(page)).toHaveValue("Thirty days of checks");
    await expect(inspector(page).getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("behavior: switching file saves unsaved text to the file it was typed for", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Typed for the uptime strip");
    await page.keyboard.press("Alt+ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: "project-tree.svg" })).toBeVisible();
    const saves = await page.evaluate(
      () => (window as unknown as { saves: Array<{ key: string; fields: { alt: string } }> }).saves,
    );
    expect(saves.map((s) => [s.key, s.fields.alt])).toEqual([
      ["media/uptime-strip.png", "Typed for the uptime strip"],
    ]);
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt-text", "Typed for the uptime strip");
  });

  test("behavior: Decorative image clears and disables the alt text, saves, and the tile says Decorative", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("A strip");
    await page.keyboard.press("Tab");
    await expect(saveStatus(page)).toHaveText("Saved");
    const deco = inspector(page).getByRole("checkbox", { name: "Decorative image" });
    await deco.check();
    await expect(alt(page)).toBeDisabled();
    await expect(alt(page)).toHaveValue("");
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "decorative");
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveText("Decorative");
    const saves = await page.evaluate(
      () =>
        (window as unknown as { saves: Array<{ fields: { alt: string; decorative: boolean } }> })
          .saves,
    );
    expect(saves.at(-1)?.fields).toMatchObject({ alt: "", decorative: true });
    await deco.uncheck();
    await expect(alt(page)).toBeEnabled();
    await expect(alt(page)).toHaveValue("A strip");
  });

  test("behavior: the inspector lists where a file is used, as links, and says so plainly when it is not used", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, "mention-queue.png").focus();
    await page.keyboard.press("Enter");
    const used = inspector(page).locator("[data-cap-part=used]");
    await expect(used.getByRole("link")).toHaveText([
      "What a mention queue is for",
      "Undo is cheaper than are-you-sure",
      "Search without a server",
    ]);
    await expect(used.getByRole("link").first()).toHaveAttribute(
      "href",
      "/admin/posts/mention-queue/edit",
    );
    await link(page, "fieldnotes-migration.jpg").focus();
    await page.keyboard.press("Enter");
    await expect(used).toContainText("Not used anywhere.");
    await expect(used).toContainText("check before you delete it.");
    await expect(used.getByRole("link")).toHaveCount(0);
  });

  test("behavior: the Unattached filter has a count, narrows the grid, and the inspector's button turns it on", async ({
    page,
  }) => {
    await library(page, theme);
    const chip = page.getByRole("button", { name: /^Unattached/ });
    await expect(chip.locator(".cap-chip-count")).toHaveText("1");
    await expect(page.locator(".cap-media-count")).toHaveText("6 files");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".cap-media-tile:not([hidden])")).toHaveCount(3); // the unattached one, plus the upload in progress and the failed one
    await expect(tile(page, "fieldnotes-migration.jpg")).toBeVisible();
    await expect(page.locator(".cap-media-count")).toHaveText("Showing 1 of 6 files");
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(page.locator(".cap-media-count")).toHaveText("6 files");
    await link(page, "fieldnotes-migration.jpg").focus();
    await page.keyboard.press("Enter");
    await inspector(page).getByRole("button", { name: "Show unattached files" }).click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".cap-media-count")).toHaveText("Showing 1 of 6 files");
  });

  test("behavior: the no alt text filter lists what still needs a description", async ({
    page,
  }) => {
    await library(page, theme);
    await page.getByRole("button", { name: /^No alt text/ }).click();
    await expect(tile(page, UPTIME)).toBeVisible();
    await expect(tile(page, "fieldnotes-migration.jpg")).toBeVisible();
    await expect(tile(page, FOX)).toBeHidden();
    await expect(tile(page, "project-tree.svg")).toBeHidden();
  });

  test("behavior: search narrows by name, alt text and tags, and says what it found, or that nothing matches", async ({
    page,
  }) => {
    await library(page, theme);
    const q = page.getByRole("searchbox", { name: "Search files" });
    await q.fill("uptime");
    await expect(page.locator(".cap-media-tile:not([hidden])[data-state=ready]")).toHaveCount(2);
    await q.fill("diagrams");
    await expect(tile(page, "project-tree.svg")).toBeVisible();
    await q.fill("zzzz");
    await expect(page.locator(".cap-media-empty")).toBeVisible();
    await expect(page.getByText("No files match your search")).toBeVisible();
    await expect(page.locator(".cap-media-count")).toHaveText("Showing 0 of 6 files");
    await page.getByRole("button", { name: "Clear the search" }).click();
    await expect(q).toHaveValue("");
    await expect(page.locator(".cap-media-empty")).toBeHidden();
    await expect(page.locator(".cap-media-count")).toHaveText("6 files");
  });

  test("behavior: the Trash view shows the files in Trash, with a count and Restore", async ({
    page,
  }) => {
    await library(page, theme);
    await expect(page.locator("[data-cap-count=bin]")).toHaveText("1");
    await page.getByRole("radio", { name: /Trash/ }).check();
    await expect(page.locator(".cap-media-tile:not([hidden])")).toHaveCount(1);
    await expect(tile(page, "old-logo.png").locator(".cap-status")).toHaveText("In Trash");
    await expect(page.locator(".cap-media-count")).toHaveText("1 in Trash");
    await page.getByRole("button", { name: "Restore old-logo.png" }).click();
    await expect(page.locator(".cap-media-empty")).toBeVisible();
    await expect(page.getByText("Trash is empty")).toBeVisible();
    await expect(page.locator("[data-cap-count=bin]")).toHaveText("0");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, "old-logo.png")).toBeVisible();
  });

  test("behavior: moving a file to Trash from the inspector runs at once and offers Undo", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await inspector(page).getByRole("button", { name: "Move to Trash" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(tile(page, UPTIME)).toBeHidden();
    await expect(page.locator(".cap-message-item")).toContainText(
      "Moved uptime-strip.png to Trash.",
    );
    await expect(inspector(page).getByRole("heading", { name: "project-tree.svg" })).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, UPTIME)).toBeVisible();
    await expect(page.locator("[data-cap-count=bin]")).toHaveText("1");
  });

  test("behavior: the bulk bar over the grid bins the selection with Undo and adds a tag", async ({
    page,
  }) => {
    await library(page, theme);
    await expect(page.locator("#library-bulk .cap-bulk-count")).toHaveText("1 selected");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Space");
    await page.locator("#library-bulk").getByLabel("Tag").fill("Review");
    await page.locator("#library-bulk").getByRole("button", { name: "Add tag" }).click();
    await expect(page.locator(".cap-message-item")).toContainText("Added the tag to 2 files.");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-tags", "review");
    await expect(tile(page, "mention-queue.png")).toHaveAttribute("data-tags", "mentions, review");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Space");
    await link(page, "mention-queue.png").focus();
    await page.keyboard.press("Space");
    await page.locator("#library-bulk").getByRole("button", { name: "Move to Trash" }).click();
    await expect(page.locator(".cap-message-item")).toContainText("Moved 2 files to Trash.");
    await expect(tile(page, UPTIME)).toBeHidden();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, UPTIME)).toBeVisible();
  });

  test("behavior: deleting for good previews every file first, with focus on Cancel, and cannot be undone", async ({
    page,
  }) => {
    await library(page, theme);
    await page.getByRole("radio", { name: /Trash/ }).check();
    await tile(page, "old-logo.png").getByRole("checkbox").check({ force: true });
    await page.locator("#library-bulk").getByRole("button", { name: "Delete for good" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete 1 file for good?" });
    await expect(dialog.getByRole("listitem")).toHaveText(["old-logo.png"]);
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(tile(page, "old-logo.png")).toBeVisible();
    await page.locator("#library-bulk").getByRole("button", { name: "Delete for good" }).click();
    await dialog.getByRole("button", { name: "Delete 1 file" }).click();
    await expect(tile(page, "old-logo.png")).toHaveCount(0);
    await expect(page.locator(".cap-message-item")).toContainText("Deleted 1 file for good.");
    await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(0);
  });

  test("behavior: copy address copies the file's address; Markdown copies an image reference", async ({
    page,
  }) => {
    await library(page, theme);
    await inspector(page).getByRole("button", { name: "Copy the Markdown image" }).click();
    await expect(inspector(page).locator("[data-cap-part=copied]")).toHaveText(
      "Copied the Markdown image.",
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "![The status dashboard with three sites reporting healthy](https://example.com/media/launch-hero.jpg)",
    );
  });

  test("behavior: when the clipboard refuses, copy says so and leaves the address selected", async ({
    page,
  }) => {
    await library(page, theme);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
        configurable: true,
      });
      document.execCommand = () => false;
    });
    await inspector(page).getByRole("button", { name: "Copy address" }).click();
    await expect(inspector(page).locator("[data-cap-part=copied]")).toContainText(
      "Could not copy. The address is selected",
    );
    const selected = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      return el?.selectionEnd && el.selectionEnd > 0 ? el.value : "";
    });
    expect(selected).toBe("https://example.com/media/launch-hero.jpg");
  });

  test("behavior: dropped files become uploading tiles with a progress bar, and finish as tiles that open", async ({
    page,
  }) => {
    await library(page, theme, "empty");
    await expect(page.getByText("Nothing here yet")).toBeVisible();
    await page
      .locator("#blank-empty-drop input")
      .setInputFiles([
        { name: "release-notes.png", mimeType: "image/png", buffer: Buffer.alloc(4000, 1) },
      ]);
    const t = tile(page, "release-notes.png");
    await expect(t).toHaveAttribute("data-state", "uploading");
    await expect(t.getByRole("progressbar", { name: "Uploading" })).toBeVisible();
    await expect(page.locator(".cap-media-empty")).toBeHidden();
    await expect(t).toHaveAttribute("data-state", "ready", { timeout: 6000 });
    await expect(t.getByRole("link", { name: /release-notes\.png/ })).toBeVisible();
    await expect(t.locator(".cap-status")).toHaveText(["No alt text", "Unattached"]);
  });

  // The React wrappers render the same contract and behave the same way.

  test("accessibility: no axe violations in the React specimen", async ({ page }) => {
    await library(page, theme, "react");
    await expect(page.locator(".cap-media-tile")).toHaveCount(5);
    await expectNoAxeViolations(page);
  });

  test("behavior: React MediaGrid renders the tiles' contract, with the arrow keys, Space and Enter", async ({
    page,
  }) => {
    await library(page, theme, "react");
    await expect(page.getByRole("list", { name: "Files" })).toBeVisible();
    await expect(link(page, UPTIME)).toHaveAccessibleDescription(/No alt text/);
    await expect(
      page
        .locator("#tile-media-capsid-walkthrough-png")
        .getByRole("progressbar", { name: "Uploading" }),
    ).toHaveJSProperty("value", 62);
    await expect(page.getByRole("button", { name: "Retry uploading scan-0042.png" })).toBeVisible();
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowRight");
    await expect(link(page, UPTIME)).toBeFocused();
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(tile(page, UPTIME).getByRole("checkbox")).toBeChecked();
    await expect(page.locator(".cap-media-count")).toContainText("1 selected");
    await page.keyboard.press("End");
    await expect(link(page, "scan-0042.png")).toBeFocused();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
  });

  test("behavior: React MediaInspector saves by itself, shows Saved, and keeps typed text when a save fails", async ({
    page,
  }) => {
    await library(page, theme, "react");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
    await page.keyboard.type("Thirty days of checks");
    await page.keyboard.press("Tab");
    await expect(saveStatus(page)).toHaveText("Saved");
    expect(
      await page.evaluate(() =>
        (window as unknown as { reactSaves: Array<{ fields: { alt: string } }> }).reactSaves.map(
          (s) => s.fields.alt,
        ),
      ),
    ).toEqual(["Thirty days of checks"]);
    await expect(link(page, UPTIME)).not.toHaveAccessibleDescription(/No alt text/);
    await page.evaluate(
      () => ((window as unknown as { failReactSave: boolean }).failReactSave = true),
    );
    await alt(page).fill("Thirty days, one amber");
    await page.keyboard.press("Tab");
    await expect(inspector(page).locator("[role=alert]")).toContainText(
      "Could not save: The server answered 502. What you typed is still here.",
    );
    await expect(alt(page)).toHaveValue("Thirty days, one amber");
    await page.evaluate(
      () => ((window as unknown as { failReactSave: boolean }).failReactSave = false),
    );
    await inspector(page).getByRole("button", { name: "Retry" }).click();
    await expect(saveStatus(page)).toHaveText("Saved");
  });

  test("behavior: React MediaInspector marks a file decorative and clears and disables its alt text", async ({
    page,
  }) => {
    await library(page, theme, "react");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
    await page.keyboard.type("Temporary");
    await inspector(page).getByRole("checkbox", { name: "Decorative image" }).check();
    await expect(alt(page)).toBeDisabled();
    await expect(alt(page)).toHaveValue("");
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "decorative");
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveText([
      "Decorative",
      "Unattached",
    ]);
  });

  test("behavior: the grid groups by month, and the arrow keys cross from one group to the next", async ({
    page,
  }) => {
    await library(page, theme);
    await expect(page.getByRole("heading", { name: /September 2026/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /August 2026/ })).toBeVisible();
    await link(page, "uptime-report-september.pdf").focus();
    let label = "";
    for (let i = 0; i < 8 && label !== "mention-queue.png"; i += 1) {
      await page.keyboard.press("ArrowRight");
      label =
        (await page.evaluate(() =>
          document.activeElement?.closest(".cap-media-tile")?.getAttribute("data-label"),
        )) ?? "";
    }
    expect(label).toBe("mention-queue.png");
  });

  test("behavior: sort orders each group, keeps uploads first, and keeps focus", async ({
    page,
  }) => {
    await library(page, theme);
    const order = () =>
      page
        .locator("section[aria-labelledby=library-g-september] .cap-media-tile")
        .evaluateAll((els) => els.map((e) => e.getAttribute("data-label")));
    expect((await order()).slice(0, 3)).toEqual(["capsid-walkthrough.png", "scan-0042.png", FOX]);
    await page.getByRole("radio", { name: "A to Z" }).check({ force: true });
    expect(await order()).toEqual([
      "capsid-walkthrough.png",
      "scan-0042.png",
      "fieldnotes-migration.jpg",
      FOX,
      "project-tree.svg",
      "uptime-report-september.pdf",
      UPTIME,
    ]);
    await page.getByRole("radio", { name: "Largest" }).check({ force: true });
    expect((await order()).slice(2, 4)).toEqual([
      "fieldnotes-migration.jpg",
      "uptime-report-september.pdf",
    ]);
    await link(page, "project-tree.svg").focus();
    await page.getByRole("radio", { name: "Newest" }).check({ force: true });
    expect((await order()).slice(2, 4)).toEqual([FOX, UPTIME]);
  });

  test("behavior: the list layout puts one file on each row, with the same tiles", async ({
    page,
  }) => {
    await library(page, theme);
    await page.getByRole("radio", { name: "List" }).check({ force: true });
    await expect(page.locator(".cap-media[data-cap=media]")).toHaveAttribute("data-view", "list");
    const a = await tile(page, FOX).boundingBox();
    const b = await tile(page, UPTIME).boundingBox();
    expect(a && b && b.y > a.y && Math.abs(a.x - b.x) < 2).toBe(true);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowDown");
    await expect(link(page, UPTIME)).toBeFocused();
    await expectNoAxeViolations(page);
  });

  test("behavior: a file dropped anywhere on the library page becomes an uploading tile", async ({
    page,
  }) => {
    await library(page, theme);
    const dt = await page.evaluateHandle(() => {
      const t = new DataTransfer();
      t.items.add(new File([new Uint8Array(40)], "dropped-anywhere.png", { type: "image/png" }));
      return t;
    });
    await page.dispatchEvent("body", "dragenter", { dataTransfer: dt });
    await expect(page.locator("#library-drop .cap-drop-overlay")).toBeVisible();
    await page.dispatchEvent("body", "drop", { dataTransfer: dt });
    await expect(tile(page, "dropped-anywhere.png")).toHaveAttribute("data-state", "uploading");
    await expect(page.locator("#library-drop .cap-drop-overlay")).toBeHidden();
  });

  test("behavior: tile size changes the columns", async ({ page }) => {
    await library(page, theme);
    const w = async () => (await tile(page, FOX).boundingBox())?.width ?? 0;
    const m = await w();
    await page.getByRole("radio", { name: "S", exact: true }).check({ force: true });
    expect(await w()).toBeLessThan(m);
    await page.getByRole("radio", { name: "L", exact: true }).check({ force: true });
    expect(await w()).toBeGreaterThan(m);
  });
});
