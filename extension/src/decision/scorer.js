import { DEFAULT_CONFIG } from '../config/defaults.js';

export function computeFatigueScore(state, config = DEFAULT_CONFIG) {
  const longActive = Math.min(1, state.activeTabDurationMinutes / config.fatigueLongActiveCapMinutes);
  const lowInputVariance =
    state.keyEvents < config.fatigueLowKeyThreshold &&
    state.mouseEvents < config.fatigueLowMouseThreshold
      ? 1
      : 0;
  const repeatedSwitching = Math.min(1, state.tabSwitchCount / config.fatigueSwitchCap);

  return (longActive * 0.4) + (lowInputVariance * 0.3) + (repeatedSwitching * 0.3);
}
