---
name: web-push
title: Phone alerts
summary: Turn Web Push on for this browser, see the devices that have it and turn one off, and send a test alert.
group: pattern
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through Turn on, Send a test alert, then each device's Turn off |
| Enter, Space | Presses the button |

- A failure is an alert; a result is a status, so it is read when it changes.
- The device list is a named list.
- Buttons wait (disabled) while a request is in flight.
