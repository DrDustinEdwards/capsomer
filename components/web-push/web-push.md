---
name: web-push
title: Phone alerts
summary: Turn Web Push on for this browser, see the devices that have it and turn one off, and send a test alert.
parts: [css, behavior, react]
tool: own JavaScript
states: [no devices, devices, a note after a change, turning on failed, not set up, a browser with no Web Push]
added: 0.94.0
source: the Capsid Portal's PhoneAlerts (dashboard/src/views/PhoneAlerts.tsx) and its service worker (dashboard/public/sw.js)
replaces:
  - 'PushManager'
  - 'function deviceLabel'
---

# Phone alerts

The settings block for Web Push alerts: Turn on for this device, Send a test alert, and the list of devices that have alerts on, each with Turn off. The site's server keeps the subscriptions and sends the alerts; Capsomer's push worker shows them and opens the item an alert names.

## When to use it

A signed-in app that alerts its owner about a few things that cannot wait (a rollback, a money pull request waiting): its settings page.

## When not to

- **Anything that can wait a day**: an email digest.
- **Visitors to a public site**: never ask a reader for notifications.

## The default and its reason

- **Permission is asked only on the button** ("Turn on for this device"), never on load (web.dev: permission UX).
- **Each device is named by browser and system only** ("Chrome on Android"), enough to tell two apart, nothing more.
- **A refusal says what to do** ("Allow them for this site in the browser's settings, then try again.").
- **A browser with no Web Push is told so** in place of the button.
- **The worker caches nothing and answers no fetch**, so the app loads exactly as it does without it; a tap opens only a page on the worker's own scope, moving an open tab there rather than opening another.
- **No action buttons on an alert**: every answer is given in the app.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through Turn on, Send a test alert, then each device's Turn off |
| Enter, Space | Presses the button |

## Accessibility

- A failure is an alert; a result is a status, so it is read when it changes.
- The device list is a named list.
- Buttons wait (disabled) while a request is in flight.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## The worker

`capsomer/push-sw.js` is a plain script. Serve it from the scope you register (a resource route that returns the file with `Content-Type: text/javascript` and `Cache-Control: no-cache`, or a copy in the app's public folder made by its build), and pass that address as `worker`. An alert's payload is JSON: `{ "title", "body", "url", "tag" }`.

## HTML contract

```html
<div class="cap-push">
  <div class="cap-push-note" role="status">Phone alerts are on for this device.</div>   <!-- data-tone="crit" and role="alert" for a failure -->
  <div class="cap-push-actions">
    <button type="button" class="cap-btn" data-variant="primary">Turn on for this device</button>
    <button type="button" class="cap-btn">Send a test alert</button>
  </div>
  <ul class="cap-push-devices" aria-label="Devices with alerts on">
    <li class="cap-push-device">
      <span class="cap-push-device-name">Chrome on Android <span class="cap-push-device-detail">turned on 3 days ago</span></span>
      <button type="button" class="cap-btn">Turn off</button>
    </li>
  </ul>
</div>
```

React: `PushDevices` from `capsomer/react/web-push` takes `publicKey`, `worker`, `scope`, `devices`, `busy`, `note`, `problem`, `onTurnOn(subscription, label)`, `onTurnOff(id)` and `onTest`. `pushSupported()`, `deviceLabel(ua)` and `subscribePush({ worker, scope, publicKey })` are in `capsomer/behavior/web-push`. Load `web-push.css` and `button.css`.

## Exceptions in production

None yet.
