import { inTimeRange, minutesBetween } from '../utils/time.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

const DEFAULT_STATE = {
  current: 'idle',
  activeTabDurationMinutes: 0,
  tabSwitchCount: 0,
  scrollEvents: 0,
  keyEvents: 0,
  mouseEvents: 0,
  lastIdleState: 'active',
  idleSinceMs: null,
  firstSessionSeenDay: null,
  weather: null,
  weatherFetchedAtMs: null
};

export class StateManager {
  constructor(config = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = { ...DEFAULT_STATE };
  }

  async hydrate() {
    const stored = await chrome.storage.local.get(['runtimeState']);
    if (stored.runtimeState) {
      this.state = { ...DEFAULT_STATE, ...stored.runtimeState };
    }
  }

  async consumeSignal(signal) {
    const now = Date.now();

    switch (signal.type) {
      case 'tab_activated':
        this.state.tabSwitchCount += 1;
        break;
      case 'heartbeat':
        this.state.activeTabDurationMinutes = signal.activeTabDurationMinutes || 0;
        break;
      case 'idle_state':
        this.state.lastIdleState = signal.state;
        if (signal.state !== 'active') {
          this.state.idleSinceMs = now;
        } else {
          this.state.idleSinceMs = null;
        }
        break;
      case 'scroll':
        this.state.scrollEvents += 1;
        break;
      case 'keydown':
        this.state.keyEvents += 1;
        break;
      case 'mousemove':
      case 'click':
        this.state.mouseEvents += 1;
        break;
      case 'weather_updated':
        this.state.weather = signal.weather;
        this.state.weatherFetchedAtMs = now;
        break;
      default:
        break;
    }

    this.deriveCurrentState(now);
    await chrome.storage.local.set({ runtimeState: this.state });
    return this.state;
  }

  deriveCurrentState(nowMs) {
    const date = new Date(nowMs);
    const isMorning = inTimeRange(date, this.config.morningStartHour, this.config.morningEndHour);
    const today = date.toISOString().slice(0, 10);

    const firstSessionOfDay = this.state.firstSessionSeenDay !== today;
    if (firstSessionOfDay) {
      this.state.firstSessionSeenDay = today;
    }

    const idleMinutes = minutesBetween(this.state.idleSinceMs, nowMs);
    const hasSevereWeather = Boolean(this.state.weather?.severeAlert);

    if (hasSevereWeather) {
      this.state.current = 'weather_constrained';
      return;
    }

    if (isMorning && this.config.weatherBriefsEnabled && firstSessionOfDay) {
      this.state.current = 'morning_planning';
      return;
    }

    if (idleMinutes > this.config.idleMinutesThreshold || this.state.lastIdleState !== 'active') {
      this.state.current = 'idle';
      return;
    }

    if (
      this.state.tabSwitchCount >= this.config.multitaskTabSwitchThreshold &&
      this.state.activeTabDurationMinutes < this.config.multitaskShortActiveMinutes
    ) {
      this.state.current = 'multi_tasking';
      return;
    }

    if (
      this.state.activeTabDurationMinutes > this.config.focusedActiveMinutes &&
      this.state.keyEvents > this.config.focusedKeyEventsThreshold
    ) {
      this.state.current = 'focused_working';
      return;
    }

    this.state.current = 'present_but_passive';
  }

  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
}
