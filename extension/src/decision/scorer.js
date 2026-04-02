export function computeFatigueScore(state) {
  const longActive = Math.min(1, state.activeTabDurationMinutes / 120);
  const lowInputVariance = state.keyEvents < 5 && state.mouseEvents < 20 ? 1 : 0;
  const repeatedSwitching = Math.min(1, state.tabSwitchCount / 20);

  return (longActive * 0.4) + (lowInputVariance * 0.3) + (repeatedSwitching * 0.3);
}
