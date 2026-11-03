// A banner's Dismiss button. The rest of a banner is CSS; its Try again is the app's own.
// Hides a banner and puts focus somewhere sensible if it was inside: the page's main
// region, made focusable for the purpose, so focus is never left on nothing.
export function dismissBanner(banner) {
    const hadFocus = banner.contains(document.activeElement);
    banner.hidden = true;
    if (!hadFocus)
        return;
    const main = banner.closest("main") ?? document.querySelector("main");
    if (!main)
        return;
    if (!main.hasAttribute("tabindex"))
        main.setAttribute("tabindex", "-1");
    main.focus();
}
// Attaches to every [data-cap="banner"] under root not yet attached. Returns a function
// that detaches.
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
