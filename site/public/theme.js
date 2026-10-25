// The theme the visitor chose, set before the page paints (the site's CSP allows no inline script).
// The key is the theme switch's own (components/theme-switch, THEME_PREF).
try {
  const t = localStorage.getItem("cap-theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch {}
