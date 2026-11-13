---
name: avatar
title: Avatar
summary: A person, an agent or a source as a round picture or its initials, with a corner badge, and a group that overlaps.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [initials, picture, picture that fails to load, sizes, square, agent, badge, group with a count, comfortable density]
added: 0.3.0
source: shadcn/ui Avatar (Base UI flavor, nova style, commit d75a96ab787f); the history list and the authorship marks needed a "who"
replaces:
  - 'class="(avatar|user-avatar|initials)[ "]'
  - "className=\"(avatar|user-avatar)[ \""
---

# Avatar

## Usage

```html
<span class="cap-avatar" data-cap="avatar" role="img" aria-label="Alex Rivera">
  <span class="cap-avatar-fallback" aria-hidden="true">AR</span>
  <img class="cap-avatar-image" src="/people/alex.jpg" alt="" width="64" height="64" />
</span>

<span class="cap-avatar-group" role="group" aria-label="Contributors">
  <span class="cap-avatar" role="img" aria-label="Alex Rivera">...</span>
  <span class="cap-avatar-count" role="img" aria-label="and 3 more">+3</span>
</span>
```

## Accessibility

An avatar is not a control and takes no keys. One that opens a profile is wrapped in a link or button by the caller, which owns its focus ring.

- The avatar is `role="img"` with the person's name as `aria-label`; the picture is `alt=""` and the initials are `aria-hidden`, so the name is read once.
- A group is `role="group"` named by `aria-label`; the count is an image named "and 3 more".
- The fallback reaches 4.5:1; the badge's glyph reaches 3:1 on its fill.
