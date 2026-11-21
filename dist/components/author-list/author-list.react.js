import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { foldAuthors, nameOf } from "./author-list.js";
function Name({ author, owner, format, linked, }) {
    const name = nameOf(author);
    const href = typeof author === "string" ? undefined : author.href;
    const shown = linked && href ? _jsx("a", { href: href, children: format(name) }) : format(name);
    return owner ? _jsx("strong", { className: "cap-author-list-owner", children: shown }) : _jsx(_Fragment, { children: shown });
}
function Names({ authors, isOwner, format, linked, }) {
    return (_jsx(_Fragment, { children: authors.map((a, i) => (_jsxs("span", { children: [i > 0 ? ", " : "", _jsx(Name, { author: a, owner: isOwner(nameOf(a)), format: format, linked: linked })] }, `${nameOf(a)}-${i}`))) }));
}
const plain = (name) => name;
const nobody = () => false;
// The byline of a paper, a report or a post: every name, the owner's in strong; folded into a
// `details` when `collapse` is given and the list is longer. A summary holds no links (a link inside
// the summary button is a control inside a control), so linked names link in the full list only.
export function AuthorList({ authors, isOwner = nobody, collapse, format = plain, }) {
    if (authors.length === 0)
        return null;
    const fold = collapse === undefined ? null : foldAuthors(authors, isOwner, collapse);
    if (!fold?.folded) {
        return (_jsx("p", { className: "cap-author-list", children: _jsx(Names, { authors: authors, isOwner: isOwner, format: format, linked: true }) }));
    }
    return (_jsxs("details", { className: "cap-author-list", children: [_jsxs("summary", { className: "cap-author-list-summary", children: [_jsx(Names, { authors: fold.lead, isOwner: isOwner, format: format, linked: false }), fold.owner ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-author-list-more", children: fold.lead.length > 0 ? ", ... " : "... " }), _jsx(Name, { author: fold.owner, owner: true, format: format, linked: false })] })) : null, _jsxs("span", { className: "cap-author-list-more", children: [" and ", fold.more, " more"] })] }), _jsx("p", { className: "cap-author-list-full", children: _jsx(Names, { authors: fold.all, isOwner: isOwner, format: format, linked: true }) })] }));
}
