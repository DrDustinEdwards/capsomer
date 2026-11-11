---
name: sign-in-settings
title: Account settings
summary: How a signed-in person manages their account, the same on every site, its email address, passkeys, Google and Apple, signed-in devices, recent security activity and deleting it, and the passkey offer after an email sign-in.
parts: [css, react]
tool: native + site-runtime's sign-in
states: [every part, new account, one passkey, email change sent, email change refused, old sign-in, deletion blocked, hand-over field, read only, passkey offer]
added: 0.93.0
source: Foxhound app/components/sign-in-settings.tsx and app/routes/app/settings/account.tsx, Foxing app/components/settings/account-sections.tsx and app/routes/passkey-offer.tsx, txasm app/routes/account.tsx (shared-code audit, 2026-11-11, item 20)
replaces:
  - "SignInMethodsPanel\\("
  - "SignInSection\\("
  - "SessionsSection\\("
  - "SecurityHistorySection\\("
  - "historyLabel\\("
  - "historyWords\\("
---

# Account settings

One account page for every site: the parts a signed-in person needs to look after how they sign in, in one order and one set of words. The server half is site-runtime's: `accountFormAction` (`./sign-in-form`) answers the page's three posts, `accountOptions` sets up the email change and deletion, and `./sign-in` reads the rows (`passkeyRows`, `accountSessions`, `securityHistory`). The words are `ACCOUNT_WORDS` and `securityHistoryWords` (`./sign-in-words`).

**Provenance.** EXTRACTED and MERGED from three copies, as of 2026-11-11: Foxhound's sign-in panel and account page (the passkey list with rename in place, Google and Apple connect and disconnect, devices with their places, the history), Foxing's account sections and passkey offer (the gap check before the passkey signal, the "Sign in again" for the device list) and txasm's account page (the email change words, the deletion blockers, the ticked box). Where they differed, the network takes one behavior: the email change and deletion are posts to the page's action (Foxhound; txasm and Foxing called the client, which skipped the disposable and unconfirmed-address checks), deletion asks for one ticked box (txasm; Foxing's typed phrase and Foxhound's two-step callout are gone), and every row says the same words.

## When to use it

The signed-in page where a person manages their account (`/account`, `/settings`, `/settings/account`), and `PasskeyOffer` on the page an email link, a code, Google or Apple lands on.

## When not to

A site's own profile fields (a username, a business profile) and its own account controls (Foxhound's Cancel account) are the site's, beside these parts. Admin pages are behind Cloudflare Access.

## The default and its reason

- **One panel per part, in this order:** email, passkeys, Google and Apple (only where the site offers them, titled by the ones it offers), devices, history, delete. Most-used first; the one that cannot be undone last.
- **The email change takes two links**, the current address first, so a stolen session alone cannot move the account. The page says only that the first link went, never whether the new address is taken.
- **Passkeys rename in place and remove at once.** The email link always works, so removing one cannot lock anyone out; one passkey alone gets the "Add a second passkey" note. Each time the list loads, the browser's passkey provider is told which ones the site still accepts (the WebAuthn Signal API), and a removed one is signaled at once.
- **Google and Apple join only here**, while signed in, never by a matching email at sign-in.
- **A device signs out by a post of its id**, so no session token reaches the page; "Sign out all other devices" shows with more than one.
- **History is one sentence per row** with when, the device and the place, so a person can spot one that was not theirs.
- **Deletion asks for one ticked box**, then the danger button. A site's `blockers` (a role to hand over) take the form's place; its `fields` (Foxing's club hand-over) sit above the box.
- **A recent sign-in comes first** for the email change, the device list and deletion (10 minutes, site-runtime's FRESH_SECONDS). Without one the part says so and links to "Sign in again", which returns to this page.
- **`readOnly`** (a demo) keeps the page and answers every change with its sentence.
- **The passkey offer** is skipped on a device that cannot make one; "Not now" is held 30 days for the person.

## Parts

- `AccountSettings(props)`: every part in order. `state` is `accountFormAction`'s, `pending` the post on its way, `client` the site's Better Auth client, `revalidate` the router's reload.
- `EmailSettings`, `PasskeySettings`, `ProviderSettings`, `DeviceSettings`, `SecurityHistory`, `DeleteAccount`: the parts, for a site that lays them out with its own sections between.
- `PasskeyOffer({ client, next, siteName, Form })`: the offer, in the sign-in screen's `AuthCard`.

## Matches

shadcn/ui's settings blocks (cards with a title, a description and a footer action). Deliberately different: no password section, the danger card asks for a box rather than a typed name, and devices sign out one by one.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Each part's field and buttons in order: Change email, each passkey's Rename and Remove, Add, each provider, each device's Sign out, Sign out all other devices, the box, Delete my account |
| Enter in a rename field | Saves the name |
| Escape | Nothing: Cancel closes a rename |

## Accessibility

- Each part is a panel with an `h2`; each row's button names its row ("Remove Work laptop") with a hidden suffix.
- Each refusal shows beside its part as an alert; the email field's error is the field's own.
- The rename field takes focus when Rename is pressed.
- Times are `<time>` elements (`Time`), relative, with the exact time in their datetime.
- With no script, the email change, device sign-out and deletion still work: they are plain posts. Passkeys, Google and Apple need script.
- Screen readers: no manual run, by decision; the axe scan and the front-end review stand in.

## Markup

```html
<div class="cap-account">
  <section class="cap-panel">
    <header class="cap-panel-head"><h2>Passkeys</h2><p class="cap-panel-desc">A passkey signs you in with your face...</p></header>
    <div class="cap-panel-body">
      <div class="cap-account-stack">
        <ul class="cap-account-list" aria-label="Your passkeys">
          <li class="cap-account-row">
            <span class="cap-account-what">Work laptop<span class="cap-account-meta">iCloud Keychain, added <time>40 days ago</time></span></span>
            <span class="cap-account-actions"><button class="cap-btn" data-size="sm">Rename<span class="cap-sr-only"> Work laptop</span></button></span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</div>
```

Signed-in devices post a plain form, and the security history is a list of lines:

```html
<div class="cap-account">
  <section class="cap-panel">
    <header class="cap-panel-head"><h2>Signed-in devices</h2></header>
    <div class="cap-panel-body">
      <div class="cap-account-stack">
        <ul class="cap-account-list" aria-label="Your signed-in devices">
          <li class="cap-account-row">
            <span class="cap-account-what">Firefox on Windows<span class="cap-account-meta">Signed in <time>2 days ago</time>, last active <time>1 hour ago</time></span></span>
            <form method="post" class="cap-account-actions"><button class="cap-btn" data-size="sm" type="submit">Sign out<span class="cap-sr-only"> Firefox on Windows</span></button></form>
          </li>
        </ul>
      </div>
    </div>
  </section>
  <section class="cap-panel">
    <header class="cap-panel-head"><h2>Security history</h2></header>
    <div class="cap-panel-body">
      <ul class="cap-account-list" aria-label="Your recent security activity">
        <li class="cap-account-what">Signed in with a passkey<span class="cap-account-meta"><time>Today</time>, Chrome on macOS</span></li>
      </ul>
    </div>
  </section>
</div>
```

## Exceptions in production

None yet.
