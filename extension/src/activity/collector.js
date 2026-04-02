import { nowIso } from '../utils/time.js';

export class ActivityCollector {
  constructor(onSignal) {
    this.onSignal = onSignal;
    this.activeTabId = null;
    this.activeTabSince = null;
    this.lastUserEventAt = Date.now();
    this.lastWindowFocused = true;
  }

  async init() {
    await this.captureCurrentTab();

    chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
      const tab = await chrome.tabs.get(tabId);
      this.handleSignal({
        type: 'tab_activated',
        tabId,
        windowId,
        url: tab.url,
        title: tab.title
      });
      this.switchActiveTab(tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url || changeInfo.status === 'complete') {
        this.handleSignal({
          type: 'tab_updated',
          tabId,
          url: tab.url,
          title: tab.title,
          status: changeInfo.status || 'unknown'
        });
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleSignal({ type: 'tab_closed', tabId });
      if (this.activeTabId === tabId) {
        this.activeTabId = null;
        this.activeTabSince = null;
      }
    });

    chrome.windows.onFocusChanged.addListener((windowId) => {
      const focused = windowId !== chrome.windows.WINDOW_ID_NONE;
      this.lastWindowFocused = focused;
      this.handleSignal({ type: focused ? 'window_focused' : 'window_blurred', windowId });
    });

    chrome.idle.onStateChanged.addListener((state) => {
      this.handleSignal({ type: 'idle_state', state });
    });

    chrome.alarms.create('session_heartbeat', { periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name !== 'session_heartbeat') return;
      this.handleSignal({
        type: 'heartbeat',
        activeTabId: this.activeTabId,
        activeTabDurationMinutes: this.getActiveTabDurationMinutes(),
        minutesSinceUserEvent: (Date.now() - this.lastUserEventAt) / 60000,
        focused: this.lastWindowFocused
      });
    });
  }

  ingestContentSignal(signal) {
    this.lastUserEventAt = Date.now();
    this.handleSignal({ ...signal, source: 'content_script' });
  }

  getActiveTabDurationMinutes() {
    if (!this.activeTabSince) return 0;
    return (Date.now() - this.activeTabSince) / 60000;
  }

  switchActiveTab(tabId) {
    this.activeTabId = tabId;
    this.activeTabSince = Date.now();
  }

  async captureCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return;

    const tab = tabs[0];
    this.switchActiveTab(tab.id);
    this.handleSignal({
      type: 'session_start',
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      at: nowIso()
    });
  }

  handleSignal(signal) {
    this.onSignal({ timestamp: nowIso(), ...signal });
  }
}
