// The media library's bulk tags and the clipboard: plain functions the behavior module and the React
// wrapper share.
// ---------------------------------------------------------------------------------------
// Bulk tags: add or remove one tag across a
// selection. An item already in the wanted state is skipped, so it is not rewritten for nothing,
// and one item's failure is recorded without stopping the rest.
export async function applyBulkTag({ ids, wanted, adding, missing, read, write, }) {
    const failed = [];
    const done = [];
    const skipped = [];
    for (const id of ids) {
        try {
            const found = await read(id);
            if (!found) {
                failed.push(`${id}: ${missing}`);
                continue;
            }
            if (adding === found.tags.includes(wanted)) {
                skipped.push(id);
                continue;
            }
            await write(id, found.item, adding ? [...found.tags, wanted] : found.tags.filter((t) => t !== wanted));
            done.push(id);
        }
        catch (error) {
            failed.push(`${id}: ${error instanceof Error ? error.message : "failed"}`);
        }
    }
    return { done, skipped, failed };
}
// ---------------------------------------------------------------------------------------
// The clipboard. Copy through the Clipboard API; where the page may not, through a selected
// field and the document's own copy command; where neither works, say so and leave the text
// selected.
// How long the copy status stays: a success is short news, a failure leaves time to copy by hand.
export const COPIED_MS = 2500;
export const COPY_FAILED_MS = 8000;
export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch {
        // fall through
    }
    try {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.setProperty("position", "fixed");
        area.style.setProperty("opacity", "0");
        document.body.append(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        return ok;
    }
    catch {
        return false;
    }
}
