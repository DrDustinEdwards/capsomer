// The theme the visitor chose, set before the page paints (the site's CSP allows no inline script).
// The key is the theme switch's own (components/theme-switch, THEME_PREF).
try {
  const t = localStorage.getItem("cap-theme");
  if (t === "light" || t === "dark") {
    document.documentElement.dataset.theme = t;
    // The color-scheme hint follows the choice (theme-switch's colorSchemeContent), so the canvas matches it.
    const scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.content = t;
  }
} catch {}
