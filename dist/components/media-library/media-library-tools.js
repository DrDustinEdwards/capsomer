import { acceptLabel } from "../drop-zone/drop-zone.js";
import { formatBytes } from "../format/format.js";
import { bareType, CROPPABLE } from "../media/media.js";
// The picture tools for the open file: the focal point, replace (the file's own type, the site's
// size limit) and crop (with script and the host's same-origin bytes).
export function pictureTools(item, k) {
    const { offers, can, iOffers, bytesHref, submit, run, open } = k;
    const type = bareType(item.type);
    const asNew = can.edit && !!offers.upload?.types.includes(type);
    const replace = iOffers.replace && !!item.version && offers.upload
        ? {
            accept: type,
            hint: `A new ${acceptLabel(type)} file, up to ${formatBytes(offers.upload.maxBytes)}.`,
        }
        : null;
    const crop = bytesHref && submit && CROPPABLE.includes(type) && (asNew || replace)
        ? {
            src: bytesHref(item.key),
            asNew,
            inPlace: !!replace,
            onSave: async (file, how) => {
                const form = new FormData();
                form.set("intent", how === "new" ? "upload" : "replace");
                if (how === "replace") {
                    form.set("ids", item.key);
                    if (item.version)
                        form.set("versions", item.version);
                }
                form.set("file", file);
                // A new file is described as the one it was cut from (site-api 0.19+ refuses an undescribed upload).
                if (how === "new") {
                    if (item.altState === "decorative")
                        form.set("decorative", "on");
                    else
                        form.set("alt", item.alt);
                }
                const r = await run(form);
                if (!r?.ok)
                    throw new Error(r?.message ?? "The crop was not saved.");
                const made = how === "new" ? r.outcomes?.find((o) => o.ok)?.id : undefined;
                if (made)
                    open(made);
            },
        }
        : null;
    return {
        focus: iOffers.focus && !!item.version,
        replace,
        crop,
        keepsSize: !!offers.replaceKeepsSize,
    };
}
