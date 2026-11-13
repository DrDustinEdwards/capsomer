---
name: generated-file
title: Generated file
summary: A panel for a file the server makes, saying whether it is made, running, ready, out of date or failed, with its download and the Generate button.
group: pattern
parts: [css, behavior, react]
tool: native
states: [never made, generating on a first run, regenerating with the earlier file kept, ready with its size and date, stale since the data changed, failed with the reason, a run that stopped without finishing, the form being sent, made by another step with no Generate button]
added: 0.98.0
updated: 0.98.0
source: txasm app/components/program-builder/document-panel.tsx (ProgramDocumentPanel), app/routes/admin.editions.$editionId.book.tsx (the Book PDF panel), app/lib/data-access/documents.ts (recordGenerating, recordReady, recordFailed, the 5 minute stale lock)
replaces:
  - 'genStatus === "(generating|ready|failed)"'
  - 'function ProgramDocumentPanel\b'
  - '>(Generate|Regenerate) (program|book) PDF<'
---

# Generated file

## Usage

```html
<section class="cap-panel cap-generated">
  <header class="cap-panel-head">
    <h2>Program PDF</h2>
    <p class="cap-panel-desc">Made from the schedule. It can take up to a minute.</p>
  </header>
  <div class="cap-panel-body">
    <div class="cap-generated-body" data-state="ready">
      <p class="cap-generated-status" role="status">
        <span class="cap-status" data-tone="ok">[ok glyph]Ready</span>
        <span class="cap-generated-says">Made <time class="cap-time" datetime="2027-02-19T21:04:00.000Z" data-format="exact">February 19, 2027, 9:04 PM UTC</time>.</span>
      </p>
      <p class="cap-generated-file"><a href="/program/download" data-link="file" download>Download the PDF</a> <span class="cap-link-meta">PDF, 2.4 MB</span></p>
    </div>
  </div>
  <footer class="cap-panel-foot">
    <div class="cap-generated-actions">
      <form method="post" class="cap-generated-form">
        <input type="hidden" name="intent" value="document-generate">
        <button type="submit" class="cap-btn">Regenerate the PDF</button>
      </form>
      [Publish to the archive]
    </div>
  </footer>
</section>
```

```ts
// On the server, before a run:
if (!mayStart(row && { status: row.genStatus, startedAt: row.updatedAt }, Date.now())) throw new ValidationError("A file is already being made.");
```

```tsx
<GeneratedFile title="Program PDF" description="Made from the schedule. It can take up to a minute."
  record={{ status: doc.genStatus, startedAt: doc.updatedAt, generatedAt: doc.generatedAt, bytes: doc.size, changedAt: program.updatedAt }}
  downloadHref={`/admin/editions/${id}/program-document/download`}
  fields={{ intent: "document-generate" }} busy={navigation.state === "submitting"}
  renderForm={({ className, children }) => <Form method="post" className={className}>{children}</Form>}>
  [Publish to the archive]
</GeneratedFile>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves to the download link, the Generate button, then the file's other actions |
| Enter | Follows the download link, or presses the focused button |
| Space | Presses the focused button |

- A panel (`section` with a heading at `level`). The status is a live region.
- The state is a word with its glyph, never color alone; the sentence is `--muted` (4.5:1), the size `--muted`.
- A disabled Generate says "Generating", so the reason it is disabled is on the button.
