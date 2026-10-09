# Design: shared posts, media and mentions components

Job job_cb906e07145c, 2026-10-09. This is a design only: nothing is built. It follows Dustin's standing direction of 2026-10-09: anything shown in more than one place is one central component that every site uses.

Today posts, media and mentions each exist as a separate copy in Carrel and in each site admin. This design replaces those copies with three Capsomer components. Each one is driven by the site-api contract (DrDustinEdwards/site-api, v0.5.0) through an adapter that its host supplies, so the same component runs in Carrel, which reaches many sites, and in one site's own admin.

**Sources read**, all on their default branch on 2026-10-09:

| Repo | Commit |
|---|---|
| capsomer | `7612bd5` (0.5.0) |
| carrel | `2295d38` |
| dustinedwards-info | `d3aefbe` |
| site-api | `79f0a8f` (v0.5.0) |
| capsid | `e2762d8` |
| germomics | `93edd2d` |
| foxhound | `a746383` |

Also read: germomics PR #43 and Foxhound PR #26 (both open), and from Capsid the job text, capsid/conventions.md, capsomer/rulings.md, capsomer/patterns.md, capsid/research/design-experience-review.md, and job_1057e44ecffe.

**Not read:** Foxing. This session was refused access to that private repo, so Foxing PR #16 and Foxing's admin are unverified (section 8).

Line counts are from `wc -l`.

## 1. Inventory of every current copy

### 1.1 How each host reaches its data

| Host | Posts | Media | Mentions | Capsomer |
|---|---|---|---|---|
| Carrel | site-api client per project (`app/lib/sites.server.ts:106`). The list reads a D1 full-text index refreshed from the site (`app/lib/index.server.ts:103-230`) | site-api client | site-api client | pins `v0.4.0` |
| dustinedwards.info admin | D1 and GitHub directly (`~/db`, `lib/editor/github.server`); no admin screen calls site-api | D1 and R2 directly | D1 directly | pins commit `7612bd5` (0.5.0) |
| germomics admin | own D1 (`app/lib/admin.server.ts`) | no library: an upload route only | none | `v0.5.0`, AdminShell only |
| Foxhound admin | own D1 (`app/lib/blog/admin-queries.server.ts`) | none (cover images are pasted URLs) | none | none |
| Foxing admin | not read | not read | not read | not read |

Who serves the site-api contract:

- **dustinedwards.info** serves it at `/api/carrel/v1` (`app/routes/api.carrel.v1.$.ts`, `app/lib/carrel/site-adapter.server.ts`), with gaps:
  - Its media adapter implements list, get, upload and delete only (`media-adapter.server.ts:90-132`). It has none of the v0.4 writes (alt, tags, trash, restore, empty trash, bulk).
  - Its adapter has no `mentions` key, so every v0.5 mentions route answers 501.
  - So Carrel's mentions screen shows "not offered" for the one site it has connected, and Carrel's media screen can only upload and delete there.
- **germomics** (PR #43) and **Foxhound** (PR #26) add the contract in open PRs:
  - Both pin site-api **v0.2.0**.
  - germomics serves articles only, no episodes, and media over the `carrel/` prefix of `BLOG_IMAGES`.
  - Foxhound serves posts without schedule or delete; its media routes answer 501.
  - Foxhound #26 currently has a merge conflict (`mergeable_state: dirty`).
- **Carrel** registers one site today, `dustinedwards` (`app/lib/sites.server.ts:23-34`).

### 1.2 Posts list

| Copy | Files | What it does |
|---|---|---|
| Carrel | `app/routes/project.tsx` 343, `project.bulk.ts` 44, `lib/bulk.server.ts` 185 | **Filters:** GET form with search, status and kind. **Table** (`cap-table`): Title and path, Status, Updated. **Status cell:** Published, Scheduled with its date, Draft or "New draft", plus "N AI drafts waiting". **Limits:** no sort and no paging; capped at 500 rows. **Bulk** (Capsomer BulkBar): add tag, remove tag, duplicate, delete. Delete is Owner-only and offered only when the site offers `contentDelete`, behind a typed confirm. Carrel shows each item's outcome in its own Result panel. **No Undo anywhere.** Also "Refresh from the site" and "New post" |
| dustinedwards.info | `admin.posts._index.tsx` 397, `components/admin/posts-table.tsx` 218, `posts-filters.tsx` 90, `posts-toolbar.tsx` 37, `posts-confirm-dialogs.tsx` 59, `bulk-tag-controls.tsx` 30, `row-menu.tsx` 27, `overflow-menu.tsx` 24, `disclosure.tsx` 110 | **Filters:** status tabs with counts, search, tag select. **Columns:** title with Status and Featured pills, the path, and the published date with "in N days" for scheduled posts. **Row menu:** Edit, View on the site, Unpublish, Duplicate. **Bulk:** tag add and remove; delete behind a typed count. **Other:** scheduled-queue banner, Ask index maintenance. Works with no script. **No Undo** |
| germomics | `admin.posts._index.tsx` 169 | **Table:** title with an episode or article icon, status, date. **Filters:** client-side search, kind chips, status select, sort select (updated, published, title). **Per row:** Edit, View live, Duplicate. **None of:** bulk, delete or Undo |
| Foxhound | `routes/admin/blog/index.tsx` 128 | A "New post" form, then a table of title, status, tags and updated date. **No** filter, sort, row actions or bulk |

**Best per feature:**

- **Row actions:** dustinedwards.info. Its row menu holds the common single-post actions and works without script.
- **Status presentation:** dustinedwards.info, with "in N days" for scheduled posts.
- **Status filter:** dustinedwards.info's tabs with counts.
- **Search and kind filters:** Carrel's are the ones that work across sites.
- **Per-site gating:** Carrel. It reads the site's capabilities and the person's role before it offers an action.
- **Bulk outcomes:** Carrel, which shows one outcome per item. That is right for a remote site, where items can fail one by one.
- **Sort:** only germomics has a sort control. That makes it a need the contract lacks (section 2.6).
- **Tags column:** only Foxhound shows one; the contract has no post tags.

### 1.3 Media library

| Copy | Files | What it does |
|---|---|---|
| Carrel | `app/routes/media.tsx` 809, `media.bulk.ts` 50, `media.api.ts` 64, `lib/media.server.ts` 387, `components/media/library-insert.tsx` 185 | **Built from:** server forms on purpose (comment at `media.tsx:9-13`), with hand-written `cap-media-*` tiles. Capsomer's React media library is not used. **Browse:** search, a tag field, a Library and Trash switch, 48 per page with "Next page" only. **Detail** (`?id=`): facts, an alt form, a tags form, Used in. **Single-item actions:** trash and restore with no Undo; delete with a server-asked confirm. **Bulk:** tag, trash or restore, delete for good. **Gating:** every action is shown only when the site offers it. **Picker:** for the editor, its own image picker that asks for alt text |
| dustinedwards.info | `admin.media._index.tsx` 599, `admin.media.upload.ts` 55, and about 20 components in `components/admin/media-*`: grid 137, tile 248, inspector 186, inspector sections 282, palette 236, display bar 136, facets 99, picker 113, bulk bar 72, confirm dialogs 87, drawer 80, keyboard 79, drop anywhere 90, and more | The richest copy. **Lenses:** unattached, duplicates, no alt, over 1 MB, trash. **Browse:** tag chips; sort by added, name, size or usage; group by folder or month; list or grid; tile sizes. **Palette:** ⌘K. **Inspector:** alt suggestions, copy snippets, twins, usage and citations. **Lifecycle:** trash, restore, empty trash, delete with a typed confirm. **No Undo** |
| germomics | `admin.upload.ts` 47, `components/admin/UploadDropzone.tsx` 136, `ImageField.tsx` 103, `TipTapBody.tsx` | No library. Upload goes straight to R2. Alt text and caption are asked with `window.prompt`, and nothing lists or removes files |
| Foxhound | none | Cover images are pasted URLs |
| Capsomer | `components/media` (React 693 lines), `drop-zone`, `bulk-bar` | **Parts:** a grid with roving focus and an inspector that saves alt, caption and tags by itself. Extracted from dustinedwards.info. Not yet used by any app |

**Best per feature:**

- **Library experience:** dustinedwards.info by a distance, and Capsomer's `media` already holds its look and keyboard.
- **Running against a remote site:** Carrel. It has the capability gates, the "refused because used in" list on delete, the cursor paging, and server forms that work with no script.

### 1.4 Mentions

| Copy | Files | What it does |
|---|---|---|
| Carrel | `app/routes/mentions.tsx` 357, `mentions.api.ts` 36, `lib/mentions.server.ts` 227 | Owner only. **Filter:** one status select with counts. **Table:** From, What it says, Post, Status, Received. **Paging:** First page and Next page links. **Actions** are bulk only: approve and reject (no Undo), delete behind a typed confirm. **Retention:** a sweep panel behind a confirm |
| dustinedwards.info | `admin.mentions.tsx` 389, all inline | **Filters:** status tabs with counts and an unverified count. **Rows:** the author, the source as text and never a link, the post link, received and decided times. **Per row:** approve and reject; delete behind a typed confirm. **Retention:** a sweep. **Missing:** bulk, search and paging |
| Capsomer | `components/moderation-queue` (React 428 lines) | **Keyboard:** j and k to move, then a, s and d to decide at once with Undo; x selects for a bulk bar. Taken from dustinedwards.info's screen. Not yet used by any app. **Its states** (`waiting`, `approved`, `spam`, `bin`, `gone`) do not match the contract's `unverified`, `pending`, `approved`, `rejected`, `failed` |
| germomics, Foxhound | none | |

**Best per feature:**

- **The decision loop:** Capsomer's moderation queue. Keys plus Undo is the fastest way through a queue, and it is the pattern the review asks for.
- **Paging and counts:** Carrel's are the contract's.
- **Per-row actions and the "source is never a link" rule:** dustinedwards.info.

### 1.5 What every copy is missing

- No copy offers Undo on any posts, media or mentions action, although:
  - every reversible one is reversible through the contract (trash and restore, tag add and remove, approve and reject, unpublish and publish);
  - Capsomer's BulkBar and message region already carry Undo;
  - design-experience-review.md section 5 asks for it in each case.
- Carrel's Result panel is built three times (`project.tsx:169-200`, `media.tsx:348-382`, `mentions.tsx:165-190`).
- The content status to pill mapping is written inline six times in Carrel.

## 2. The design

### 2.1 Three layers

```
 Host app (Carrel, or one site's admin)
   route loader / action, sign-in and roles, which site, the key
        |                                   ^
        | ContentSource                     | view data + IntentResult
        v                                   |
 Server half: the "content kit"  (server only, *.server.ts)
   loadPosts / runPostsIntent, loadMedia / runMediaIntent,
   loadMentions / runMentionsIntent, summary()
        |
        | site-api client: HTTP with the key (Carrel)
        | or localClient(adapter): in process, no HTTP, no key (a site's own admin)
        v
 site-api contract v0.5 (v0.6 additions in 2.6)

 Browser: Capsomer components
   PostsList, MediaLibrary, MentionsList
   built from Table, BulkBar, DetailPanel, ConfirmDialog/ConfirmPage,
   Message (Undo), media, moderation-queue, drop-zone, chips, pagination
```

Each layer has one job:

- **The components** (Capsomer) render one page of one site from plain view data, and they send intents.
  - They never hold a key and never call a site.
  - They work with no script: plain forms post an `intent` and the ticked `ids`.
  - With script they add Undo, keyboard moves, the inspector's autosave and per-item outcomes.
- **The server half**, called the content kit here, does three things:
  - turns a site-api client into view data;
  - turns a posted intent into contract calls, each with `expectedVersion` and a fresh `changeId`;
  - returns an `IntentResult` that names the inverse intent when the action can be undone.

  It is the same code for every host, so it lives once (DECIDE 2).
- **The host** does three things:
  - signs the person in and decides what they may do;
  - picks the site;
  - supplies the `ContentSource`, and mounts the component in its own route.

**The key never reaches the browser.** site-api's bearer key is one shared secret per site (`site-api/src/server.ts:76-83`), so every write must run in the host's server action. The design makes that the only path.

### 2.2 The adapter each host supplies

The server half takes a `ContentSource`. This is the "adapter each host supplies" of the job:

```ts
// The content kit (server only). Names are proposals.
interface ContentSource {
  site: { id: string; name: string; origin: string };
  // A site-api client. Carrel: createSiteClient({ baseUrl, key }).
  // A site's own admin: localClient(siteAdapter), the same SiteAdapter it already
  // passes to createSiteApi, called in process, so no HTTP and no key.
  client: SiteClient;
  // What this person may do here. The kit refuses an intent the person may not run,
  // whatever the form says. Carrel maps its roles (app/lib/roles.ts:30-34); a site admin
  // signed in through Access gets everything.
  can: { edit: boolean; publish: boolean; deleteContent: boolean; deleteMedia: boolean; decideMentions: boolean };
  // Where a row's title links: Carrel's editor, or the site's own editor.
  editorHref(id: string): string;
  // Optional: a faster list than the site's own, such as Carrel's D1 search index.
  // Same shape as client.list; the kit falls back to the client when it is absent.
  postIndex?: { list(q: PostQuery): Promise<Page<ContentSummary>> };
  // Optional: record who did what (Carrel's authorship rows, its `changes` table).
  record?(change: { kind: string; ids: string[]; changeId: string }): Promise<void>;
  // Optional: per-site additions (2.5).
  extensions?: Extensions;
}
```

`localClient(adapter)` is a small new function beside `createSiteClient`. It answers the same methods by calling the `SiteAdapter` directly, and it parses each answer with the same zod schemas. Because of that, the site's own admin and Carrel run identical code, down to the version checks.

The view data the components take is plain JSON:

```ts
interface PostsData {
  site: { name: string };
  query: { q?: string; status?: ContentStatus; kind?: string; tag?: string; sort?: string; cursor?: string };
  rows: PostRow[];
  page: { nextCursor: string | null; prevCursor?: string | null; total?: number };
  counts?: Partial<Record<ContentStatus | "all", number>>;
  kinds: string[];
  offers: { delete: boolean; schedule: boolean; tags: boolean; duplicate: boolean };
  can: ContentSource["can"];
  // Per-site additions, already rendered to data (2.5).
  extra?: { columns?: ExtraColumn[]; notes?: Record<string, RowNote[]>; toolbar?: ExtraAction[] };
}

interface PostRow {
  id: string; title: string; kind: string;
  status: "draft" | "scheduled" | "published";
  path: string | null; href: string; liveHref: string | null;
  publishAt: string | null; publishedAt: string | null; updatedAt: string | null;
  version?: string;             // present from site-api v0.6 (2.6); the kit reads it otherwise
  tags?: string[];
  notes?: RowNote[];            // "2 AI drafts waiting", "New draft", "Held by a flag": host-supplied
}

interface IntentResult {
  ok: boolean;
  message: string;                       // one sentence for the message region
  outcomes?: { id: string; ok: boolean; message?: string; usedBy?: MediaUse[] }[];
  undo?: { intent: string; fields: Record<string, string | string[]> };  // the inverse, versions included
  conflict?: { id: string; currentVersion: string | null };
}
```

`MediaData` and `MentionsData` follow the same shape:

- `MediaData` rows are Capsomer's existing `MediaRecord` (`components/media/media.ts:31`), filled from the contract's `MediaItem` and `usedBy`.
- `MentionsData` rows are a `Mention` (`components/moderation-queue/moderation-queue.ts:28`) whose states are the contract's own (2.4.3).

### 2.3 What the host passes to a component

Every component takes the same props:

| Prop | What it is |
|---|---|
| `data` | The loader's view data |
| `action` | The address the forms post to, usually the route itself |
| `Form` (optional) | The host router's form component. React Router's `<Form>` keeps navigation in the app. Without it, a plain `<form>` is rendered |
| `submit` (optional) | `(form: FormData) => Promise<IntentResult>`, the script path. React Router hosts pass a `useFetcher` wrapper. With it, the component shows outcomes and Undo in place; without it, the page reloads with the result |
| `result` (optional) | The last `IntentResult` from the action, for the no-script path |
| `labels` (optional) | Words a host needs to change, such as "post" or "article", and the site name |

**Nothing else.** Specifically:

- No host CSS.
- No `style` props (Capsomer's `style-src 'self'` rule).
- No render props that fork the markup.

Per-site additions arrive as data (2.5), so every host renders the same HTML contract.

### 2.4 The three components

All three follow capsomer/patterns.md and DEFAULTS.md:

- a filter bar with visible labels and its state in the address;
- a count, then one table or grid;
- 50 per page, then "Show more";
- an empty state that names its kind;
- a detail opened from the row in Capsomer's `detail-panel`, driven by the address;
- reversible actions run at once with a message offering Undo, which stays until dismissed (`z` is Undo);
- one-way actions preview, then perform, in `confirm-dialog`, or in `confirm-page` with no script.

Every action is offered only when two things hold: `data.offers` says the site supports it, and `data.can` says this person may run it. A withheld action shows its reason in words, as Carrel does today (`project.tsx:338`).

#### 2.4.1 PostsList (`components/posts-list`, React `PostsList`)

- **Filter bar:**
  - Status tabs with counts: All, Drafts, Scheduled, Published (dustinedwards.info's `posts-filters.tsx`).
  - Search.
  - A kind select, shown only with more than one kind (Carrel).
  - A tag select, shown when rows carry tags.
  - A sort select: updated, published, title. It is sent to the site from v0.6 and sorts the page in the kit before then.
- **Table** (Capsomer `table`):
  - A checkbox, for editors only.
  - Title: the one link, stretched over the row. Under it, the path and the row's notes ("2 AI drafts waiting", "New draft").
  - Status: Status and word, with "in N days" for scheduled posts.
  - Updated.
  - Any extra columns the host adds.
- **Row menu** (Capsomer `FormMenu`, so it works with no script):
  - Edit.
  - View on the site (published posts only).
  - Unpublish (published or scheduled posts).
  - Duplicate.
  - Delete: Owner only, offered only with `contentDelete`, last after a separator.
- **Bulk bar** (Capsomer `BulkBar`, form mode): add tag and remove tag (when the site offers tags), duplicate, unpublish, delete.
  - Outcomes show per item in the bar's result list. This is new in BulkBar and replaces Carrel's three Result panels (section 4, C1).
- **Undo:**
  - **Unpublish:** Undo republishes with the version the unpublish returned. A first publication is never an Undo target: a post that was never published cannot be unpublished, so republishing is always a republication.
  - **Tag add and remove:** Undo removes or adds the tag on the items that changed, and only those. The kit records which items already had it.
  - **Duplicate:** Undo deletes the copy, but only where the site offers `contentDelete` and the copy is still at the version the duplicate made. Otherwise there is no Undo, and the message says how to remove the copy.
- **Confirm:** delete previews every post it will remove and asks for the typed count. This is dustinedwards.info's rule (`admin.posts._index.tsx:186-196`), and BulkBar already supports it.
- **Not in the list:** the editor, the new-post form and history stay where they are (section 3). "New post" is a toolbar link to `editorHref` with a new id.

#### 2.4.2 MediaLibrary (`components/media-library`, React `MediaLibrary`)

This is a composition of Capsomer's existing `media` grid and inspector, `drop-zone`, `chips`, `bulk-bar`, `detail-panel` and `pagination`, wired to the contract.

- **Browse:**
  - Search.
  - A tag chip row (with `mediaTags`).
  - Library and Trash tabs (with `mediaTrash`).
  - Lenses: none in the contract yet; per-site through extensions until v0.6 (2.6).
  - List or grid, kept in the address.
- **Upload:** `drop-zone`, checked against `capabilities.mediaUpload` (`maxBytes`, `types`) before any byte is sent, as Carrel does (`media.server.ts:133-167`).
  - Alt text is asked in the upload form.
  - Capsomer's `suggestedAlt` is offered and never applied.
- **Inspector:** a detail panel from `?inspect=`.
  - Facts.
  - An alt form (with `mediaAlt`).
  - A tags form (with `mediaTags`).
  - Used in, from `usedBy`.
  - Copy snippets.
  - Trash or Restore.
  - Delete.

  It has two modes, set by the host:
  - **Autosave,** the existing `MediaInspector`: saves by itself with the script path.
  - **Form:** one form per field with a Save button. This is new, and needed for Carrel's no-script rule (`media.tsx:9-13`).
- **Bulk:** add and remove tags, trash or restore, delete for good, all through `client.media.bulk` in one request of up to 100. Outcomes show per item, with each refusal's `usedBy`.
- **Undo:**
  - Trash: Undo restores.
  - Restore: Undo trashes.
  - Tag changes: Undo applies the inverse to the items that changed.
- **Confirm:**
  - **Delete:** typed, and only from the trash where the site has one. A refused delete lists where the file is used.
  - **Empty trash:** typed count, and it repeats while `more` is true.
- **Picker mode** (`mode="picker"`): the same grid, images only, with a required alt step. It returns `{ id, url, alt }` to the host. It replaces Carrel's `library-insert.tsx` (185) and dustinedwards.info's `media-picker.tsx` (113), and gives germomics a picker in place of `window.prompt`.

#### 2.4.3 MentionsList (`components/mentions-list`, React `MentionsList`)

This is Capsomer's `moderation-queue`, moved onto the contract's states and given form mode, paging and the retention panel.

- **States:** the contract's own, with these labels:

  | Contract state | Label |
  |---|---|
  | `pending` | Waiting |
  | `approved` | Approved |
  | `rejected` | Rejected |
  | `unverified` | Not yet checked |
  | `failed` | Source not found |

  The queue's `spam`, `bin` and `gone` go (DECIDE 6):
  - The contract has no bin; a delete is final.
  - `gone` is the contract's `failed`, with `failureReason`.
- **Tabs:** Waiting, Failed, Approved, Rejected, All, each with its count from `MentionCounts`, which covers the whole queue and not just the page. "N not yet checked" shows as a pill.
  - With no filter it opens on Waiting, or on All when nothing waits. Carrel and dustinedwards.info already agree on this.
- **Rows:**
  - The author.
  - The source host and address as text, never a link (contract `MentionItem.sourceUrl`).
  - The excerpt or the failure reason.
  - The post, linked to its editor.
  - Received and decided times (Capsomer `time`).
- **Keyboard** (from the queue, single keys can be turned off):
  - j and k move between rows.
  - a approves, r rejects (was s), d deletes.
  - x selects.
- **Per-row actions** work with no script: approve and reject, offered only on `pending`, `approved` and `rejected` (the contract refuses the others with 422). **Bulk:** approve, reject, delete. The kit sends them one decide per mention, in order, as Carrel does (`mentions.server.ts:166-204`).
- **Undo:**
  - **Between approved and rejected:** Undo is the opposite decision, which works now.
  - **From waiting:** Undo needs the v0.6 `reset` decision (2.6). Until a site offers it, a decision on a waiting mention has no Undo, and the message says so.
- **Confirm:** delete (typed) and the retention sweep, which shows the counts in `expiring` before it runs.

### 2.5 What stays per site

| Stays with the host | Why |
|---|---|
| Sign-in, roles, the key, which site | Security and identity are the host's (conventions 7.8, 9.1) |
| The post editor, new post, history and preview pages | Each is site-shaped today (germomics episodes, dustinedwards.info's git conflicts and preview links, Carrel's AI drafts and Docs). It is the next central component (section 5, row 5), but not this job |
| Row notes such as "AI drafts waiting", "New draft" or "Held by a flag" | Carrel-only facts. Passed as `notes` |
| Site-only tools: dustinedwards.info's Ask index maintenance, media rebuild, lenses (duplicates, twins, citations), ⌘K palette | Passed through `extensions`: extra toolbar actions, extra lenses and extra inspector sections, each rendered by the kit to data and run by the host's own intent handler. A lens moves into the component when the contract gains it |
| Retention windows, purge behaviour, the reference check before a delete | The site's own rules, enforced behind the contract |
| Episodes (germomics) | Not in the contract (PR #43 hides them). DECIDE 7 |

An `Extensions` object is a list of named additions:

```ts
interface Extensions {
  toolbar?: { intent: string; label: string; confirm?: ConfirmSpec }[];
  lenses?: { id: string; label: string; hint?: string; count?: number }[];
  columns?: { id: string; label: string; cell(row: PostRow): string }[];
  inspector?: { id: string; title: string; load(id: string): Promise<KeyValue[]> }[];
  run(intent: string, form: FormData): Promise<IntentResult> | undefined;
}
```

The component renders them in fixed places with fixed markup. A site therefore adds data and actions, and never a look.

### 2.6 Gaps in site-api v0.5.0, and the additive v0.6 they need

Everything below is additive. A v0.5 site keeps working, and the component falls back as described.

| Gap (v0.5.0) | Effect on the components | v0.6 addition | Until then |
|---|---|---|---|
| `ContentSummary` has no `version` or `tags` (`contract.ts:74-84`) | A row action needs a `GET /content/:id` first; no tag column or filter | `version` and optional `tags` on each summary | The kit reads each post before writing (Carrel does this now) |
| No `sort` on any list; no total | No sort control; "Showing N of M" is impossible | `sort`, `dir` and an optional `total` | Sort the page in the kit and say so ("sorted on this page") |
| No post tags in the contract | Carrel bulk-tags by rewriting front matter and refuses a post without it (`bulk.server.ts:100-124`) | Optional `contentTags` with `PUT /content/:id/tags` | Keep Carrel's front matter path in the kit |
| A mention decision cannot go back to pending | No Undo for a decision on a waiting mention | `decision: "reset"` (back to pending) under `capabilities.mentions` | No Undo on that one case |
| Mentions have no `q` or `targetId` filter | No search, and no "mentions of this post" | Both filters | Filter the page in the kit |
| Media has no lens or sort queries | dustinedwards.info's lenses stay per-site | Optional `lens` (unattached, no-alt, large) and `sort` under `mediaLenses` | Extensions |
| `media.delete` and `mentions.sweep` take positional arguments | Inconsistent client | Object arguments (keep the old ones working) | None needed |
| README install example shows `#v0.2.0` | Stale doc | Fix | |

No ETag is needed. Versions already travel in the body, and every write already returns the new version, which is what Undo uses.

### 2.7 Many sites at once (Carrel)

- Each component shows one site. Carrel mounts it per project, as it does today.
- A list merged across sites is not proposed. Each site has its own cursor and its own version space, so a merged page cannot be paged honestly.
- Instead, the kit's `summary(source)` returns a small count for one site:
  - mentions waiting;
  - posts with AI drafts waiting (from Carrel's notes);
  - media without alt text where the site can say.

  Carrel Home's "Needs you" inbox shows one line per site from those counts, linking to the list (design-experience-review.md DECIDE 1). If Dustin wants it, the Portal's strip badge can read the same numbers (section 4.4).

## 3. The split, in one table

| | In the component (Capsomer) | In the content kit (server half) | The host passes in | Stays per site |
|---|---|---|---|---|
| Posts | Filter bar, table, row menu, bulk bar with outcomes, Undo, confirm, empty and paging | List, read before write, every intent, Undo inverse, front matter tags until v0.6 | `ContentSource`, `editorHref`, notes, `Form` and `submit` | Editor, history, preview, new post, Ask tools |
| Media | Grid or list, inspector (autosave or form), drop zone, tags, trash, bulk, picker mode, Undo, confirm | List, detail with `usedBy`, upload checks, bulk, empty trash loop | Same, plus upload limits from `meta` | Lenses, twins, citations, rebuild, palette |
| Mentions | Queue with keys, tabs with counts, rows, bulk, Undo, sweep confirm | List with counts, decide and delete in order, sweep, purge-failure messages | Same | Retention windows, receiver, purge |

## 4. Adoption order

Every Capsomer PR follows the same rules:

- It ships with side-by-side screenshots in both themes and waits for Dustin's sign-off (capsid/decisions.md, 2026-10-02).
- It names in CHANGELOG every changed HTML contract.

Every app PR follows two rules:

- It deletes the copy it replaces, in the same PR (rulings.md rule 17).
- It is one repo, one PR, one screen, so each can be reviewed alone.

### 4.1 site-api (first, small)

1. **S1: `localClient(adapter)` and the content kit.**
   - Adds `localClient(adapter)`, plus `./admin` with `loadPosts`, `runPostsIntent` and the media and mentions equivalents, and `summary`.
   - The kit is lifted from Carrel's `bulk.server.ts`, `media.server.ts` and `mentions.server.ts`.
   - Tested once, where it lives, against `memoryAdapter`.
   - Where the kit lives is DECIDE 2.
2. **S2: v0.6.0, the additive contract of 2.6.** It also adds a v0.5.0 contract test, as v0.5 did for v0.4. It can follow S1 and does not block the components.

### 4.2 Capsomer (needs S1's types only)

1. **C1: PostsList, and a result list in BulkBar.** Also new: `capsomer/content` types (no runtime) and the per-item outcome list in BulkBar, which replaces Carrel's three Result panels. Sources: dustinedwards.info's `posts-table.tsx` and `posts-filters.tsx`, and Carrel's `project.tsx`.
2. **C2: MediaLibrary.** It composes `media`, `drop-zone`, `chips`, `bulk-bar` and `pagination`. It adds the inspector's form mode and picker mode.
3. **C3: MentionsList.** `moderation-queue` takes the contract's states. This is a changed HTML contract: `data-view` values change, so it needs a CHANGELOG entry. It also gains form mode, paging and the sweep.
4. **Release 0.6.0.**

### 4.3 Apps, in order

| Step | Repo | What changes | Deletes | Depends on |
|---|---|---|---|---|
| K0 | Carrel | Bump `capsomer` v0.4.0 to v0.6.0 (it skips 0.5.0; its `page-head.tsx` 28 and the checkbox workaround in `app.css:625-631` go too) | `components/page-head.tsx`, the CSS workaround | 0.6.0 |
| K1 | Carrel | Posts list on `PostsList` | `project.tsx`'s filters, table and Result panel; `project.bulk.ts`; most of `lib/bulk.server.ts` | C1, S1 |
| K2 | Carrel | Media on `MediaLibrary`; editor insert on picker mode | most of `media.tsx` (809), `media.bulk.ts`, most of `lib/media.server.ts`, `components/media/library-insert.tsx` | C2, S1 |
| K3 | Carrel | Mentions on `MentionsList` | most of `mentions.tsx` (357), `mentions.api.ts`, most of `lib/mentions.server.ts` | C3, S1 |
| D0 | dustinedwards-info | Complete its site adapter: the v0.4 media writes (alt, tags, trash, restore, empty trash, bulk) over the D1 and R2 it already has, and the v0.5 mentions group over `decideMention` (`lib/webmention/decide.server`). Bump the `capsomer` pin to the 0.6.0 tag | nothing yet | none; can start now, in parallel with C1 to C3. Until D0, Carrel cannot manage this site's mentions or media metadata |
| D1 | dustinedwards-info | Admin posts list on `PostsList` through `localClient`; Ask maintenance as an extension | `posts-table.tsx`, `posts-filters.tsx`, `posts-toolbar.tsx`, the bulk part of `posts-confirm-dialogs.tsx`, `row-menu.tsx`, `overflow-menu.tsx`, `disclosure.tsx` once no other caller is left | C1, S1, D0 |
| D2 | dustinedwards-info | Admin media on `MediaLibrary`; lenses, twins and rebuild as extensions | the `media-*` components the library replaces (about 20 files), `media-bulk-bar.tsx`, `bulk-tag-controls.tsx`, `media-picker.tsx` | C2, D0 |
| D3 | dustinedwards-info | Admin mentions on `MentionsList` | the inline queue in `admin.mentions.tsx` | C3, D0 |
| G0 | germomics | PR #43, with site-api moved from v0.2.0 to v0.5.0 before merge (DECIDE 9). It is additive, so the content adapter is unchanged; media writes can follow | | Dustin's steps in #43 (key, `namespace_id` 7301) |
| G1 | germomics | Admin posts list on `PostsList` through `localClient` | `admin.posts._index.tsx`'s table, filters and sort | C1, G0, DECIDE 7 |
| G2 | germomics | A media list over `BLOG_IMAGES` in its adapter, then `MediaLibrary` and its picker in place of `ImageField` and the `window.prompt` calls | `UploadDropzone.tsx`, `ImageField.tsx`, the prompts in `TipTapBody.tsx` | C2, G0, DECIDE 8 |
| H0 | Foxhound | PR #26: resolve its merge conflict and move to site-api v0.5.0. Carrel becomes Foxhound's posts home | | Dustin's steps in #26 |
| H1 | Foxhound | Its own admin blog list moves to `PostsList` only inside Foxhound's Capsomer adoption (conventions 7.5: apps built before Capsomer keep their stack until then) | `routes/admin/blog/index.tsx`'s table | H0, Foxhound adoption |
| F0 | Foxing | PR #16 and Foxing's admin: not read from this session | | access, section 8 |

### 4.4 The Carrel site keys and the Portal inbox

- **Site keys.** Each new site appears in Carrel only after four things:
  - its PR merges;
  - Dustin sets `CARREL_SITE_KEY` on the site;
  - he sets `SITE_<NAME>_KEY` in Carrel;
  - Carrel's site list (`app/lib/sites.server.ts:23`) gains its entry.

  These are germomics #43, Foxing #16 and Foxhound #26. Both PRs read here list these as Dustin's steps. Nothing in C1 to C3 or K1 to K3 waits on them: the components run against dustinedwards.info alone first.
- **Portal evaluation, job_1057e44ecffe (the inbox).** That job designs the Portal's Inbox for Capsid exceptions, and it is still queued.
  - Content work is not a Capsid exception, so posts, media and mentions do not move into the Portal.
  - The link between the two is the kit's `summary()` (2.7). It gives Carrel Home its "Needs you" lines and gives the Portal's strip a badge for Carrel, if that evaluation wants one.
  - So the evaluation should read this section, but neither job blocks the other.

## 5. Other duplicated screens and widgets, ranked by copies

"Copies" counts own-built implementations outside Capsomer, from the reads above, across the Portal (capsid `dashboard/`), the Capsid Worker's public page, Carrel, the dustinedwards.info admin, germomics and Foxhound. Foxing is not counted.

| # | Screen or widget | Copies | Where | Central component |
|---|---|---|---|---|
| 1 | Result and status messages | about 21 | **Portal:** own message region (`App.tsx:144-156`, 631-646; `lib/messages.ts`). **Carrel:** Result panel ×3. **germomics:** inline `role=status` ×5. **Foxhound:** inline alert and status banners ×12 | `message`, plus C1's per-item outcome list |
| 2 | Data tables | about 31 | **Portal:** about 20 tables on its own `table.list` and `table.fleet`. **Foxhound:** 8. **germomics:** 2. **dustinedwards.info:** `posts-table.tsx` | `table` |
| 3 | Confirmation | 5 apps, about 20 sites | **Portal:** `ConfirmDialog.tsx` (260). **dustinedwards.info:** `confirm-dialog.tsx` (158). **germomics:** 13 native `confirm`, `alert` or `prompt` calls. **Foxhound:** 3 own patterns (brake `ConfirmForm`, crons type-to-confirm, merchant cancel). **Capsid Worker:** the OAuth approval page (`src/routes.ts:100-150`), with hard-coded colours | `confirm-dialog`, `confirm-page` |
| 4 | Empty states | about 15 | **Foxhound:** 5 dashed and about 7 plain lines. **germomics:** an `EmptyState`. **Portal:** `FilterEmpty` and `NoSnapshot` | `empty` |
| 5 | Post editor | 4 | **Carrel:** `editor.tsx` (680). **dustinedwards.info:** `admin.posts.$slug.edit.tsx` (338) with `post-editor.tsx` (611) and `settings-drawer.tsx` (498). **germomics:** `admin.posts.$id.tsx` (178) with `PostEditor.tsx` (493). **Foxhound:** `blog/detail.tsx` (377) | **A new `post-editor`** on the same kit: `markdown-editor`, `publish-gate`, `history-list`, `share-preview` and `detail-panel` already exist. The largest remaining duplicate; its own design job (DECIDE 10) |
| 6 | Revision history | 4 | **Carrel:** `revision-picker.tsx` (67) and `history.tsx` (248). **dustinedwards.info:** `revision-list.tsx` (192) and the history page (128). **germomics:** `VersionHistory.tsx` (120). **Foxhound:** a read-only list | `history-list` with `draft-compare`, fed by contract revisions; part of row 5 |
| 7 | Status badges and status mapping | 4 apps | **Portal:** `St`, `Pill` (`ui/icons.tsx`). **germomics:** `Badge`. **Foxhound:** `badge.tsx`. **Carrel:** content status mapped inline 6 times | `status`, plus a `contentStatus()` helper shipped with C1 |
| 8 | Filter and search bars | 4 apps, about 9 sites | **Portal:** chips and search. **Carrel:** `.app-filters` ×4. **dustinedwards.info:** `posts-filters.tsx`, `media-search.tsx`. **germomics:** inline | `catalog` and `chips`; C1 to C3 use them |
| 9 | Media picker and upload field | 3 | **Carrel:** `library-insert.tsx`. **dustinedwards.info:** `media-picker.tsx` and `media-drop-anywhere.tsx`. **germomics:** `ImageField.tsx`, `UploadDropzone.tsx`, and prompts | `MediaLibrary` picker mode (C2) |
| 10 | Stat tiles | 3 | **Portal:** Overview tiles. **Foxhound:** `stat-card.tsx`. **germomics:** inline tiles | `stat-tile` |
| 11 | Page head | 3 | **Portal:** `PageHead` (`views/shared.tsx:13`). **Carrel:** `page-head.tsx`. **dustinedwards.info:** `page-head.tsx` | `page-head` (0.5.0) |
| 12 | Site health and sync status | 3, and 1 missing | **Portal:** Sites and the Overview cells. **dustinedwards.info:** `admin._index.tsx` (180). **Foxhound:** `operations.tsx` (148). **Carrel:** none (email only) | A new `site-health` panel built on `row-list`, `status` and `stat-tile`. Belongs with job_1057e44ecffe's Health page |
| 13 | Time and size formatting | 3 apps | **Portal:** `lib/format.ts`, `When.tsx`. **Carrel:** `utc()` ×3, `when()`, `size()`, `megabytes()`. **dustinedwards.info:** inline dates | `time`, and `byteSize` from `media` |
| 14 | Detail drawers | 2 apps, 3 files | **Portal:** `Drawer.tsx` (613). **dustinedwards.info:** `settings-drawer.tsx` (498), `media-drawer.tsx` (80) | `detail-panel` |
| 15 | Paging links | 2 apps, 3 sites | **Carrel:** media and mentions. **dustinedwards.info:** media | `pagination` |
| 16 | Social post queue | 2 | **Carrel:** Social. **Foxhound:** `admin/social.tsx`, a read-only snapshot of empty tables | Carrel's screen. Foxhound's can go once Carrel serves Foxhound |
| 17 | Audit and activity list | 2 | **Portal:** `Activity.tsx` (170). **Foxhound:** `audit-log.tsx` (60) | `table` with `detail-panel`; not shared data, so no central screen |
| 18 | People and users lists | 3, different data | **Carrel:** `people.tsx`. **Foxhound:** users and merchants. **germomics:** subscribers and people | Shared parts only (`table`, `bulk-bar`); different data, so no central screen |
| 19 | Admin navigation | 2 | **Foxhound:** `admin-nav.tsx`, no shell. **germomics:** theme glue around AdminShell (`admin.tsx:44-63`) | `admin-shell`, `theme-switch` |
| 20 | The Portal's own copies of components extracted from it | about 25, one app | Command menu, shortcuts sheet, anchors, switches with reasons, uptime ticks, meters, theme toggle, buttons, chips, row lists, attention list. The Portal pins 0.5.0 but imports only Panel, Empty, Spinner and AdminShell | Swap the Portal over to them, one PR per component, in the order job_1057e44ecffe settles its pages |

Rows 1 to 4, 7, 10, 11, 13, 14 and 19 need no new component, only adoption. Rows 5 and 12 are the two new central components worth designing next.

## 6. Risks

- **The kit becomes a second contract.** It must stay a thin translation of site-api: no business rule of its own beyond "who may" and "what the inverse is". A rule a site needs belongs behind the contract.
- **Undo across a network.** An Undo is a new write with its own `changeId` and `expectedVersion`. If someone else changed the item since, the Undo fails with a conflict, and the message says so and links to the item. It never retries blindly.
- **No-script parity.** Every action must work as a plain form post (conventions 7.4). The script path adds only Undo in place, keys and autosave. The specs test both.
- **dustinedwards.info loses richness during D1 and D2.** The extensions must carry the lenses and the Ask tools from day one, or the swap removes features (conventions 1.4). Each of those PRs lists what moved where.

## 7. Verified and not verified

**Verified in code** (paths and lines above):

- Every listed file and line count.
- The three hosts' data paths.
- The site-api v0.5.0 routes, schemas, error codes, client methods and gaps.
- dustinedwards.info's adapter: no mentions key, and media list, get, upload and delete only.
- Carrel's single registered site and its role map.
- Neither Carrel nor dustinedwards.info uses Capsomer's `media` React library or `moderation-queue`.
- No Undo on any posts, media or mentions action.
- The pins: Carrel `capsomer` v0.4.0, Portal v0.5.0, dustinedwards.info commit `7612bd5`, germomics v0.5.0, Foxhound none.
- germomics #43 and Foxhound #26: their text, their site-api v0.2.0 pins, and #26's merge conflict.

**Not verified:**

- Foxing, the repo and PR #16, which this session was refused.
- Any rendered page, phone layout or contrast; nothing was run.
- Whether `localClient` meets dustinedwards.info's head-sha conflict check one for one. Its adapter uses the git blob sha as the version, which should, but it was not traced.
- The Portal's table count (about 20) is a grep count of use sites, not a page-by-page read.

## DECIDE

In the order to answer them:

1. **One component, two homes.** Carrel and each site admin mount the same three components, rather than the site admin linking to Carrel (design-experience-review.md DECIDE 5).
   - **Recommend:** both mount them. With one component there is no copy to drift, and a site's admin still works when Carrel or its key is down.
2. **Where the server half lives.**
   - **Recommend:** site-api, as a `./admin` export with `localClient`. It changes in step with the contract.
   - Capsomer stays a design system with no contract dependency.
   - site-runtime is the other candidate.
3. **A site's own admin goes through the contract.** Every write takes the same path, versions and tests, whichever host made it.
   - **Recommend:** use the contract, in process through `localClient`, with site-only features as extensions.
4. **site-api v0.6, the additions of 2.6:**
   - `version` and `tags` on rows;
   - `sort`, `dir` and `total`;
   - `contentTags`;
   - mention `reset`, `q` and `targetId`;
   - `mediaLenses`.

   **Recommend:** yes, all additive. Mention `reset` first, since it is what makes Undo complete.
5. **Undo for unpublish and duplicate.**
   - **Recommend:** unpublish gets Undo (it republishes; never a first publication).
   - Duplicate gets Undo only where the site offers delete.
6. **Mentions vocabulary.** The moderation queue takes the contract's states: Waiting, Approved, Rejected, Not yet checked, Source not found. This drops Spam and Bin and changes `data-view`, so it is a CHANGELOG-listed contract change.
   - **Recommend:** yes.
7. **germomics episodes in the posts list.**
   - **Recommend:** in germomics' own admin, episodes appear as rows of kind "episode" linking to its own editor.
   - In Carrel they stay hidden, as PR #43 does.
8. **A media library for sites that have none.**
   - **Recommend:** germomics yes. It already stores images in R2, and the picker replaces its `window.prompt` calls.
   - Foxhound no, until it needs uploads.
9. **Move germomics #43 and Foxhound #26 to site-api v0.5.0 before they merge.**
   - **Recommend:** yes. The contract is additive and both pin v0.2.0 today.
10. **Next central components.**
    - **Recommend:** a design job for the shared post editor (section 5 row 5, four copies) after K1 to K3 ship.
    - Then `site-health` (row 12), with job_1057e44ecffe.
11. **Foxhound's own blog admin.**
    - **Recommend:** it stays as is until Foxhound's Capsomer adoption (conventions 7.5).
    - Carrel is its editing home from #26 on.
12. **Foxing.**
    - **Recommend:** let a seat-side driver with Foxing access read PR #16 and its admin and add Foxing's rows to section 1, before any Foxing step is planned.
