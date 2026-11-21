// The look Button, ButtonLink and the error page share (`.cap-btn`, button.md), in a module of its
// own so a page that draws a button-styled link (the error page, in every app's root bundle) takes
// it without Button, ButtonLink or the router.
// The class and data attributes for a look, and the accessible name an icon alone takes (its
// `label`, else the given aria-label), warning when an icon-only control has neither.
export function buttonAttrs(look, className) {
    const { variant = "default", size = "default", iconOnly = false, wrap = false } = look;
    const name = iconOnly ? (look.label ?? look["aria-label"]) : look["aria-label"];
    if (iconOnly && !name)
        console.warn("Capsomer: an icon-only button or link needs a label.");
    return {
        className: className ? `cap-btn ${className}` : "cap-btn",
        "data-variant": variant === "default" ? undefined : variant,
        "data-size": size === "default" ? undefined : size,
        "data-icon-only": iconOnly ? "" : undefined,
        "data-wrap": wrap ? "" : undefined,
        "data-block": look.block ? "" : undefined,
        "aria-label": name,
    };
}
