import { nowIso } from './time.js';

const MAX_LOG_ENTRIES = 500;

export async function appendDecisionLog(entry) {
  const payload = {
    timestamp: nowIso(),
    ...entry
  };

  const { decisionLogs = [] } = await chrome.storage.local.get('decisionLogs');
  const next = [...decisionLogs, payload].slice(-MAX_LOG_ENTRIES);
  await chrome.storage.local.set({ decisionLogs: next });
  return payload;
}

export async function appendSignalLog(signal) {
  const payload = {
    timestamp: nowIso(),
    ...signal
  };

  const { signalLogs = [] } = await chrome.storage.local.get('signalLogs');
  const next = [...signalLogs, payload].slice(-MAX_LOG_ENTRIES);
  await chrome.storage.local.set({ signalLogs: next });
  return payload;
}
