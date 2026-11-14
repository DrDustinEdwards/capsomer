---
"capsomer": patch
---

**`Title`, `Text` and `Stack` take any element or component and its props.** `as` is a tag or a component (a router `Link` or `Form`), and that element's own props reach it with their types: `<Stack as="form" method="post" noValidate>`, `<Text as={Link} to="/x">`. Replaces 0.148.0's fixed element list. No CSS change.
