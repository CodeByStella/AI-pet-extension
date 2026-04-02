# Extension MVP (Manifest V3)

## Load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Open extension **Details** -> **Extension options** to tune thresholds
6. In extension **Details**:
   - Set **Site access** to **On all sites** (or explicitly add the sites you want)
   - If you need tracking on local files, enable **Allow access to file URLs**

## What is implemented

- Background service worker pipeline:
  - activity collection
  - state derivation
  - rule evaluation
  - decision + signal logging in `chrome.storage.local`
- Content script event capture (`scroll`, `mousemove`, `click`, `keydown`)
- Optional weather context refresh from Open-Meteo every 30 minutes
- Configurable thresholds/cooldowns via `options.html` stored in `chrome.storage.local`

## Storage keys

- `runtimeState`
- `signalLogs`
- `decisionLogs`
- `weatherLocation` (optional: `{ latitude, longitude }`)
- `userConfig` (thresholds and feature toggles)

## Notes

This is a rules-first MVP foundation designed for tuning and iteration.

### Permission-related troubleshooting

- Some pages never allow content scripts (by design), including `chrome://*` pages and the Chrome Web Store.
- If activity signals are missing, double-check extension **Details** -> **Site access** matches where you’re testing.

### Quick smoke test (signals + logs)

1. Go to `chrome://extensions` → your extension → click **service worker** (to open DevTools).
2. Visit a normal webpage (not `chrome://`), scroll/click/type a bit.
3. In the service worker console, run:

```js
await chrome.storage.local.get(['signalLogs', 'decisionLogs', 'runtimeState'])
```

You should see `signalLogs` growing with entries like `page_loaded`, `scroll`, `keydown`, and `decisionLogs` being appended by the rules engine.
