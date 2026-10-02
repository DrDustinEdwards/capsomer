import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, paintedContrast, visitStates } from "../../test/helpers.ts";
import {
  blockEdit,
  countWords,
  filterLinkTargets,
  footnoteEdit,
  headingEdit,
  linkEdit,
  looksLikeUrl,
  minutesForWords,
  rovingIndex,
  scaffoldCursor,
  wrapEdit,
} from "./markdown-editor.ts";

const NAME = "markdown-editor";
const section = (page: Page, id: string) => page.locator(`#${id}`);
const surfaceOf = (scope: Page | Locator) => scope.getByRole("textbox", { name: /, markdown$/ });
const toolbarOf = (scope: Page | Locator) => scope.getByRole("toolbar", { name: "Markdown formatting" });

// Waits until the textarea has been upgraded, then returns the editable surface.
async function ready(page: Page, id: string): Promise<Locator> {
  const s = section(page, id);
  await expect(s.locator(".cm-content")).toBeVisible();
  return surfaceOf(s);
}

async function visitOnly(page: Page, theme: "light" | "dark", id: string): Promise<Locator> {
  await visitStates(page, NAME, theme, id);
  await expect(page.locator(".cm-content")).toBeVisible();
  return surfaceOf(page);
}

// Puts `text` in an empty surface by typing it, which is what a person does.
async function type(page: Page, surface: Locator, text: string) {
  await surface.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.keyboard.type(text);
}

// Tags the syntax token whose text is `text`, so its painted colour can be measured.
async function probe(page: Page, scope: string, text: string): Promise<string> {
  await page.evaluate(
    ([root, needle]) => {
      document.querySelectorAll("[data-probe]").forEach((n) => n.removeAttribute("data-probe"));
      const spans = [...document.querySelectorAll(`${root} .cm-line span`)];
      const hit = spans.filter((s) => s.textContent?.includes(needle ?? "")).pop();
      hit?.setAttribute("data-probe", "");
    },
    [scope, text] as const,
  );
  return "[data-probe]";
}

// A colour pair as the browser resolves it, through a canvas, so color-mix() and var() read as rgb.
async function pairRatio(page: Page, fg: string, bg: string): Promise<number> {
  return page.evaluate(
    ([f, b]) => {
      const probeEl = document.createElement("div");
      probeEl.style.setProperty("color", f ?? "");
      probeEl.style.setProperty("background-color", b ?? "");
      document.body.append(probeEl);
      const cs = getComputedStyle(probeEl);
      const px = (css: string) => {
        const c = document.createElement("canvas").getContext("2d");
        if (!c) return [0, 0, 0] as const;
        c.fillStyle = "#000";
        c.fillStyle = css;
        c.fillRect(0, 0, 1, 1);
        const d = c.getImageData(0, 0, 1, 1).data;
        return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0] as const;
      };
      const fgc = px(cs.color);
      const bgc = px(cs.backgroundColor);
      probeEl.remove();
      const lum = (c: readonly [number, number, number]) => {
        const k = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : Math.pow((v / 255 + 0.055) / 1.055, 2.4));
        return 0.2126 * k(c[0]) + 0.7152 * k(c[1]) + 0.0722 * k(c[2]);
      };
      const a = lum(fgc);
      const l = lum(bgc);
      return (Math.max(a, l) + 0.05) / (Math.min(a, l) + 0.05);
    },
    [fg, bg] as const,
  );
}

// ---- pure helpers (no browser) -------------------------------------------------------------
test("behaviour: words and reading time count markdown as the site's published times do", () => {
  expect(countWords("")).toBe(0);
  expect(countWords("  one  two\nthree ")).toBe(3);
  expect(countWords("## A heading")).toBe(3);
  expect(minutesForWords(0)).toBe(1);
  expect(minutesForWords(400)).toBe(2);
  expect(minutesForWords(500, 250)).toBe(2);
});

test("behaviour: a typed address is recognised, and a query filters the pages by title, address and hint", () => {
  expect(["https://a.example", "mailto:x@y.example", "/writing/a", "#top"].every(looksLikeUrl)).toBe(true);
  expect(looksLikeUrl("moving the monitors")).toBe(false);
  const t = [
    { href: "/writing/moving-the-monitors", title: "Moving the monitors" },
    { href: "/writing/quiet-hours", title: "Quiet hours", hint: "draft notes" },
  ];
  expect(filterLinkTargets(t, "").length).toBe(2);
  expect(filterLinkTargets(t, "MONITORS").map((x) => x.title)).toEqual(["Moving the monitors"]);
  expect(filterLinkTargets(t, "quiet-hours").length).toBe(1);
  expect(filterLinkTargets(t, "notes").length).toBe(1);
  expect(filterLinkTargets(t, "https://x.example")).toEqual([]);
  expect(filterLinkTargets(Array.from({ length: 20 }, (_, i) => ({ href: `/${i}`, title: `Post ${i}` })), "").length).toBe(8);
});

test("behaviour: the roving key map wraps and honours Home and End", () => {
  expect(rovingIndex("ArrowRight", 2, 3)).toBe(0);
  expect(rovingIndex("ArrowLeft", 0, 3)).toBe(2);
  expect(rovingIndex("ArrowDown", 0, 3)).toBeNull();
  expect(rovingIndex("ArrowDown", 1, 3, "vertical")).toBe(2);
  expect(rovingIndex("Home", 2, 3)).toBe(0);
  expect(rovingIndex("End", 0, 3)).toBe(2);
  expect(rovingIndex("a", 0, 3)).toBeNull();
  expect(rovingIndex("ArrowRight", 0, 0)).toBeNull();
});

test("behaviour: the edits wrap, cycle, number, place and link as the site's editor did", () => {
  expect(wrapEdit("a b", 2, 3, "**")).toEqual({ changes: [{ from: 2, to: 3, insert: "**b**" }], anchor: 4, head: 5 });
  expect(wrapEdit("", 0, 0, "_").head).toBeUndefined();
  // Heading cycle: none, h2, h3, h4, none.
  const step = (doc: string) => {
    const e = headingEdit(doc, 0);
    const c = e.changes[0]!;
    return doc.slice(0, c.from) + c.insert + doc.slice(c.to ?? c.from);
  };
  expect(step("Title")).toBe("## Title");
  expect(step("## Title")).toBe("### Title");
  expect(step("### Title")).toBe("#### Title");
  expect(step("#### Title")).toBe("Title");
  // Footnotes are numbered past the highest in the text, so the second is 2 (the site made it 3).
  const first = footnoteEdit("Text", 4, 4);
  expect(first.changes.map((c) => c.insert)).toEqual(["[^1]", "\n\n[^1]: "]);
  expect(footnoteEdit("Text[^1]\n\n[^1]: a", 4, 4).changes[0]?.insert).toBe("[^2]");
  // A block is set apart by a blank line unless the cursor is on one.
  expect(blockEdit("Intro", 5, 5, ":::x:::").changes[0]?.insert).toBe("\n\n:::x:::");
  expect(blockEdit("Intro\n\n", 7, 7, ":::x:::").changes[0]?.insert).toBe(":::x:::");
  expect(linkEdit(0, 4, "Post", "/writing/p", "A post").changes[0]?.insert).toBe("[Post](/writing/p)");
  expect(linkEdit(0, 0, "", "/writing/p", "A post").changes[0]?.insert).toBe("[A post](/writing/p)");
  expect(scaffoldCursor({ id: "f", label: "F", hint: "", text: ':::figure{src="" alt=""}', cursorAfter: 'src="' })).toBe(':::figure{src="'.length);
  expect(scaffoldCursor({ id: "f", label: "F", hint: "", text: "abc", cursor: 2 })).toBe(2);
});

eachTheme((theme) => {
  // ---- accessibility ---------------------------------------------------------------------
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await expect(page.locator(".cm-content")).toHaveCount(8);
    await expectNoAxeViolations(page, undefined, { baseUi: true });
  });

  for (const id of ["palette", "slash", "alt", "uploading", "failed"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitOnly(page, theme, id);
      if (id === "palette") await expect(page.getByRole("combobox", { name: "Link to" })).toBeVisible();
      if (id === "slash") await expect(page.getByRole("list", { name: "Insert a block" })).toBeVisible();
      if (id === "alt") await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeVisible();
      if (id === "failed") await expect(page.getByRole("alert")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: text, placeholder, gutter, syntax tones and the footer reach their contrast", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await expect(page.locator(".cm-content")).toHaveCount(8);
    const d = "#sp-default";
    await expectContrast(page, [
      { sel: `${d} .cm-line`, what: "body text" },
      { sel: `#sp-empty .cm-placeholder`, what: "the placeholder" },
      { sel: `#sp-lines .cm-gutterElement`, what: "a line number on the gutter" },
      { sel: `${d} .cap-md-toolbar .cap-md-tool`, what: "a toolbar icon" },
      { sel: `${d} .cap-md-toolbar-hint`, what: "the toolbar hint" },
      { sel: `${d} .cap-md-count`, what: "the word count" },
      { sel: `${d} .cap-md-hint`, what: "the drop hint" },
      { sel: `${d} .cap-field-label`, what: "the label" },
      { sel: `${d} .cap-field-help`, what: "the help" },
      { sel: `#sp-invalid .cap-field-error`, what: "the error message" },
      { sel: `#sp-limit .cap-md-limit`, what: "the over-the-limit words" },
      { sel: `#sp-readonly .cm-line`, what: "read-only text on its sunken ground" },
      { sel: `#sp-disabled .cm-line`, what: "disabled text on its sunken ground" },
      { sel: `${d} .cap-md-frame`, what: "the editor's edge", part: "border" },
      { sel: `#sp-invalid .cap-md-frame`, what: "the invalid editor's edge", part: "border" },
      { sel: `${d} .cap-md-toolbar .cap-md-tool`, what: "a toolbar button's boundary when hovered is not needed; its icon carries it", part: "color", min: 3 },
    ]);
    // Each syntax tone, measured on the token itself.
    for (const [text, what] of [
      ["Why the checks moved to the edge", "a heading"],
      ["A check that cries wolf", "a quote"],
      ["Checks every 5 minutes", "a list item"],
    ] as const) {
      const sel = await probe(page, d, text);
      await expectContrast(page, [{ sel, what: `${what} (${text})` }]);
    }
  });

  test("accessibility: code and link tones reach 4.5:1", async ({ page }) => {
    await visitOnly(page, theme, "palette");
    const surface = surfaceOf(page);
    await type(page, surface, "A [link](/writing/a) and `code` and **bold** and _italic_.\n\nSee https://example.org/x.");
    for (const needle of ["link", "/writing/a", "code", "bold", "italic", "https://example.org/x"]) {
      const sel = await probe(page, "body", needle);
      await expectContrast(page, [{ sel, what: `the token ${needle}` }]);
    }
  });

  test("accessibility: the selection keeps the text readable and shows where it is", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-default");
    const text = await pairRatio(page, "var(--text)", "color-mix(in srgb, var(--accent) 28%, var(--surface))");
    expect(text).toBeGreaterThanOrEqual(4.5);
    // And it is distinguishable from the unselected surface: 1.4:1 or more.
    const shows = await pairRatio(page, "color-mix(in srgb, var(--accent) 28%, var(--surface))", "var(--surface)");
    expect(shows).toBeGreaterThanOrEqual(1.4);
  });

  test("accessibility: the palette's options, the active option and the slash menu reach their contrast", async ({ page }) => {
    await visitOnly(page, theme, "palette");
    await expect(page.getByRole("option").first()).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-md-option[aria-selected='true'] .cap-md-option-title", what: "the active option's title on accent-soft" },
      { sel: ".cap-md-option[aria-selected='true'] .cap-md-option-hint", what: "the active option's address on accent-soft" },
      { sel: ".cap-md-option[aria-selected='false'] .cap-md-option-title", what: "an option's title" },
      { sel: ".cap-md-option[aria-selected='false'] .cap-md-option-hint", what: "an option's address" },
      { sel: ".cap-md-palette-label", what: "the palette's label" },
      { sel: ".cap-md-palette-input", what: "the palette's input edge", part: "border" },
    ]);
    await visitOnly(page, theme, "slash");
    await expect(page.getByRole("button", { name: /Chart/ }).first()).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-md-slash-item strong", what: "a block's name" },
      { sel: ".cap-md-slash-hint", what: "a block's hint" },
    ]);
    await page.getByRole("list", { name: "Insert a block" }).getByRole("button", { name: /Chart/ }).hover();
    await expectContrast(page, [{ sel: ".cap-md-slash-item:hover .cap-md-slash-hint", what: "a hovered block's hint" }]);
  });

  test("accessibility: the alt step's labels, help and fields reach their contrast", async ({ page }) => {
    await visitOnly(page, theme, "alt");
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-md-upload .cap-field-label", what: "the alt label" },
      { sel: ".cap-md-upload .cap-field-help", what: "the alt help" },
      { sel: ".cap-md-upload .cap-input", what: "the alt input's edge", part: "border" },
    ]);
    await visitOnly(page, theme, "uploading");
    await expect(page.getByRole("group", { name: "Describe the image" })).toBeVisible();
    await expectContrast(page, [{ sel: ".cap-md-upload-wait", what: "the uploading line" }]);
    await visitOnly(page, theme, "failed");
    await expect(page.getByRole("alert")).toBeVisible();
    await expectContrast(page, [{ sel: ".cap-md-upload-error", what: "the failed-upload message" }]);
  });

  test("accessibility: the toolbar's roles and names, and the surface's name and description", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-default");
    await expect(toolbarOf(section(page, "sp-default"))).toMatchAriaSnapshot(`
      - toolbar "Markdown formatting":
        - button "Bold"
        - button "Italic"
        - button "Link"
        - button "Heading level"
        - button "Code"
        - button "Footnote"
        - button "Insert image"
        - button "Chart"
        - button "Diagram"
        - button "Figure"
    `);
    await expect(surface).toHaveAccessibleName("Body, markdown");
    await expect(surface).toHaveAccessibleDescription(/Markdown\. Ctrl or Cmd \+ K links to a page/);
    await expect(surface).toHaveAttribute("aria-multiline", "true");
    // The label the page loaded with still names the field, and the textarea is out of the way.
    await expect(section(page, "sp-default").locator("textarea")).toBeHidden();
  });

  test("accessibility: the link palette is a labelled combobox over a listbox, the slash menu a named list", async ({ page }) => {
    await visitOnly(page, theme, "palette");
    const input = page.getByRole("combobox", { name: "Link to" });
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("listbox", { name: "Pages" }).getByRole("option")).toHaveCount(3);
    await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("option", { name: /Quiet hours, explained.*not live yet \(draft\)/ })).toBeVisible();
    await visitOnly(page, theme, "slash");
    await expect(page.getByRole("list", { name: "Insert a block" }).getByRole("button")).toHaveCount(3);
  });

  test("accessibility: the states say what they are in words, not only colour", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-invalid");
    await expect(surfaceOf(section(page, "sp-invalid"))).toHaveAttribute("aria-invalid", "true");
    await expect(surfaceOf(section(page, "sp-invalid"))).toHaveAccessibleDescription(/no alt text/);
    await expect(section(page, "sp-limit").locator(".cap-md-limit")).toContainText("over the 60 character limit");
    await expect(surfaceOf(section(page, "sp-readonly"))).toHaveAttribute("aria-readonly", "true");
    await expect(surfaceOf(section(page, "sp-disabled"))).toHaveAttribute("aria-disabled", "true");
    await expect(surfaceOf(section(page, "sp-disabled"))).toHaveAccessibleDescription(/Locked while the draft is being published/);
  });

  test("accessibility: the word count is not a live region", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-default");
    const live = await section(page, "sp-default").locator(".cap-md-stats").evaluate((n) => !!n.closest("[aria-live], [role='status'], [role='alert'], [role='log']"));
    expect(live).toBe(false);
  });

  test("accessibility: forced colors keep the focus ring and the active option visible", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await visitOnly(page, theme, "palette");
    const option = page.getByRole("option").first();
    await expect(option).toBeVisible();
    const outline = await option.evaluate((n) => ({ style: getComputedStyle(n).outlineStyle, width: getComputedStyle(n).outlineWidth }));
    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThan(0);
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-default");
    await surface.focus();
    const ring = await section(page, "sp-default").locator(".cm-editor").evaluate((n) => getComputedStyle(n).outlineStyle);
    expect(ring).not.toBe("none");
  });

  test("accessibility: focus on the surface is a visible ring inside the frame", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-default");
    await surface.focus();
    const ring = await section(page, "sp-default").locator(".cm-editor").evaluate((n) => {
      const cs = getComputedStyle(n);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), offset: parseFloat(cs.outlineOffset) };
    });
    expect(ring.style).toBe("solid");
    expect(ring.width).toBeGreaterThanOrEqual(2);
    // Inset, because the frame clips overflow (WCAG 2.4.7).
    expect(ring.offset).toBeLessThan(0);
    await expectContrast(page, [{ sel: "#sp-default .cm-editor", what: "the focus ring", part: "outline" }]);
  });

  // ---- keyboard (one per row of the doc page's table) ------------------------------------
  test("keyboard: Tab enters the toolbar at one stop, the next Tab enters the surface", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-empty");
    // Focus the page's last control before the empty editor, then Tab.
    await page.locator("#sp-lines .cm-content").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // Whatever follows #sp-lines, it is not still inside the earlier toolbar's other buttons.
    const tabbable = await toolbarOf(section(page, "sp-empty")).locator(".cap-md-tool").evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
    expect(tabbable.filter((t) => t === 0)).toHaveLength(1);
    expect(tabbable.filter((t) => t === -1).length).toBe(tabbable.length - 1);
    const first = toolbarOf(section(page, "sp-empty")).getByRole("button", { name: "Bold" });
    await first.focus();
    await page.keyboard.press("Tab");
    await expect(surfaceOf(section(page, "sp-empty"))).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(first).toBeFocused();
  });

  test("keyboard: arrows, Home and End move between the toolbar's buttons and wrap", async ({ page }) => {
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

  test("keyboard: Ctrl+B, I and E wrap the selection, and with none put the cursor between the marks", async ({ page }) => {
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

  test("keyboard: Ctrl+K opens the link palette with the selection as its query", async ({ page }) => {
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

  test("keyboard: in the link palette arrows choose, Enter links, and the cursor lands after the link", async ({ page }) => {
    const surface = await visitOnly(page, theme, "palette");
    await expect(page.getByRole("combobox", { name: "Link to" })).toBeFocused();
    await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("combobox")).toHaveAttribute("aria-activedescendant", /opt-1$/);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("option").nth(2)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(surface).toBeFocused();
    await expect(page.locator("textarea")).toHaveValue(/Read more: \[The first incident write-up\]\(\/writing\/first-incident\)$/);
    await page.keyboard.type(" Next.");
    await expect(page.locator("textarea")).toHaveValue(/\(\/writing\/first-incident\) Next\.$/);
  });

  test("keyboard: in the link palette a typed address is linked as it is", async ({ page }) => {
    await visitOnly(page, theme, "palette");
    await page.keyboard.type("https://status.example.org");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.locator(".cap-md-palette-note")).toHaveText("Enter to link to this address");
    await page.keyboard.press("Enter");
    await expect(page.locator("textarea")).toHaveValue(/\[https:\/\/status\.example\.org\]\(https:\/\/status\.example\.org\)$/);
  });

  test("keyboard: Esc closes the link palette and returns to the text with the selection as it was", async ({ page }) => {
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

  test("keyboard: a lone / on a line opens the block menu, Down enters it, arrows move, Enter inserts the block in its place", async ({ page }) => {
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

  test("keyboard: a / inside a line or among other text does not open the block menu", async ({ page }) => {
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

  test("keyboard: Ctrl+S hands the text to the app and does not leave the editor", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await type(page, surface, "Draft text");
    let prevented = false;
    await page.exposeFunction("capSawSave", () => (prevented = true));
    await page.evaluate(() => document.addEventListener("cap-md-save", (e) => (window as unknown as { capSawSave: (v: string) => void }).capSawSave((e as CustomEvent).detail.value)));
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

  test("keyboard: Tab leaves the surface (no trap), and Esc then Tab does the same after a menu", async ({ page }) => {
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

  test("keyboard: the toolbar's Footnote button adds a numbered reference and lands in its definition", async ({ page }) => {
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

  test("keyboard: a toolbar block button inserts the block set apart by a blank line", async ({ page }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    await type(page, surface, "Intro");
    await toolbarOf(page).getByRole("button", { name: "Figure" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("textarea")).toHaveValue(/^Intro\n\n:::figure\{src=""/);
    await page.keyboard.type("/media/a.png");
    await expect(page.locator("textarea")).toHaveValue(/src="\/media\/a\.png" alt=""\}/);
  });

  // ---- the image step --------------------------------------------------------------------
  test("keyboard: after an upload focus moves to the alt field, Insert waits for alt text, Enter inserts, focus returns to the text", async ({ page }) => {
    const surface = await visitOnly(page, theme, "alt");
    const alt = page.getByRole("textbox", { name: /Alt text/ });
    await expect(alt).toBeFocused();
    const insert = page.getByRole("button", { name: "Insert image" }).last();
    await expect(insert).toBeDisabled();
    await expect(page.locator(".cap-md-upload .cap-field-help")).toBeVisible();
    await page.keyboard.type("The status page, all green");
    await expect(insert).toBeEnabled();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(surface).toBeFocused();
    await expect(page.locator("textarea")).toHaveValue(/^A screenshot of the status page after the fix\.\n\n:::figure\{src="data:image\/svg\+xml,[^"]+" alt="The status page, all green"\}\n:::$/);
    await expect(page.getByRole("status").filter({ hasText: "Image added" })).toHaveCount(1);
  });

  test("keyboard: Esc or Cancel in the alt step discards the image and returns to the text", async ({ page }) => {
    const surface = await visitOnly(page, theme, "alt");
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(surface).toBeFocused();
    await expect(page.locator("textarea")).toHaveValue("A screenshot of the status page after the fix.");
    await visitOnly(page, theme, "alt");
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
    await expect(surfaceOf(page)).toBeFocused();
  });

  test("behaviour: an upload in progress is said in a status region, and a failed one is an alert that leaves the text alone", async ({ page }) => {
    await visitOnly(page, theme, "uploading");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("status").filter({ hasText: "Uploading slow.png" })).toHaveCount(1);
    await visitOnly(page, theme, "failed");
    await expect(page.getByRole("alert")).toHaveText("The upload server could not be reached. Nothing was added; try again.");
    await expect(page.locator("textarea")).toHaveValue("The upload failed; the text is untouched.");
    await expect(page.getByRole("group", { name: "Describe the image" })).toHaveCount(0);
  });

  test("behaviour: the toolbar's Insert image opens the file chooser, and a pasted or dropped image takes the same alt step", async ({ page }) => {
    const surface = await visitOnly(page, theme, "palette");
    await page.keyboard.press("Escape");
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), toolbarOf(page).getByRole("button", { name: "Insert image" }).click()]);
    expect(chooser.isMultiple()).toBe(false);
    await chooser.setFiles({ name: "chosen.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71]) });
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.keyboard.press("Escape");
    // A paste carrying an image file.
    await surface.click();
    await surface.evaluate((n) => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], "pasted.png", { type: "image/png" }));
      n.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
    await page.keyboard.press("Escape");
    // A drop carrying one.
    await surface.evaluate((n) => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], "dropped.png", { type: "image/png" }));
      n.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
    });
    await expect(page.getByRole("textbox", { name: /Alt text/ })).toBeFocused();
  });

  test("behaviour: with no onUpload there is no image button and no drop hint", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-lines");
    const s = section(page, "sp-lines");
    await expect(toolbarOf(s).getByRole("button", { name: "Insert image" })).toHaveCount(0);
    await expect(s.locator(".cap-md-hint")).toBeHidden();
    await expect(toolbarOf(s).getByRole("button", { name: "Chart" })).toHaveCount(0);
    await expect(s.locator(".cap-md-toolbar-hint")).toHaveCount(0);
  });

  // ---- behaviour -------------------------------------------------------------------------
  test("behaviour: the textarea the page loaded with holds the text, is labelled, and is hidden once upgraded", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-default");
    const ta = section(page, "sp-default").locator("textarea");
    await expect(ta).toHaveValue(/^## Why the checks moved to the edge/);
    await expect(ta).toBeHidden();
    await expect(surfaceOf(section(page, "sp-default"))).toContainText("The monitors now run from three regions");
    await section(page, "sp-default").getByText("Body", { exact: true }).click();
    await expect(surfaceOf(section(page, "sp-default"))).toBeFocused();
  });

  test("behaviour: what a person types is kept in the textarea, with an input event, so a form posts it", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await page.evaluate(() => {
      (window as unknown as { capInputs: number }).capInputs = 0;
      document.getElementById("md-form")?.addEventListener("input", () => ((window as unknown as { capInputs: number }).capInputs += 1));
    });
    await type(page, surface, "## Posted from the editor\n\nTwo lines.");
    await expect(page.locator("#md-form")).toHaveValue("## Posted from the editor\n\nTwo lines.");
    expect(await page.evaluate(() => (window as unknown as { capInputs: number }).capInputs)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.locator("#posted")).toHaveText(JSON.stringify("## Posted from the editor\n\nTwo lines."));
  });

  test("behaviour: saving an empty required editor names the problem, focuses the surface and clears when fixed", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.locator("#posted")).toHaveText("nothing yet");
    await expect(surface).toBeFocused();
    await expect(surface).toHaveAttribute("aria-invalid", "true");
    await expect(surface).toHaveAccessibleDescription("Write something before saving.");
    await expect(page.getByRole("alert")).toHaveText("Write something before saving.");
    await page.keyboard.type("Now there is text");
    await expect(surface).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("behaviour: the word count and reading time follow the text, and the limit is said in words", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-empty");
    const stats = section(page, "sp-empty").locator(".cap-md-stats");
    await expect(stats).toHaveText("0 words");
    await type(page, surface, "one");
    await expect(stats).toHaveText("1 word · 1 min read");
    await type(page, surface, Array.from({ length: 450 }, () => "w").join(" "));
    await expect(stats).toHaveText("450 words · 2 min read");
    await expect(section(page, "sp-limit").locator(".cap-md-stats")).toContainText("over the 60 character limit");
    await type(page, await ready(page, "sp-limit"), "Short.");
    await expect(section(page, "sp-limit").locator(".cap-md-stats")).toContainText("6 of 60 characters");
    await expect(section(page, "sp-limit").locator(".cap-md-limit")).not.toHaveAttribute("data-over", "");
  });

  test("behaviour: the placeholder shows while the editor is empty and goes when there is text", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-empty");
    const ph = section(page, "sp-empty").locator(".cm-placeholder");
    await expect(ph).toHaveText("Write the incident notes in markdown.");
    await surface.click();
    await page.keyboard.type("x");
    await expect(ph).toHaveCount(0);
  });

  test("behaviour: long lines wrap instead of scrolling sideways", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-empty");
    await type(page, surface, Array.from({ length: 120 }, () => "wrapping").join(" "));
    const { scrollW, clientW } = await section(page, "sp-empty").locator(".cm-scroller").evaluate((n) => ({ scrollW: n.scrollWidth, clientW: n.clientWidth }));
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);
  });

  test("behaviour: line numbers appear on the gutter only when asked for", async ({ page }) => {
    await visitStates(page, NAME, theme);
    await ready(page, "sp-lines");
    await ready(page, "sp-default");
    await expect(section(page, "sp-lines").locator(".cm-gutters")).toBeVisible();
    await expect(section(page, "sp-default").locator(".cm-gutters")).toHaveCount(0);
  });

  test("behaviour: read-only keeps focus, selection and scrolling but takes no edits, and its toolbar is off", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-readonly");
    await surface.click();
    await expect(surface).toBeFocused();
    await page.keyboard.type("nope");
    await page.keyboard.press("Control+b");
    await expect(page.locator("#md-readonly")).toHaveValue(/^## Moving the monitors\n\nThree regions, one quiet hour\.$/);
    for (const b of await toolbarOf(section(page, "sp-readonly")).getByRole("button").all()) await expect(b).toBeDisabled();
    await expect(surface).toHaveAttribute("aria-readonly", "true");
  });

  test("behaviour: disabled takes no focus, is not posted, and its toolbar is off", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-disabled");
    await expect(surface).toHaveAttribute("contenteditable", "false");
    await expect(section(page, "sp-disabled").locator("textarea")).toBeDisabled();
    for (const b of await toolbarOf(section(page, "sp-disabled")).getByRole("button").all()) await expect(b).toBeDisabled();
  });

  test("behaviour: a change to the textarea's attributes reaches the editor", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-default");
    await page.locator("#md-default").evaluate((t: HTMLTextAreaElement) => (t.readOnly = true));
    await expect(surface).toHaveAttribute("aria-readonly", "true");
    await page.locator("#md-default").evaluate((t: HTMLTextAreaElement) => {
      t.readOnly = false;
      t.setAttribute("aria-invalid", "true");
    });
    await expect(surface).toHaveAttribute("aria-invalid", "true");
    await expect(surface).not.toHaveAttribute("aria-readonly", "true");
  });

  test("behaviour: a form reset puts the text the page loaded with back", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await type(page, surface, "scratch");
    await page.locator("#draft-form").evaluate((f: HTMLFormElement) => f.reset());
    await expect(page.locator("#md-form")).toHaveValue("");
    await expect(section(page, "sp-form").locator(".cm-placeholder")).toBeVisible();
  });

  test("behaviour: the handle sets and reads the text without calling onChange, and destroying it gives the textarea back", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { capHandles: Record<string, { getValue(): string; setValue(v: string): void; destroy(): void }> };
      w.capHandles = {};
      document.addEventListener("cap-md-ready", (e) => {
        const detail = (e as CustomEvent).detail.handle;
        w.capHandles[detail.root.querySelector("textarea").id] = detail;
      });
    });
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-form");
    await page.evaluate(() => (window as unknown as { capHandles: Record<string, { setValue(v: string): void }> }).capHandles["md-form"]?.setValue("Set by the app"));
    await expect(surface).toContainText("Set by the app");
    await expect(page.locator("#md-form")).toHaveValue("Set by the app");
    expect(await page.evaluate(() => (window as unknown as { capHandles: Record<string, { getValue(): string }> }).capHandles["md-form"]?.getValue())).toBe("Set by the app");
    // The marker an editor carries: ready, and not upgraded a second time.
    expect(await page.locator("#sp-form [data-cap]").getAttribute("data-cap-md")).toBe("ready");
    await page.evaluate(() => (window as unknown as { capHandles: Record<string, { destroy(): void }> }).capHandles["md-form"]?.destroy());
    await expect(page.locator("#sp-form .cm-content")).toHaveCount(0);
    await expect(page.locator("#md-form")).toBeVisible();
    await expect(page.locator("#md-form")).toHaveValue("Set by the app");
    await expect(page.locator("#sp-form [data-cap]")).not.toHaveAttribute("data-cap-md", "ready");
  });

  test("behaviour: the block menu is the app's data, and with none supplied a lone / is only text", async ({ page }) => {
    await visitStates(page, NAME, theme);
    const surface = await ready(page, "sp-empty");
    await type(page, surface, "/");
    await expect(page.getByRole("list", { name: "Insert a block" })).toHaveCount(0);
    await expect(toolbarOf(section(page, "sp-empty")).getByRole("button", { name: "Chart" })).toHaveCount(0);
  });

  test("behaviour: it fits a phone: the toolbar wraps and nothing scrolls the page sideways", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await visitStates(page, NAME, theme);
    await ready(page, "sp-default");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const target = await toolbarOf(section(page, "sp-default")).getByRole("button", { name: "Bold" }).boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(24);
    expect(target?.height).toBeGreaterThanOrEqual(24);
  });

  test("behaviour: with a CSP that needs a nonce, the editor's styles carry it and nothing is blocked", async ({ page }) => {
    const nonce = "n0nc3abc";
    await page.route("**/components/markdown-editor/states.html*", async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace("<head>", `<head><script nonce="${nonce}"></script>`);
      await route.fulfill({ response: res, body, headers: { ...res.headers(), "content-security-policy": `style-src 'self' 'nonce-${nonce}'` } });
    });
    const violations: string[] = [];
    await page.exposeFunction("capViolation", (v: string) => violations.push(v));
    await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => (window as unknown as { capViolation: (v: string) => void }).capViolation(`${e.violatedDirective} ${e.blockedURI}`)));
    await visitStates(page, NAME, theme);
    await ready(page, "sp-default");
    const styled = await page.locator("#sp-default .cm-scroller").evaluate((n) => getComputedStyle(n).fontFamily);
    expect(styled).toContain("Martian Mono");
    expect(await page.locator("style[nonce]").count()).toBeGreaterThan(0);
    expect(violations.filter((v) => v.startsWith("style-src-elem"))).toEqual([]);
  });
});

// ---- no script: the page as delivered ------------------------------------------------------
test.describe("without script", () => {
  test.use({ javaScriptEnabled: false });
  test("accessibility: the page as delivered has a labelled textarea holding the markdown", async ({ page }) => {
    await page.goto(`components/${NAME}/states.html`);
    const ta = page.getByRole("textbox", { name: "Body" }).first();
    await expect(ta).toBeVisible();
    await expect(ta).toHaveValue(/^## Why the checks moved to the edge/);
    await expect(page.locator("#md-nojs")).toHaveValue(/The monitors now run from three regions\./);
    await expect(page.locator(".cm-content")).toHaveCount(0);
  });
});

test("behaviour: the HTML the server sends already contains the text, label and textarea", async ({ request }) => {
  const res = await request.get(`components/${NAME}/states.html`);
  const html = await res.text();
  expect(html).toMatch(/<label[^>]*for="md-default"[^>]*>Body<\/label>/);
  expect(html).toMatch(/<textarea[^>]*id="md-default"[^>]*>[\s\S]*## Why the checks moved to the edge[\s\S]*<\/textarea>/);
  expect(html).toContain("The monitors now run from three regions");
  // The toolbar is made by script: it is not in the HTML.
  expect(html).not.toContain('role="toolbar"');
});

test("behaviour: CodeMirror is its own chunk: the behaviour module's bundle does not hold it", async ({ request }) => {
  const res = await request.get(`components/${NAME}/states.html`);
  const html = await res.text();
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1] ?? "");
  expect(scripts.length).toBeGreaterThan(0);
  for (const src of scripts) {
    const js = await (await request.get(new URL(src, `http://localhost/components/${NAME}/`).pathname.replace(/^\//, ""))).text();
    expect(js, `${src} must not contain CodeMirror's EditorView`).not.toMatch(/class\s+\w+\s*\{[^}]*coordsAtPos/);
  }
});
