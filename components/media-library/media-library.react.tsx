import { CommandMenu } from "../command-menu/command-menu.react.tsx";
import {
  nounsOf,
  type IntentResult,
  type MediaData,
  type PickedMedia,
  type SubmitIntent,
} from "../content/content.ts";
import { ContentBulkBar } from "../content/content.react.tsx";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { MediaGrid, MediaInspector } from "../media/media.react.tsx";
import { MediaMore } from "./media-library-more.react.tsx";
import { mediaHref, withMedia, type KitMediaChanges } from "./media-library.ts";
import { useMediaLibrary, type MediaLibraryProps } from "./media-library-model.react.tsx";
import { LibraryFooter, LibraryNotes, LibraryToolbar } from "./media-library-chrome.react.tsx";
import { PickForm } from "./media-library-pick.react.tsx";
import { ImportForm, KeepSize, UploadDialog, UploadForm } from "./media-library-upload.react.tsx";

export type { MediaLibraryProps };
export type { FormComponent, IntentResult, KitMediaChanges, MediaData, PickedMedia, SubmitIntent };

// One page of one site's files, the same component in Carrel and in every site admin: search, tag
// chips, the library and Trash, the grid or list of tiles, upload checked against the site's limits,
// the bulk bar with each file's outcome, the inspector (from ?inspect=) in form or autosave mode,
// Undo, and the confirmation for what cannot be undone. In picker mode, the same grid offers images
// and asks for the alt text this use needs. Every action is a form post, so it works with no
// script; `submit` adds the in-place path.
export function MediaLibrary(props: MediaLibraryProps) {
  const m = useMediaLibrary(props);
  const {
    Form,
    action,
    active,
    bulk,
    canImport,
    canUpload,
    data,
    find,
    finding,
    formId,
    go,
    goRef,
    goTo,
    groups,
    href,
    iOffers,
    insRef,
    inspected,
    inspector,
    inspectorMode,
    intents,
    labels,
    layout,
    layoutRef,
    mounted,
    nameOf,
    offers,
    onGridKey,
    onSubmit,
    openFile,
    path,
    picker,
    plural,
    query,
    rows,
    rules,
    save,
    search,
    selectable,
    selected,
    setActive,
    setFinding,
    setLast,
    setSelected,
    setUploadOpen,
    shown,
    submit,
    tileSize,
    title,
    toOpen,
    tools,
    trash,
    uid,
    uploadOpen,
    words,
  } = m;
  if (intents.confirmPage) {
    return (
      <section className="cap-media-lib" data-cap="media-library" aria-label={title}>
        {intents.confirmPage}
      </section>
    );
  }
  const uploadForm = canUpload && rules ? <UploadForm m={m} /> : null;
  const importForm = canImport ? <ImportForm m={m} /> : null;

  return (
    <section
      className="cap-media-lib"
      data-cap="media-library"
      data-mode={picker ? "picker" : undefined}
      aria-label={title}
      ref={intents.setRoot}
      onSubmit={onSubmit}
    >
      <div ref={goRef} hidden>
        <Form method="get" action={path}>
          {[...new URLSearchParams(mediaHref("", goTo ?? {}).split("?")[1] ?? "")].map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </Form>
      </div>

      <LibraryToolbar m={m} />
      <LibraryNotes m={m} />

      {picker ? uploadForm : null}
      {!picker && (uploadForm || importForm) ? (
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          scripted={mounted && !!submit}
          inPage={!!query.upload}
          closeHref={href(withMedia(query, { upload: undefined }))}
          rules={canUpload && rules ? { ...rules, maxBytes: offers.upload?.maxBytes } : null}
          resize={<KeepSize uid={uid} id="dlg" resize={offers.resize} />}
          noScript={uploadForm}
          importForm={importForm}
          submit={submit}
          onDone={(r) => {
            setLast(r);
            intents.show(r);
          }}
          labels={labels}
        />
      ) : null}

      {/* oxlint-disable-next-line react/refs -- intents holds the root ref for its handlers; rendering reads none of it */}
      {intents.resultBox}
      {toOpen.length > 0 ? (
        <ul className="cap-media-lib-opened" aria-label="Files to open">
          {toOpen.map((f) => (
            <li key={`${f.why}:${f.id}`}>
              <a href={href(withMedia(query, { inspect: f.id }))}>
                {f.why === "duplicate"
                  ? `Open ${nameOf(f.id)}, the file already stored`
                  : f.why === "copy"
                    ? `Open the new file, ${nameOf(f.id)}`
                    : `Open ${nameOf(f.id)}`}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {selectable ? (
        <ContentBulkBar
          formId={formId}
          action={action}
          Form={Form}
          formClass="cap-media-lib-bulk-form"
          items={rows
            .filter((r) => selected.includes(r.key))
            .map((r) => ({ id: r.key, label: r.name }))}
          total={shown.length}
          onSelectAll={
            mounted
              ? () =>
                  setSelected(
                    shown
                      .filter((r) => r.state === "ready" || r.state === "binned")
                      .map((r) => r.key),
                  )
              : undefined
          }
          onClear={() => setSelected([])}
          plural={plural}
          actions={bulk}
          tag={bulk.some((a) => a.intent === "tag-add")}
          tagName="tags"
          intents={intents}
        />
      ) : null}

      <div
        className="cap-media"
        data-size={tileSize}
        data-view={layout === "list" ? "list" : undefined}
      >
        <div className="cap-media-layout" ref={layoutRef}>
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- delegates the events of the controls inside it */}
          <div className="cap-media-main" onKeyDown={onGridKey}>
            {shown.length === 0 ? (
              <Empty
                kind={words.kind}
                title={words.title}
                action={
                  words.kind === "no-match" ? (
                    <a
                      className="cap-btn"
                      href={href(
                        withMedia(query, { q: undefined, tag: undefined, lens: undefined }),
                      )}
                    >
                      Clear filters
                    </a>
                  ) : undefined
                }
              />
            ) : (
              <MediaGrid
                items={groups ? undefined : shown}
                groups={groups ?? undefined}
                activeKey={active}
                onActiveChange={setActive}
                selected={selected}
                onSelectedChange={setSelected}
                selectable={selectable}
                selectForm={selectable ? formId : undefined}
                hrefFor={(key) => href(withMedia(query, picker ? { pick: key } : { inspect: key }))}
                onOpen={openFile}
                inspecting={!!inspected}
                label={picker ? "Images" : trash ? "Files in Trash" : "Files"}
              />
            )}
          </div>
          {inspected ? (
            <MediaInspector
              ref={insRef}
              id={`${uid}-ins`}
              item={inspected}
              open
              mode={inspectorMode}
              onSave={save}
              onClose={() => go(withMedia(query, { inspect: undefined }))}
              onStep={(dir) => {
                const keys = shown
                  .filter((r) => r.state === "ready" || r.state === "binned")
                  .map((r) => r.key);
                const next = keys[keys.indexOf(inspected.key) + (dir === "next" ? 1 : -1)];
                if (next) go(withMedia(query, { inspect: next }));
              }}
              show={{
                alt: iOffers.alt,
                title: false,
                caption: iOffers.caption,
                tags: iOffers.tags,
              }}
              tools={tools(inspected)}
              onTool={(form) => void intents.run(form)}
              saving={inspector === "autosave" && submit ? "auto" : "form"}
              action={action}
              Form={Form}
              closeHref={href(withMedia(query, { inspect: undefined }))}
              can={{ trash: iOffers.trash, delete: iOffers.delete && (trash || !offers.trash) }}
              more={({ Tool, ident, base }) => (
                <MediaMore
                  item={inspected}
                  data={data}
                  Tool={Tool}
                  ident={ident}
                  base={base}
                  action={action}
                  inspectHref={(key) => href(withMedia(query, { inspect: key }))}
                  suggestHref={href(withMedia(query, { inspect: inspected.key, suggest: true }))}
                  unsuggestHref={href(withMedia(query, { inspect: inspected.key }))}
                />
              )}
            />
          ) : null}
        </div>
      </div>

      <PickForm m={m} />
      <LibraryFooter m={m} />

      {search && !picker ? (
        <CommandMenu
          open={finding}
          onOpenChange={setFinding}
          commands={[]}
          search={find}
          bindKeys={false}
          label={`Find a ${nounsOf(labels, "file").noun}`}
          placeholder="Name, address or alt text"
        />
      ) : null}

      {intents.confirmDialog}
    </section>
  );
}
