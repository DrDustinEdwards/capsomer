// The admin's pages had hash addresses at the root (#/components/button) before the admin moved to
// /admin/; an old link still opens its page there.
if (location.hash.startsWith("#/")) location.replace(`/admin/${location.hash}`);
