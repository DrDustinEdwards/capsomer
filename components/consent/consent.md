---
name: consent
title: Consent screen
summary: The OAuth consent screen every site shows an app asking for access, and the permission list of what an app may or may not do.
group: pattern
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

## Usage

```tsx
import { Form } from "react-router";
import { ConsentScreen } from "capsomer/react/consent";
import "capsomer/consent.css";
<ConsentScreen client={c.clientName} product="Example Co" publishedBy={c.publishedBy} redirectHost={c.redirectHost}
  account={{ name: c.accountName, email: c.email }} can={READS} write={{ items: WRITES, scope: "example.write" }}
  hidden={{ client_id: c.clientId, redirect_uri: c.redirectUri, state: c.state }} Form={Form} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The write grant's checkbox, Allow access, Deny |
| Space | Ticks the write grant |
| Enter on a button | Posts the choice |

- One `main`, one `h1` that names the client and the product.
- The permission list is named by its heading; its check or cross is hidden, the heading says which list it is.
- A refusal is an alert.
