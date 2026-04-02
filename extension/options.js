import { CONFIG_KEY, DEFAULT_CONFIG } from './src/config/defaults.js';

const FIELDS = [
  'idleMinutesThreshold',
  'multitaskTabSwitchThreshold',
  'multitaskShortActiveMinutes',
  'focusedActiveMinutes',
  'focusedKeyEventsThreshold',
  'morningStartHour',
  'morningEndHour',
  'weatherDataMaxAgeMinutes',
  'suggestRefocusCooldownMinutes',
  'suggestBreakCooldownMinutes',
  'fatigueThreshold',
  'weatherBriefsEnabled'
];

const form = document.getElementById('config-form');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');

init();

async function init() {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  const config = { ...DEFAULT_CONFIG, ...(stored[CONFIG_KEY] || {}) };
  setFormValues(config);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const config = getFormValues();
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
  setStatus('Saved settings.');
});

resetBtn.addEventListener('click', async () => {
  setFormValues(DEFAULT_CONFIG);
  await chrome.storage.local.set({ [CONFIG_KEY]: DEFAULT_CONFIG });
  setStatus('Reset to defaults.');
});

function setFormValues(config) {
  for (const key of FIELDS) {
    const input = document.getElementById(key);
    if (!input) continue;

    if (input.type === 'checkbox') {
      input.checked = Boolean(config[key]);
    } else {
      input.value = config[key];
    }
  }
}

function getFormValues() {
  const values = {};

  for (const key of FIELDS) {
    const input = document.getElementById(key);
    if (!input) continue;

    if (input.type === 'checkbox') {
      values[key] = input.checked;
    } else {
      values[key] = Number(input.value);
    }
  }

  return values;
}

function setStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    if (statusEl.textContent === message) {
      statusEl.textContent = '';
    }
  }, 1500);
}
