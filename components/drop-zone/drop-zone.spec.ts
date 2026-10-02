import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { acceptLabel, formatBytes, matchesAccept, validateFiles } from "./drop-zone.ts";

interface Sample {
  name: string;
  type: string;
  size?: number;
}

// A drag carrying files, dispatched on an element: the platform gives a test no real drag.
async function drag(page: Page, selector: string, type: "dragenter" | "dragover" | "dragleave" | "drop", files: Sample[] = [{ name: "a.png", type: "image/png" }]) {
  const dt = await page.evaluateHandle((list) => {
    const t = new DataTransfer();
    for (const f of list) t.items.add(new File([new Uint8Array(f.size ?? 4)], f.name, { type: f.type }));
    return t;
  }, files);
  await page.dispatchEvent(selector, type, { dataTransfer: dt });
}

const png = (name: string, size = 2000) => ({ name, mimeType: "image/png", buffer: Buffer.alloc(size, 1) });

// The pure rules run in node, with no page.
test("behaviour: validateFiles checks type, then size, then the count, and names every refusal", () => {
  const files = [
    { name: "hero.jpg", type: "image/jpeg", size: 1000 },
    { name: "notes.txt", type: "text/plain", size: 10 },
    { name: "huge.png", type: "image/png", size: 9 * 1024 * 1024 },
    { name: "two.png", type: "image/png", size: 10 },
    { name: "three.png", type: "image/png", size: 10 },
  ];
  const r = validateFiles(files, { accept: "image/*,.pdf", maxBytes: 5 * 1024 * 1024, maxFiles: 2 });
  expect(r.accepted.map((f) => f.name)).toEqual(["hero.jpg", "two.png"]);
  expect(r.rejected.map((x) => [x.file.name, x.reason])).toEqual([
    ["notes.txt", "type"],
    ["huge.png", "size"],
    ["three.png", "count"],
  ]);
  expect(r.rejected[0]?.message).toBe("notes.txt: type not allowed. This takes images and PDF.");
  expect(r.rejected[1]?.message).toBe("huge.png: too big at 9 MB. The limit is 5 MB.");
  expect(r.rejected[2]?.message).toContain("too many files");
});

test("behaviour: accept matches an extension, a wildcard and an exact type", () => {
  expect(matchesAccept({ name: "A.PDF", type: "" }, ".pdf")).toBe(true);
  expect(matchesAccept({ name: "a.png", type: "image/png" }, "image/*")).toBe(true);
  expect(matchesAccept({ name: "a.png", type: "image/png" }, "image/jpeg")).toBe(false);
  expect(matchesAccept({ name: "a.bin", type: "" }, "")).toBe(true);
  expect(acceptLabel("image/jpeg,image/png,image/webp")).toBe("JPEG, PNG and WebP");
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(2048)).toBe("2 kB");
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations with files over the page", async ({ page }) => {
    await visitStates(page, "drop-zone", theme, "page");
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title, the hint and every state's words reach their contrast", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await expectContrast(page, [
      { sel: "#dz-idle .cap-drop-title", what: "the idle title" },
      { sel: "#dz-idle .cap-drop-hint", what: "the rules line" },
      { sel: "#dz-idle .cap-drop-browse", what: "the browse word" },
      { sel: "#dz-over .cap-drop-over", what: "Drop to upload on the tint" },
      { sel: "#dz-over .cap-drop-hint", what: "the rules line on the tint" },
      { sel: "#dz-rejected .cap-drop-lead", what: "the refusal lead" },
      { sel: "#dz-rejected .cap-drop-files li", what: "a refusal sentence" },
      { sel: "#dz-accepted .cap-drop-lead", what: "the taken lead" },
      { sel: "#dz-accepted .cap-drop-file-size", what: "a file size" },
      { sel: "#dz-disabled .cap-drop-title", what: "the disabled title" },
      { sel: "#dz-disabled .cap-drop-hint", what: "the disabled rules line" },
    ]);
  });

  test("accessibility: the zone's edge is a boundary at 3:1 in every state", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await expectContrast(page, [
      { sel: "#dz-idle .cap-drop-label", what: "the idle edge", part: "border" },
      { sel: "#dz-over .cap-drop-label", what: "the over edge", part: "border" },
      { sel: "#dz-rejected .cap-drop-label", what: "the refused edge", part: "border" },
      { sel: "#dz-rejected .cap-drop-rejections", what: "the refusal box edge", part: "border" },
    ]);
  });

  test("accessibility: the control is one named input described by the rules", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    const input = page.getByLabel("Drop files here, or browse").first();
    await expect(input).toHaveAttribute("type", "file");
    await expect(input).toHaveAccessibleDescription("Images and PDF, up to 5 MB each, up to 4 at a time.");
    await expect(page.locator("#dz-over input")).toHaveAccessibleName("Drop to upload");
    await expect(page.locator("#dz-single input")).toHaveAccessibleName("Drop a profile picture, or browse");
  });

  test("accessibility: results are a status and refusals an alert, both present before anything is chosen", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await expect(page.locator("#dz-idle [role=status]")).toBeAttached();
    await expect(page.locator("#dz-idle [role=alert]")).toBeAttached();
    await expect(page.locator("#dz-rejected")).toMatchAriaSnapshot(`
      - alert:
        - paragraph: 3 files were not added
        - list:
          - listitem: "fieldnotes-scan.heic: type not allowed. This takes images and PDF."
          - listitem: "site-recording.pdf: too big at 8.4 MB. The limit is 5 MB."
          - listitem: "logo-variant-5.png: too many files. The limit is 4 files at a time, so this one was left out."
    `);
    await expect(page.locator("#dz-accepted")).toMatchAriaSnapshot(`
      - status:
        - paragraph: 3 files are ready to upload.
        - list:
          - listitem: foxhound-hero.jpg 412 kB
          - listitem: uptime-report-september.pdf 1.8 MB
          - listitem: germomics-diagram.png 96 kB
    `);
  });

  test("accessibility: every state is in the delivered HTML", async ({ page }) => {
    const html = await (await page.request.get("components/drop-zone/states.html")).text();
    expect(html).toContain("3 files were not added");
    expect(html).toContain("fieldnotes-scan.heic: type not allowed");
    expect(html).toContain("3 files are ready to upload.");
    expect(html).toContain('data-state="over"');
  });

  test("keyboard: Tab reaches the zone as one stop, with a visible focus ring", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.locator("h1").click();
    await page.keyboard.press("Tab");
    await expect(page.locator("#dz-idle input")).toBeFocused();
    await expect(page.locator("#dz-idle .cap-drop-label")).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    await expect(page.locator("#dz-idle input")).not.toBeFocused();
  });

  test("keyboard: Enter on the focused zone opens the file picker", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.locator("#dz-idle input").focus();
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    expect((await chooser).isMultiple()).toBe(true);
  });

  test("keyboard: Space on the focused zone opens the file picker", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.locator("#dz-single input").focus();
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Space");
    expect((await chooser).isMultiple()).toBe(false);
  });

  test("keyboard: pasting files takes them when the zone asks for paste", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.locator("#dz-idle input").focus();
    await page.evaluate(() => {
      const t = new DataTransfer();
      t.items.add(new File([new Uint8Array(8)], "pasted-screenshot.png", { type: "image/png" }));
      document.querySelector("#dz-idle input")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: t, bubbles: true, cancelable: true }));
    });
    await expect(page.locator("#dz-idle [role=status]")).toHaveText(/pasted-screenshot\.png is ready to upload/);
  });

  test("behaviour: browsing a file says it is ready and tells the page", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.evaluate(() => {
      (window as unknown as { heard: unknown[] }).heard = [];
      document.querySelector("#dz-idle")!.addEventListener("cap-drop-accepted", (e) => (window as unknown as { heard: unknown[] }).heard.push((e as CustomEvent).detail.accepted.map((f: File) => f.name)));
    });
    await page.locator("#dz-idle input").setInputFiles([png("foxhound-hero.png"), png("uptime.png")]);
    await expect(page.locator("#dz-idle [role=status]")).toContainText("2 files are ready to upload.");
    await expect(page.locator("#dz-idle [role=status] li")).toHaveCount(2);
    await expect(page.locator("#dz-idle [role=alert]")).toBeEmpty();
    expect(await page.evaluate(() => (window as unknown as { heard: unknown[] }).heard)).toEqual([["foxhound-hero.png", "uptime.png"]]);
  });

  test("behaviour: a file of the wrong type is named with the types the zone takes", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.locator("#dz-idle input").setInputFiles([{ name: "fieldnotes.heic", mimeType: "image/heic", buffer: Buffer.alloc(10) }, { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.alloc(10) }, png("ok.png")]);
    const alert = page.locator("#dz-idle [role=alert]");
    await expect(alert).toContainText("1 file was not added");
    await expect(alert).toContainText("notes.txt: type not allowed. This takes images and PDF.");
    await expect(page.locator("#dz-idle")).toHaveAttribute("data-state", "rejected");
    await expect(page.locator("#dz-idle [role=status]")).toContainText("2 files are ready to upload.");
  });

  test("behaviour: a file over the size limit is named with its size and the limit", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await page.locator("#dz-single input").setInputFiles(png("big.png", 2 * 1024 * 1024));
    await expect(page.locator("#dz-single [role=alert]")).toContainText("big.png: too big at 2 MB. The limit is 1 MB.");
    await expect(page.locator("#dz-single [role=status]")).toBeEmpty();
  });

  test("behaviour: files beyond the count are named as too many, and the input holds only the accepted", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    const names = ["a.png", "b.png", "c.png", "d.png", "e.png", "f.png"];
    await page.locator("#dz-idle input").setInputFiles(names.map((n) => png(n)));
    await expect(page.locator("#dz-idle [role=alert]")).toContainText("2 files were not added");
    await expect(page.locator("#dz-idle [role=alert]")).toContainText("e.png: too many files. The limit is 4 files at a time");
    expect(await page.locator("#dz-idle input").evaluate((el: HTMLInputElement) => Array.from(el.files ?? []).map((f) => f.name))).toEqual(["a.png", "b.png", "c.png", "d.png"]);
  });

  test("behaviour: a zone without multiple takes one file and names the others", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await drag(page, "#dz-single", "drop", [
      { name: "me.png", type: "image/png" },
      { name: "me-too.png", type: "image/png" },
    ]);
    await expect(page.locator("#dz-single [role=status]")).toContainText("me.png is ready to upload.");
    await expect(page.locator("#dz-single [role=alert]")).toContainText("me-too.png: too many files. The limit is 1 file at a time");
  });

  test("behaviour: a drop is checked, shown, and put in the input", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await drag(page, "#dz-idle", "drop", [
      { name: "dropped.png", type: "image/png" },
      { name: "dropped.zip", type: "application/zip" },
    ]);
    await expect(page.locator("#dz-idle [role=status]")).toContainText("dropped.png is ready to upload.");
    await expect(page.locator("#dz-idle [role=alert]")).toContainText("dropped.zip: type not allowed");
    expect(await page.locator("#dz-idle input").evaluate((el: HTMLInputElement) => el.files?.length)).toBe(1);
  });

  test("behaviour: files over the zone say Drop to upload, and leaving puts it back", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await drag(page, "#dz-idle", "dragenter");
    await expect(page.locator("#dz-idle")).toHaveAttribute("data-state", "over");
    await expect(page.locator("#dz-idle .cap-drop-over")).toBeVisible();
    await expect(page.locator("#dz-idle .cap-drop-idle")).toBeHidden();
    await expect(page.locator("#dz-idle input")).toHaveAccessibleName("Drop to upload");
    await drag(page, "#dz-idle", "dragleave");
    await expect(page.locator("#dz-idle")).toHaveAttribute("data-state", "idle");
    await expect(page.locator("#dz-idle .cap-drop-idle")).toBeVisible();
  });

  test("behaviour: crossing nested elements does not end the drag early", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await drag(page, "#dz-idle", "dragenter");
    await drag(page, "#dz-idle .cap-drop-hint", "dragenter");
    await drag(page, "#dz-idle", "dragleave");
    await expect(page.locator("#dz-idle")).toHaveAttribute("data-state", "over");
    await drag(page, "#dz-idle .cap-drop-hint", "dragleave");
    await expect(page.locator("#dz-idle")).toHaveAttribute("data-state", "idle");
  });

  test("behaviour: a dragged piece of text is not a file drag", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    const dt = await page.evaluateHandle(() => {
      const t = new DataTransfer();
      t.setData("text/plain", "hello");
      return t;
    });
    await page.dispatchEvent("#dz-idle", "dragenter", { dataTransfer: dt });
    await expect(page.locator("#dz-idle")).not.toHaveAttribute("data-state", "over");
  });

  test("behaviour: the drop anywhere panel covers the window while files are over it", async ({ page }) => {
    await visitStates(page, "drop-zone", theme, "page");
    const zone = page.locator("#dz-page");
    await expect(zone).toHaveAttribute("data-state", "over");
    await expect(page.locator("#dz-page .cap-drop-overlay")).toBeVisible();
    await expect(page.locator("#dz-page .cap-drop-overlay-title")).toHaveText("Drop to upload");
    await drag(page, "body", "drop", [{ name: "anywhere.png", type: "image/png" }]);
    await expect(zone).toHaveAttribute("data-state", "idle");
    await expect(page.locator("#dz-page .cap-drop-overlay")).toBeHidden();
    await expect(page.locator("#dz-page [role=status]")).toContainText("anywhere.png is ready to upload.");
  });

  test("behaviour: in page mode a dragged file over the window opens the panel and leaving closes it", async ({ page }) => {
    await visitStates(page, "drop-zone", theme, "page");
    await drag(page, "body", "drop", [{ name: "x.png", type: "image/png" }]);
    await drag(page, "body", "dragenter");
    await expect(page.locator("#dz-page .cap-drop-overlay")).toBeVisible();
    await drag(page, "body", "dragleave");
    await expect(page.locator("#dz-page .cap-drop-overlay")).toBeHidden();
  });

  test("behaviour: a disabled zone takes no files", async ({ page }) => {
    await visitStates(page, "drop-zone", theme);
    await expect(page.locator("#dz-disabled input")).toBeDisabled();
  });
});
