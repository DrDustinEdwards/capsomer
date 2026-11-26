/**
 * True when the only change between two addresses is in the named display parameters: same path,
 * every other parameter the same, at least one named one different. A missing parameter reads as its
 * default. Identical addresses are false: a revalidation after an action has the same address on both
 * sides, and skipping it would hide the write.
 */
export declare function onlyParamsChanged(current: URL, next: URL, display: readonly string[], defaults?: Readonly<Record<string, string>>): boolean;
