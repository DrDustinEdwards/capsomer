import { expect, test } from "@playwright/test";
import { eachTheme, visitStates } from "../../test/helpers.ts";
import {
  NAME,
  ready,
  section,
  surfaceOf,
  toolbarOf,
  type,
  visitOnly,
} from "./markdown-editor.helpers.ts";

// The toolbar, the link palette, the block menu and the image prompt: the chrome around the text.
eachTheme((theme) => {
  test("keyboard: Tab enters the toolbar at one stop, the next Tab enters the surface", async ({
    page,
  }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-empty");
    // Focus the page's last control before the empty editor, then Tab.
    await page.locator("#sp-lines .cm-content").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // Whatever follows #sp-lines, it is not still inside the earlier toolbar's other buttons.
    const tabbable = await toolbarOf(section(page, "sp-empty"))
      .locator(".cap-md-tool")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
    expect(tabbable.filter((t) => t === 0)).toHaveLength(1);
    expect(tabbable.filter((t) => t === -1).length).toBe(tabbable.length - 1);
    const first = toolbarOf(section(page, "sp-empty")).getByRole("button", { name: "Bold" });
    await first.focus();
    await page.keyboard.press("Tab");
    await expect(surfaceOf(section(page, "sp-empty"))).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(first).toBeFocused();
  });

  test("keyboard: arrows, Home and End move between the toolbar's buttons and wrap", async ({
    page,
  }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-default");
    const bar = toolbarOf(section(page, "sp-default"));
    await bar.getByRole("button", { name: "Bold" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(bar.getByRole("button", { name: "Italic" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(bar.getByRole("button", { name: "Figure" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(bar.getByRole("button", { name: "Bold" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(bar.getByRole("button", { name: "Figure" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(bar.getByRole("button", { name: "Bold" })).toBeFocused();
    // The one tab stop follows focus.
    await bar.getByRole("button", { name: "Code" }).focus();
    await expect(bar.getByRole("button", { name: "Code" })).toHaveAttribute("tabindex", "0");
    await expect(bar.getByRole("button", { name: "Bold" })).toHaveAttribute("tabindex", "-1");
  });

  test("keyboard: Ctrl+B, I and E wrap the selection, and with none put the cursor between the marks", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await type(page, surface, "word");
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Control+b");
    await expect(page.locator("textarea")).toHaveValue("**word**");
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Control+i");
    await expect(page.locator("textarea")).toHaveValue("_**word**_");
    await type(page, surface, "x");
    await page.keyboard.press("Control+e");
    await page.keyboard.type("y");
    await expect(page.locator("textarea")).toHaveValue("x`y`");
  });

  test("keyboard: Ctrl+K opens the link palette with the selection as its query", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    await type(page, surface, "monitors");
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("combobox", { name: "Link to" });
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("monitors");
    await expect(page.getByRole("option")).toHaveCount(1);
  });

  test("keyboard: in the link palette arrows choose, Enter links, and the cursor lands after the link", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await expect(page.getByRole("combobox", { name: "Link to" })).toBeFocused();
    const active = async (i: number) => {
      await expect(page.getByRole("option").nth(i)).toHaveAttribute("data-active", "");
      const id = await page.getByRole("option").nth(i).getAttribute("id");
      await expect(page.getByRole("combobox")).toHaveAttribute(
        "aria-activedescendant",
        id ?? "none",
      );
    };
    await active(0);
    await page.keyboard.press("ArrowDown");
    await active(1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await active(0);
    await page.keyboard.press("ArrowUp");
    await active(2);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(surface).toBeFocused();
    await expect(page.locator("textarea")).toHaveValue(
      /Read more: \[The first incident write-up\]\(\/writing\/first-incident\)$/,
    );
    await page.keyboard.type(" Next.");
    await expect(page.locator("textarea")).toHaveValue(/\(\/writing\/first-incident\) Next\.$/);
  });

  test("keyboard: in the link palette a typed address is linked as it is", async ({ page }) => {
    await visitOnly(page, theme, "palette");
    await page.keyboard.type("https://status.example.org");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.locator(".cap-md-palette-note")).toHaveText("Enter to link to this address");
    await page.keyboard.press("Enter");
    await expect(page.locator("textarea")).toHaveValue(
      /\[https:\/\/status\.example\.org\]\(https:\/\/status\.example\.org\)$/,
    );
  });

  test("keyboard: Esc closes the link palette and returns to the text with the selection as it was", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.type("zzz");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.locator(".cap-md-palette-note")).toContainText("No pages match");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(surface).toBeFocused();
    // The text is untouched, and typing continues where the cursor was.
    await page.keyboard.type("!");
    await expect(page.locator("textarea")).toHaveValue(/Read more: !$/);
  });

  test("keyboard: a lone / on a line opens the block menu, Down enters it, arrows move, Enter inserts the block in its place", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "slash");
    const menu = page.getByRole("list", { name: "Insert a block" });
    await expect(menu).toBeVisible();
    await expect(surface).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("button", { name: /Chart/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("button", { name: /Diagram/ })).toBeFocused();
    await page.keyboard.press("End");
    await expect(menu.getByRole("button", { name: /Figure/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("button", { name: /Chart/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toHaveCount(0);
    await expect(surface).toBeFocused();
    const text = await page.locator("textarea").inputValue();
    expect(text).toContain(":::chart{type=bar");
    expect(text).not.toMatch(/^\/$/m);
    // The cursor is inside alt="", where it must be written.
    await page.keyboard.type("Weekly checks");
    await expect(page.locator("textarea")).toHaveValue(/alt="Weekly checks"\}/);
  });

  test("keyboard: Esc in the block menu closes it and returns to the text", async ({ page }) => {
    const surface = await visitOnly(page, theme, "slash");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("list", { name: "Insert a block" })).toHaveCount(0);
    await expect(surface).toBeFocused();
    // From the text, Esc closes a menu that is open without going further.
    await page.keyboard.press("Backspace");
    await page.keyboard.type("/");
    await expect(page.getByRole("list", { name: "Insert a block" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("list", { name: "Insert a block" })).toHaveCount(0);
    await expect(surface).toBeFocused();
  });

  test("keyboard: a / inside a line or among other text does not open the block menu", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "slash");
    await type(page, surface, "a/b");
    await expect(page.getByRole("list", { name: "Insert a block" })).toHaveCount(0);
    await type(page, surface, "/ not alone");
    await expect(page.getByRole("list", { name: "Insert a block" })).toHaveCount(0);
    await type(page, surface, "/");
    await expect(page.getByRole("list", { name: "Insert a block" })).toBeVisible();
    await page.keyboard.type("x");
    await expect(page.getByRole("list", { name: "Insert a block" })).toHaveCount(0);
  });

  test("keyboard: Ctrl+S hands the text to the app and does not leave the editor", async ({
    page,
  }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await type(page, surface, "Draft text");
    let prevented = false;
    await page.exposeFunction("capSawSave", () => (prevented = true));
    await page.evaluate(() =>
      document.addEventListener("cap-md-save", (e) =>
        (window as unknown as { capSawSave: (v: string) => void }).capSawSave(
          (e as CustomEvent).detail.value,
        ),
      ),
    );
    await page.keyboard.press("Control+s");
    await expect(page.locator("#saved")).toHaveText("yes");
    expect(prevented).toBe(true);
    await expect(surface).toBeFocused();
  });

  test("keyboard: Ctrl+Z undoes the last edit and Ctrl+Y redoes it", async ({ page }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    await type(page, surface, "word");
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Control+b");
    await expect(page.locator("textarea")).toHaveValue("**word**");
    await page.keyboard.press("Control+z");
    await expect(page.locator("textarea")).toHaveValue("word");
    await page.keyboard.press("Control+y");
    await expect(page.locator("textarea")).toHaveValue("**word**");
  });

  test("keyboard: Tab leaves the surface (no trap), and Esc then Tab does the same after a menu", async ({
    page,
  }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await surface.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Save draft" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(surface).toBeFocused();
    // The text did not gain a tab character.
    await expect(page.locator("#md-form")).toHaveValue("");
    await page.keyboard.type("/");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Save draft" })).toBeFocused();
  });

  test("keyboard: the toolbar's Heading level button cycles h2, h3, h4, none", async ({ page }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    await type(page, surface, "Title");
    const heading = toolbarOf(page).getByRole("button", { name: "Heading level" });
    for (const want of ["## Title", "### Title", "#### Title", "Title"]) {
      await heading.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("textarea")).toHaveValue(want);
      await expect(surface).toBeFocused();
    }
  });

  test("keyboard: the toolbar's Footnote button adds a numbered reference and lands in its definition", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    await type(page, surface, "Claim");
    const footnote = toolbarOf(page).getByRole("button", { name: "Footnote" });
    await footnote.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("textarea")).toHaveValue("Claim[^1]\n\n[^1]: ");
    await page.keyboard.type("Source.");
    await expect(page.locator("textarea")).toHaveValue("Claim[^1]\n\n[^1]: Source.");
    await toolbarOf(page).getByRole("button", { name: "Footnote" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("textarea")).toHaveValue(/\[\^2\]: $/);
  });

  test("keyboard: a toolbar block button inserts the block set apart by a blank line", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    await type(page, surface, "Intro");
    await toolbarOf(page).getByRole("button", { name: "Figure" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("textarea")).toHaveValue(/^Intro\n\n:::figure\{src=""/);
    await page.keyboard.type("/media/a.png");
    await expect(page.locator("textarea")).toHaveValue(/src="\/media\/a\.png" alt=""\}/);
  });

  test("keyboard: an image is described before it is sent: focus moves to the alt field, Insert waits for alt text, Enter uploads with it and inserts", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "alt");
    const alt = page.getByRole("textbox", { name: /Alt text/ });
    await expect(alt).toBeFocused();
    const insert = page.getByRole("button", { name: "Insert image" }).last();
    await expect(insert).toBeDisabled();
    expect(
      await page.evaluate(() => (window as unknown as { sentUploads?: unknown[] }).sentUploads),
    ).toBeUndefined();
    await page.keyboard.type("The status page, all green");
    await expect(insert).toBeEnabled();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(surface).toBeFocused();
    await expect(page.locator("textarea")).toHaveValue(
      /^A screenshot of the status page after the fix\.\n\n:::figure\{src="data:image\/svg\+xml,[^"]+" alt="The status page, all green"\}\n:::$/,
    );
    await expect(page.getByRole("status").filter({ hasText: "Image added" })).toHaveCount(1);
    expect(
      await page.evaluate(() => (window as unknown as { sentUploads?: unknown[] }).sentUploads),
    ).toEqual([
      { name: "status-after-fix.png", alt: "The status page, all green", decorative: false },
    ]);
  });

  test("keyboard: the describe step's other answers: Esc or Cancel discards the image unsent and returns to the text, Insert as decorative sends it marked decorative", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "alt");
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(surface).toBeFocused();
    await expect(page.locator("textarea")).toHaveValue(
      "A screenshot of the status page after the fix.",
    );
    expect(
      await page.evaluate(() => (window as unknown as { sentUploads?: unknown[] }).sentUploads),
    ).toBeUndefined();
    await visitOnly(page, theme, "alt");
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(surfaceOf(page)).toBeFocused();
    await visitOnly(page, theme, "alt");
    await page.getByRole("button", { name: "Insert as decorative" }).click();
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(page.locator("textarea")).toHaveValue(/alt=""\}\n:::$/);
    expect(
      await page.evaluate(() => (window as unknown as { sentUploads?: unknown[] }).sentUploads),
    ).toEqual([{ name: "status-after-fix.png", alt: "", decorative: true }]);
  });

  test("behavior: an upload in progress is said in a status region, and a failed one is an alert that keeps the description and leaves the text alone", async ({
    page,
  }) => {
    await visitOnly(page, theme, "uploading");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.getByRole("status").filter({ hasText: "Uploading slow.png" })).toHaveCount(1);
    await visitOnly(page, theme, "failed");
    await expect(page.getByRole("alert")).toHaveText(
      "The upload server could not be reached. Nothing was added; try again.",
    );
    await expect(page.locator("textarea")).toHaveValue("The upload failed; the text is untouched.");
    await expect(page.getByRole("group", { name: "Describe the image" })).not.toHaveAttribute(
      "aria-busy",
    );
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toHaveValue(
      "The status page, all green",
    );
    await expect(page.getByRole("button", { name: "Insert image" }).last()).toBeEnabled();
  });

  test("behavior: the toolbar's Insert image opens the file chooser, and a pasted or dropped image takes the same describe step", async ({
    page,
  }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      toolbarOf(page).getByRole("button", { name: "Insert image" }).click(),
    ]);
    expect(chooser.isMultiple()).toBe(false);
    await chooser.setFiles({
      name: "chosen.png",
      mimeType: "image/png",
      buffer: Buffer.from([137, 80, 78, 71]),
    });
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.keyboard.press("Escape");
    // A paste carrying an image file.
    await surface.click();
    await surface.evaluate((n) => {
      const dt = new DataTransfer();
      dt.items.add(
        new File([new Uint8Array([137, 80, 78, 71])], "pasted.png", { type: "image/png" }),
      );
      n.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }),
      );
    });
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.keyboard.press("Escape");
    // A drop carrying one.
    await surface.evaluate((n) => {
      const dt = new DataTransfer();
      dt.items.add(
        new File([new Uint8Array([137, 80, 78, 71])], "dropped.png", { type: "image/png" }),
      );
      n.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
    });
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
  });

  test("behavior: with no onUpload there is no image button", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-lines");
    const s = section(page, "sp-lines");
    await expect(toolbarOf(s).getByRole("button", { name: "Insert image" })).toHaveCount(0);
    await expect(toolbarOf(s).getByRole("button", { name: "Chart" })).toHaveCount(0);
  });
});
