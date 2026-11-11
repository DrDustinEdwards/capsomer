---
name: generated-file
title: Generated file
summary: A panel for a file the server makes, saying whether it is made, running, ready, out of date or failed, with its download and the Generate button.
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

The panel beside something the server turns into a file: the abstract book's PDF, a printed program, an export. It says in a word and a sentence where the file stands, offers the file with its format and size, and has the one button that makes it again.

**Provenance.** EXTRACTED and REWROTE, from txasm. Extracted: the states (none, generating, ready, failed), the download link, the Generate and Regenerate words, the earlier file kept downloadable during a regenerate, and the 5 minute lock after which a run still marked generating is taken to have died (`recordGenerating`, `STALE_MS`), as the pure `fileState` and `mayStart`. Added: the stale state (the data changed after the file was made), the failure's reason, the file's size beside its link, the status glyph and word (`.cap-status`), and a disabled button while a run holds the lock. txasm drew each state as its own paragraph ("Pending", "The last generation failed"), with the Generate button live during a run; the server refused the second press, and now the button does too. The Publish to the archive action stays the app's, passed as `children` (the publish gate is the component for a publish with checks).

## When to use it

A file a person asks the server to make, which takes long enough to need a state: a PDF from a book's pages, a program from a schedule, a data export.

## When not to

- **A file a person uploads**: the drop zone, or the media library.
- **A publish with checks to pass first**: the publish gate.
- **A background job with steps and a log**: the job's own row (row-list) and its detail.

## The default and its reason

- **One status, as shape, word and color.** Not made yet (no data), Generating (running), Ready (ok), Out of date (warning), Failed (critical), each with its glyph, then a sentence in `--muted` that says what to do.
- **The lifecycle is a pure model, the same on the server and in the page.** `fileState(record, now)` reads what the store recorded; `mayStart` is the server's lock rule, so a page never offers a run the server would refuse. A run older than `LOCK_MS` (5 minutes) still marked generating died without recording an outcome (a Worker that ran out of time records nothing), so it reads as failed, "The last run stopped without finishing.", and a new run may start.
- **Out of date is its own state.** When the store passes `changedAt` (the data's last change) and it is later than the file, the file is still offered, but the panel says it was made before the latest changes. txasm had no way to say this; a chair could publish a book missing the last edits.
- **The earlier file stays offered during a regenerate and after a failure**, since the store keeps it until the new one is in.
- **The file link is a file link** (`data-link="file"`, `download`), with its format and size after it in `.cap-link-meta` ("PDF, 2.4 MB"), so a person knows what comes before the click.
- **The button is disabled while a run holds the lock or the form is being sent**, and says "Generating". A primary button when the file is missing, stale or failed; a plain one when it is ready, since making it again is then not the next step.
- **The made time is exact** (`Time` with `format="exact"`): a panel has no detail to put it in.
- **The status is `role="status"`**, so an app that polls and redraws the panel has the change read out.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves to the download link, the Generate button, then the file's other actions |
| Enter | Follows the download link, or presses the focused button |
| Space | Presses the focused button |

## Accessibility

- A panel (`section` with a heading at `level`). The status is a live region.
- The state is a word with its glyph, never color alone; the sentence is `--muted` (4.5:1), the size `--muted`.
- A disabled Generate says "Generating", so the reason it is disabled is on the button.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

`data-state` on `.cap-generated-body` is `none`, `generating`, `ready`, `stale` or `failed`. While a run holds the lock the button is `disabled aria-busy="true"` and reads "Generating".

Load `capsomer/generated-file.css` with `capsomer/panel.css`, `capsomer/status.css`, `capsomer/button.css` and, for the file link's mark and meta, `capsomer/link-file.css` (or the whole `capsomer/link.css`, which imports it).

The model: `import { fileState, mayStart, fileMeta, LOCK_MS, STATE_WORDS, STALLED_REASON } from "capsomer/behavior/generated-file"`. A record is `{ status, startedAt, generatedAt, bytes, reason, changedAt }`, the times as milliseconds, Dates or ISO strings.

```ts
// On the server, before a run:
if (!mayStart(row && { status: row.genStatus, startedAt: row.updatedAt }, Date.now())) throw new ValidationError("A file is already being made.");
```

In React, `import { GeneratedFile } from "capsomer/react/generated-file"`:

```tsx
<GeneratedFile title="Program PDF" description="Made from the schedule. It can take up to a minute."
  record={{ status: doc.genStatus, startedAt: doc.updatedAt, generatedAt: doc.generatedAt, bytes: doc.size, changedAt: program.updatedAt }}
  downloadHref={`/admin/editions/${id}/program-document/download`}
  fields={{ intent: "document-generate" }} busy={navigation.state === "submitting"}
  renderForm={({ className, children }) => <Form method="post" className={className}>{children}</Form>}>
  [Publish to the archive]
</GeneratedFile>
```

`generate={false}` leaves out the Generate form, for a file another step makes (a book PDF made when the book is published): the panel says the state and offers the file, and the stale and failed sentences ask for nothing. A record's `status` may be `"pending"`, a store's word for a row before its first run; it reads as not made.

`format` (default "PDF") names the file in the link and button words; `downloadLabel`, `generateLabel` and `regenerateLabel` replace them; `messages` replaces a state's sentence; `lockMs` changes the lock; `now` fixes the clock.

## Exceptions in production

None yet. The panel does not poll: while a run is going it says to refresh. An app that wants it to update by itself revalidates on an interval while the state is `generating`.
