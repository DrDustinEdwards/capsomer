// The media library's bulk tags and the clipboard: plain functions the behavior module and the React
// wrapper share.

// ---------------------------------------------------------------------------------------
// Bulk tags: add or remove one tag across a
// selection. An item already in the wanted state is skipped, so it is not rewritten for nothing,
// and one item's failure is recorded without stopping the rest.
export async function applyBulkTag<T>({
  ids,
  wanted,
  adding,
  missing,
  read,
  write,
}: {
  ids: readonly string[];
  wanted: string;
  adding: boolean;
  missing: string;
  read: (id: string) => Promise<{ item: T; tags: string[] } | null>;
  write: (id: string, item: T, tags: string[]) => Promise<unknown>;
}): Promise<{ done: string[]; skipped: string[]; failed: string[] }> {
  const failed: string[] = [];
  const done: string[] = [];
  const skipped: string[] = [];
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
      await write(
        id,
        found.item,
        adding ? [...found.tags, wanted] : found.tags.filter((t) => t !== wanted),
      );
      done.push(id);
    } catch (error) {
      failed.push(`${id}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  return { done, skipped, failed };
}
