---
name: sign-in
title: Sign-in
summary: The one sign-in screen every site shows, a passkey first, Google and Apple where the site has them, then an emailed link with its code, and the pages the emailed links open.
parts: [css, react]
tool: native + site-runtime's sign-in
states: [passkey, Google and Apple, email link, refused, notice, check your inbox, wrong code, link page, link expired, email change, email changed, own page]
added: 0.94.0
source: Foxhound app/components/auth-card.tsx, Foxing app/components/auth-shell.tsx, txasm app/routes/signin.tsx (shared-code audit, 2026-11-11, items 19 and 21)
replaces:
  - "fx-auth-shell"
  - "data-auth-card"
  - "AuthCard\\("
  - "AuthShell\\("
---

# Sign-in

One screen for signing in, the same on every site: the network's sign-in standard (2026-10-24) drawn once. A passkey first; Google and Apple on a consumer app that has their settings; then an emailed link, with Turnstile on it, whose mail also carries a six-digit code. After the mail goes, the screen says so and takes the code. Two more pages belong to it: the one the emailed sign-in link opens, and the one both email-change links open.

The server half is site-runtime's: `./sign-in-form` (the route's action, the landing check, the Google and Apple start) and `./sign-in-words` (every sentence these pages say). The page's own route reads the methods with `signInMethods(env, { social })`, runs `signInFormAction` and hands its state here.

**Provenance.** EXTRACTED and MERGED from three copies, as of 2026-11-11: Foxhound's `auth-card.tsx` (the card, the passkey button with autofill, the social forms posting to `/auth/:provider`, the link form, the sent screen with the code), Foxing's `auth-shell.tsx` (the brand line above the card, the ghost "send a new link") and txasm's `signin.tsx` (the heading taking focus when the mail is sent). Where they differed, the network takes one behavior: the link and the code are posts to the page's own action (txasm and Foxhound; Foxing called Better Auth from the browser, which skipped nothing but left the page with no script with no way in), Google and Apple are form posts to a server start (Foxhound; Foxing's client call is gone), and every refusal says the same words on every site.

## When to use it

For every page a person signs in on: `/login`, `/signup`, `/signin`, and the page that asks a signed-in person to sign in again before a change to how they sign in.

## When not to

Admin pages are behind Cloudflare Access, which draws its own sign-in. An app's own phone sign-in is native.

## The default and its reason

- **The passkey is first and primary.** It cannot be phished and needs nothing typed. A canceled browser prompt is someone choosing another way, so it says nothing; any other refusal says which kind (`passkeyErrorWords`).
- **Saved passkeys appear in the email field's suggestions** (`autocomplete="username webauthn"`, conditional mediation), once per page, so a returning person taps one.
- **Google and Apple are buttons that post** to the site's start route, with `next`, so the landing is decided on the server. Apple comes with Google: an iPhone app that offers Google must offer Apple. Google's mark keeps its four colors; Apple's is the text color, as each guideline allows.
- **Then "or", then Email.** The link request says "sent" for every address, so the screen never tells anyone whether an address has an account. The only refusals shown are the site's: the check, the limits, the link switched off.
- **Turnstile sits above the send button** and is drawn again after every answer, since a token is good for one check.
- **"Check your inbox" names the address and the time** (10 minutes) and takes the code in one input (`CodeInput`), because the link signs in the browser that opens it, often the mail app's. The heading takes focus, so a screen reader hears the screen change. "Send a new link and code" is a plain GET of the page.
- **Every way in is a full-width button in one column**, at the large size.
- **The emailed link opens a page with one button** (`SignInConfirm`), never a sign-in on the GET, because a mail scanner opens every link. A refused link says which way it failed (used, expired, cut short) and offers a new one.
- **The email-change page is the same shape** (`EmailConfirm`): one button, then what happened, and the way back to the settings page.

## Parts

- `AuthCard({ title, lede, brand, footer, layout })`: the frame. `layout="screen"` centers it in the window, for a page with no site navigation (Foxhound's).
- `SignIn({ title, lede, client, methods, state, error, passkeyLanding, next, pending, notice, Form, socialAction })`: the screen. `client` is the site's Better Auth client; `state` is `signInFormAction`'s; `Form` is the router's form (React Router's `Form`), so `pending` follows the post.
- `SignInConfirm({ siteName, problem, limited, signInPath, continuePath })`: the emailed sign-in link's page; `problem` is `signInLinkProblem`'s.
- `EmailConfirm({ siteName, settings, settingsPath, done, problem, email, limited })`: the email-change page; `done` and `problem` are `emailLinkResult`'s.

## Matches

shadcn/ui's login blocks (login-01 to login-05: a card with the title and description, a full-width primary, "Or continue with", the social buttons, the footer line). Deliberately different: the passkey leads, the social buttons follow it rather than lead, there is no password, and the code screen is one input.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The passkey button, each provider, the email field (with its passkey suggestions), the check, the send button, then the footer's links |
| Enter in Email | Sends the link |
| Enter in Code | Signs in with the code |

## Accessibility

- One `h1` per page, the card's title; it takes focus when the mail is sent.
- Each error is the field's own (`aria-describedby`, `aria-invalid`), announced as it appears.
- The marks are hidden; each button's words name the provider.
- With no script, the email link and the code still work: both are plain posts. The passkey and Turnstile need script.

## Markup

```html
<div class="cap-auth" data-layout="screen">
  <div class="cap-auth-brand">Field Notes</div>
  <div class="cap-auth-card">
    <h1 class="cap-auth-title" tabindex="-1">Sign in</h1>
    <p class="cap-auth-lede">Use your passkey, or get a sign-in link by email.</p>
    <div class="cap-auth-body">
      <div class="cap-auth-passkey"><button class="cap-btn" data-variant="primary" data-size="lg">Sign in with a passkey</button></div>
      <form class="cap-auth-form" method="post" action="/auth/google">
        <button class="cap-btn" data-size="lg" type="submit"><svg class="cap-auth-mark" aria-hidden="true"></svg>Continue with Google</button>
      </form>
      <p class="cap-auth-or"><span>or</span></p>
      <form class="cap-auth-form" method="post" novalidate>
        <div class="cap-field">
          <label class="cap-field-label" for="email">Email</label>
          <input class="cap-input" id="email" name="email" type="email" autocomplete="username webauthn" spellcheck="false" autocapitalize="none" />
        </div>
        <div class="cap-auth-check"></div>
        <button class="cap-btn" data-size="lg" type="submit">Email me a sign-in link</button>
      </form>
    </div>
  </div>
  <div class="cap-auth-foot"><p>New here? <a href="/signup">Make an account</a></p></div>
</div>
```

A site sets the card's width with `--cap-auth-w` (25rem by default) and its look with its own tokens.
