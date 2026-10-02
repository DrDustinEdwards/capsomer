---
name: avatar
title: Avatar
summary: A person, an agent or a source as a round picture or its initials, with a corner badge, and a group that overlaps.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [initials, picture, picture that fails to load, sizes, square, agent, badge, group with a count, comfortable density]
added: 0.3.0
source: shadcn/ui Avatar (Base UI flavour, nova style, commit d75a96ab787f); the history list and the authorship marks needed a "who"
replaces:
  - 'class="(avatar|user-avatar|initials)[ "]'
  - "className=\"(avatar|user-avatar)[ \""
---

# Avatar

Who did something: the author of a version, the sender of a mention, the agent that wrote a passage. A round picture, or when there is none the person's initials on a muted fill.

## When to use it

Beside a name in a list, a history line, a comment, a header. It never replaces the name: the name is text beside it, or the avatar's own accessible name.

## When not to

- A status (running, failed) is a `.cap-status`; an avatar's badge may add a presence mark, but the word still belongs in text.
- A logo or a thumbnail of a file is an image or a media tile, not an avatar.

## The default and its reason

- **Initials are in the HTML, the picture covers them.** A page delivered as HTML names the person without script; a picture that fails to load gives way to the initials (`data-state="error"`, set by `enhance()`). shadcn's Base UI Avatar shows its fallback only after the image fails, which needs script.
- **32 px, with `sm` 24 and `lg` 40**, round (`data-shape="square"` for a site or project). Matches shadcn's sizes.
- **The fallback is `--muted` on `--sunken`**, 4.5:1 in both themes (shadcn's `text-muted-foreground` on `bg-muted`, with Capsomer's tokens).
- **The picture has a 1 px inset edge in `--line`**, so a pale picture on a pale page still has a boundary; shadcn uses a 10% black overlay, which vanishes in dark.
- **An agent's initials are set in the mono face** (`data-kind="ai"`), a second cue beside the word "AI" that always accompanies it.
- **A badge is a shape or a letter on a solid tone with a 2 px ring of the page colour**, and the avatar's name says what it means ("Dustin Edwards, online").
- **A group overlaps by 8 px**, each avatar ringed in the page colour; "+3" is a count with its own name.

## The shadcn component it matches

Avatar: Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount. Matched: the three sizes, the round shape, the fallback, the badge, the overlapping group with its count. Different on purpose: initials render with the HTML (no wait for an image error); the edge is drawn, not an overlay; the avatar is one image-role element named for the person.

## Keyboard

An avatar is not a control and takes no keys. One that opens a profile is wrapped in a link or button by the caller, which owns its focus ring.

## Accessibility

- The avatar is `role="img"` with the person's name as `aria-label`; the picture is `alt=""` and the initials are `aria-hidden`, so the name is read once.
- A group is `role="group"` named by `aria-label`; the count is an image named "and 3 more".
- The fallback reaches 4.5:1; the badge's glyph reaches 3:1 on its fill.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<span class="cap-avatar" data-cap="avatar" role="img" aria-label="Dustin Edwards">
  <span class="cap-avatar-fallback" aria-hidden="true">DE</span>
  <img class="cap-avatar-image" src="/people/dustin.jpg" alt="" width="64" height="64" />
</span>

<span class="cap-avatar-group" role="group" aria-label="Contributors">
  <span class="cap-avatar" role="img" aria-label="Dustin Edwards">...</span>
  <span class="cap-avatar-count" role="img" aria-label="and 3 more">+3</span>
</span>
```

`import { enhance, initials } from "capsomer/behaviour/avatar"`. In React, `import { Avatar, AvatarGroup } from "capsomer/react/avatar"`: `<Avatar name="Dustin Edwards" src="..." size="lg" badge={...} badgeLabel="online" />`.

## Exceptions in production

None yet.
