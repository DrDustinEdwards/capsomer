// The share row's addresses: each service's own share intent, a plain link with no script and no
// tracker. The page's address and title go in the query.
export const SHARE_NAMES = {
    x: "X",
    linkedin: "LinkedIn",
    bluesky: "Bluesky",
    facebook: "Facebook",
    email: "Email",
};
export function shareHref(target, url, title) {
    const q = (o) => new URLSearchParams(o).toString();
    switch (target) {
        case "x":
            return `https://x.com/intent/tweet?${q({ text: title, url })}`;
        case "linkedin":
            return `https://www.linkedin.com/sharing/share-offsite/?${q({ url })}`;
        case "bluesky":
            return `https://bsky.app/intent/compose?${q({ text: `${title} ${url}` })}`;
        case "facebook":
            return `https://www.facebook.com/sharer/sharer.php?${q({ u: url })}`;
        case "email":
            return `mailto:?${q({ subject: title, body: url }).replace(/\+/g, "%20")}`;
    }
}
