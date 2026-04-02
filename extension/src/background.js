import { ActivityCollector } from './activity/collector.js';
import { RulesEngine } from './decision/rulesEngine.js';
import { StateManager } from './state/stateManager.js';
import { appendDecisionLog, appendSignalLog } from './utils/logger.js';
import { CONFIG_KEY, DEFAULT_CONFIG } from './config/defaults.js';

let activeConfig = { ...DEFAULT_CONFIG };
const stateManager = new StateManager(activeConfig);
const rulesEngine = new RulesEngine(activeConfig);
const collector = new ActivityCollector(onSignal);

async function init() {
  await hydrateConfig();
  await stateManager.hydrate();
  await collector.init();

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.channel === 'activity_signal' && msg.signal) {
      collector.ingestContentSignal(msg.signal);
    }
  });

  chrome.alarms.create('weather_refresh', { periodInMinutes: 30 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'weather_refresh') {
      await updateWeather();
    }
  });

  await updateWeather();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[CONFIG_KEY]) return;
    activeConfig = { ...DEFAULT_CONFIG, ...(changes[CONFIG_KEY].newValue || {}) };
    stateManager.setConfig(activeConfig);
    rulesEngine.setConfig(activeConfig);
  });
}

async function onSignal(signal) {
  await appendSignalLog(signal);
  const state = await stateManager.consumeSignal(signal);
  const decision = rulesEngine.evaluate(state);
  await appendDecisionLog({
    signals: summarizeSignals(signal, state),
    ...decision
  });
}

function summarizeSignals(signal, state) {
  return {
    activeTabDurationMinutes: Number((state.activeTabDurationMinutes || 0).toFixed(2)),
    tabSwitchCount: state.tabSwitchCount,
    keyEvents: state.keyEvents,
    mouseEvents: state.mouseEvents,
    scrollEvents: state.scrollEvents,
    signalType: signal.type
  };
}

async function updateWeather() {
  try {
    const { weatherLocation = { latitude: 37.7749, longitude: -122.4194 } } = await chrome.storage.local.get('weatherLocation');
    const weather = await fetchWeather(weatherLocation.latitude, weatherLocation.longitude);
    await onSignal({ type: 'weather_updated', weather, source: 'weather_api' });
  } catch (err) {
    await appendSignalLog({
      type: 'weather_update_failed',
      error: err instanceof Error ? err.message : String(err)
    });
  }
}

async function hydrateConfig() {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  activeConfig = { ...DEFAULT_CONFIG, ...(stored[CONFIG_KEY] || {}) };
  stateManager.setConfig(activeConfig);
  rulesEngine.setConfig(activeConfig);
}

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    timezone: 'auto'
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`weather request failed: ${response.status}`);
  }

  const data = await response.json();
  const weatherCode = data?.current?.weather_code;
  return {
    temperatureC: data?.current?.temperature_2m ?? null,
    weatherCode,
    severeAlert: isSevereWeatherCode(weatherCode)
  };
}

function isSevereWeatherCode(code) {
  if (typeof code !== 'number') return false;
  return [65, 67, 75, 82, 86, 95, 96, 99].includes(code);
}

init();
