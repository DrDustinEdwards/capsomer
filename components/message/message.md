---
name: message
title: Message
summary: The page's one status region; the result of an action, with Undo, and every warning or failure that must not be missed, never taking focus.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [empty, plain message, message with Undo, after Undo, warning that stays, warning through the next result, failure, Undo that could not run, clears itself]
added: 0.1.0
source: Capsomer mockup (design/mockup.html, the status region and its say function); the Capsid Portal's lib/messages.ts and App.tsx message region (0.1.1)
replaces:
  - 'role="status"[^>]*class="(msg|toast|flash|notice)'
  - "(toast|sonner|react-hot-toast|notistack)"
  - 'class="msg-region'
---

# Message

The result of an action, said in the page: "Moved the mention to the bin", with Undo. One region per page, `role="status"`, so a screen reader hears it without focus moving. It holds the messages newest first: a plain result, which the next one replaces, and any warning, failure or failed Undo, which stay until dismissed.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01): `lib/messages.ts` (`Message`, `lasting`, `withMessage`) and the message region and Undo flow in `app/App.tsx` are EXTRACTED, with the Portal's own comments' reasoning, adapted to be generic (a message holds an `undo` function and an `undone` sentence, not the Portal's `UndoRequest`; no wouter, context or feed types). The `z` key, the 4 second clearing of a plain confirmation, focus handling and the markup are REWRITTEN (the Portal at the extraction base had only a timed toast). The Portal's region is fixed at the bottom right of the window; Capsomer keeps it in the page, because the audit rules out a floating toast (see the default below).

## When to use it

- After a reversible action that happened at once: say what happened and offer Undo (patterns.md "Reversible").
- After an action whose result is not otherwise visible: "Published to TXASM newsletter."
- When a result carries a warning the person must not miss: "Seat start is on. Warning: the audit row naming you was not written."
- For a failure with no control beside it to say so: a failed copy, a failed refresh, a failed sign out.

## When not to

- An error with a source belongs beside that source, as an alert (`.cap-alert`), or, for a failed page read, a banner that keeps the last good data (`.cap-banner`). See Banner. Only a failure with no place of its own goes in the region.
- A one-way action is previewed in a confirm dialog before it happens, not undone after.
- Never a floating toast (decision, 0.1).

## The default and its reason

- **One region per page, `role="status"`, present from the start.** A live region added at the moment it speaks is often not announced. Empty, it shows nothing and takes no space. It is named "Results and failures", and `aria-atomic="false"` so a new message is read by itself and the older ones are not read again.
- **It never takes focus.** The person keeps their place; the region speaks politely.
- **A message with Undo stays until dismissed** (decision, 0.1). Every message that stays has Dismiss.
- **A plain result is replaced by the next one. A warning, a failed Undo and a failure stay until dismissed, whatever is said after them** (the Portal's rule, decisions 2026-09-30 item 3, #221): the missing audit row is the one fact that cannot be found later by looking. The new message goes first; the ones that stay follow it. `say(text, { warning })` makes a result's warning stay. `fail(text)` says something that did not happen, as an alert.
- **`z` runs the newest Undo** when focus is not in a text field and no modifier is held. The key is shown beside the Undo button. `data-cap-undo-key="off"` on the region (React: `undoKey={false}`) switches it off with the app's other single-key shortcuts.
- **Undo runs once,** then the message says what was undone: "Undone. The mention from fieldnotes.example is waiting again." Pass `undone` to say it in your own words; otherwise it reads "Undone: " and the message. A message that carried a warning keeps it, without its Undo, and what was undone is said beside it as a new message (the Portal's rule: Undo does not make the warning go away).
- **If Undo fails, nothing was undone,** so Undo stays, the message stays, and it says why under its text, announced: "Could not undo that. The server did not answer. Try again." While Undo runs it reads "Undoing..." and Dismiss waits.
- **Focus goes to the control that was undone** when the app says which (`returnFocus`, as the Portal returns focus to the switch it undid). Otherwise, if Undo had focus, it moves to that message's Dismiss; if Dismiss had focus, it returns to the control that caused the message, else the main region. Focus is never left on nothing.
- **A plain confirmation may clear itself after 4 seconds** (`clears: true`) only when the control that caused it shows it too ("Copy link" turns to "Copied"). Such a message has no buttons. A message with Undo, a warning or a failure never clears itself.
- **It sits at the bottom of the view's scroll area** (`position: sticky`), in the page's flow, so a result shows near the action even in a long view. This is where the Portal and the audit differ: the Portal draws it fixed over the page at the bottom right; the audit's rule (patterns.md "Result of an action", DEFAULTS.md) is a status region in the page, so Capsomer follows the audit.
- **A lasting message wears the warning tone's edge, and says so in words** ("Warning:", or the failure's own words), never by colour alone.

## Keyboard

| Key | Does |
| --- | --- |
| `z` | Runs the newest Undo, once. Ignored in a text field, with Ctrl, Alt, Meta or Shift held, or when there is nothing to undo |
| Enter or Space on Undo | Runs Undo; focus moves to the control that was undone, else to that message's Dismiss |
| Enter or Space on Dismiss | Clears that message; focus returns to the control that caused the message |
| (a message appears) | Focus does not move |

## Accessibility

- `role="status"` is polite. A new message is read by itself, with the names of its buttons, so a listener hears that Undo is there. A failure and a failed Undo's reason are `role="alert"` and are announced at once.
- The same words said twice are announced twice (every message is a new element).
- The `z` hint is `aria-hidden`, so the button's name is "Undo".
- Text 4.5:1 on its raised background; each message's edge 3:1 (`--dim`, or `--warn` when it stays); buttons at least `var(--target)`.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The region is empty; messages are added to it.

```html
<div class="cap-message" data-cap="message" role="status" aria-label="Results and failures" aria-atomic="false"></div>
```

Each message `say()` adds:

```html
<div class="cap-message-item" data-cap-part="item" data-id="1" data-lasting>
  <p class="cap-message-text" data-cap-part="text">
    <span data-cap-part="said">Seat start is on.</span>
    <span class="cap-message-warning"> <b>Warning:</b> the audit row naming you was not written.</span>
    <span class="cap-message-error" role="alert" hidden></span>
  </p>
  <button type="button" class="cap-link-btn cap-message-undo" data-cap-part="undo"><span>Undo</span> <kbd aria-hidden="true">z</kbd></button>
  <button type="button" class="cap-btn cap-message-dismiss" data-cap-part="dismiss">Dismiss</button>
</div>
```

```ts
import { enhance, say, fail } from "capsomer/behaviour/message";
enhance();
say("Moved the mention from fieldnotes.example to the bin.", {
  undo: () => restore(mention),
  undone: "The mention from fieldnotes.example is waiting again.",
  returnFocus: binButton,
});
say("Seat start is on.", { undo: () => api.undoSeat(), warning: result.warning });
say("Copied the link to the mention.", { clears: true });
fail("Refresh failed: the watcher pass failed: GitHub answered 502.");
```

An Undo that rejects keeps its message and shows the error's message under it. 0.1.0's region held one text and two buttons directly; `enhance()` removes those, and the messages replace them. In React, wrap the app in `<MessageProvider>` and call `const { say, fail } = useMessage()`; the provider renders the region after its children, or pass `region={false}` and place `<MessageRegion />` yourself.

## Exceptions in production

None yet.
