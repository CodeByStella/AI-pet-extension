# Extension MVP (Manifest V3)

## Load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

## What is implemented

- Background service worker pipeline:
  - activity collection
  - state derivation
  - rule evaluation
  - decision + signal logging in `chrome.storage.local`
- Content script event capture (`scroll`, `mousemove`, `click`, `keydown`)
- Optional weather context refresh from Open-Meteo every 30 minutes

## Storage keys

- `runtimeState`
- `signalLogs`
- `decisionLogs`
- `weatherLocation` (optional: `{ latitude, longitude }`)

## Notes

This is a rules-first MVP foundation designed for tuning and iteration.
