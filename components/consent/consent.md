---
name: consent
title: Consent screen
summary: The OAuth consent screen every site shows an app asking for access, and the permission list of what an app may or may not do.
parts: [css, react]
tool: native
states: [a published client with the write grant, a self-registered client with a warning and a refusal, a request that cannot be shown, permission lists]
added: 0.100.0
updated: 0.100.0
source: Foxhound (routes/oauth/authorize.tsx ConsentCard; routes/auth/connect.tsx and audit/connect.tsx AccessList); site-runtime's MCP login page (mcp-login.mjs) says the same words as HTML
replaces:
  - "function ConsentCard"
  - "function AccessList"
---

# Consent screen

When an app asks for access to someone's account, every site asks the same way: who is asking and how far that is checked, where the access goes, which account, what the app can do, and the right to change things as a separate choice.

## When to use it

An OAuth authorize page (an MCP client, a connector). `PermissionList` also stands alone on a connect page: what a connection reads, and what it never does.

## When not to

Signing in is the sign-in page (site-runtime `./sign-in`). Granting a person a role is people-roles.

## The default and its reason

- **How far the name is checked is said**: a client whose metadata a host publishes is "Published by assistant.example.com"; one that registered itself is told plainly that its name is its own claim.
- **Where the access goes is named** (the redirect's host), with a warning when it is not the client's own (a loopback).
- **Writing is its own choice**, a checkbox apart from what it can read, with its scope name; without it the app can only read.
- **Allow and Deny are equal-width, side by side**; the one pressed shows its pending state.
- **One 460px card, centered**, the site's mark on top.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The write grant's checkbox, Allow access, Deny |
| Space | Ticks the write grant |
| Enter on a button | Posts the choice |

## Accessibility

- One `main`, one `h1` that names the client and the product.
- The permission list is named by its heading; its check or cross is hidden, the heading says which list it is.
- A refusal is an alert.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { Form } from "react-router";
import { ConsentScreen } from "capsomer/react/consent";
import "capsomer/consent.css";
<ConsentScreen client={c.clientName} product="Example Co" publishedBy={c.publishedBy} redirectHost={c.redirectHost}
  account={{ name: c.accountName, email: c.email }} can={READS} write={{ items: WRITES, scope: "example.write" }}
  hidden={{ client_id: c.clientId, redirect_uri: c.redirectUri, state: c.state }} Form={Form} />
```

## Exceptions in production

None.
