// A banner's Dismiss button. The rest of a banner is CSS.
// Hides a banner and, if focus was inside, moves it to the page's main region (made focusable), so focus is never left on nothing.
export function dismissBanner(banner) {
    const hadFocus = banner.contains(document.activeElement);
    banner.hidden = true;
    if (hadFocus)
        focusMain(banner);
}
// The focus move, shared with the React Banner, whose Dismiss removes the banner instead.
export function focusMain(banner) {
    const main = banner.closest("main") ?? document.querySelector("main");
    if (!main)
        return;
    if (!main.hasAttribute("tabindex"))
        main.setAttribute("tabindex", "-1");
    main.focus();
}
export function enhance(root = document) {
    const undo = [];
    for (const banner of root.querySelectorAll("[data-cap='banner']:not([data-cap-ready])")) {
        banner.dataset.capReady = "";
        const onClick = (e) => {
            if (e.target.closest("[data-cap-part='dismiss']"))
                dismissBanner(banner);
        };
        banner.addEventListener("click", onClick);
        undo.push(() => {
            banner.removeEventListener("click", onClick);
            delete banner.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
