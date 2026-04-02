import { getDayKey } from '../utils/time.js';
import { computeFatigueScore } from './scorer.js';

export class RulesEngine {
  constructor() {
    this.cooldowns = new Map();
    this.lastDecisionDay = new Map();
  }

  evaluate(state) {
    if (state.current === 'weather_constrained') {
      return this.makeDecision('weather_alert_checkin', 'weather_alert_v1', state, 0.9);
    }

    if (state.current === 'morning_planning' && this.oncePerDay('morning_weather_brief')) {
      const weatherAgeMin = state.weatherFetchedAtMs ? (Date.now() - state.weatherFetchedAtMs) / 60000 : Infinity;
      if (weatherAgeMin < 30) {
        return this.makeDecision('morning_weather_brief', 'morning_weather_v1', state, 0.92);
      }
    }

    if (state.current === 'multi_tasking' && this.checkCooldown('suggest_refocus', 15)) {
      return this.makeDecision('suggest_refocus', 'refocus_v1', state, 0.75);
    }

    const fatigue = computeFatigueScore(state);
    if (fatigue > 0.72 && this.checkCooldown('suggest_break', 45)) {
      return this.makeDecision('suggest_break', 'fatigue_break_v1', state, fatigue);
    }

    if (state.current === 'focused_working') {
      return this.makeDecision('avoid_interrupting', 'focus_guard_v1', state, 0.85);
    }

    return this.makeDecision('stay_silent', 'default_silent_v1', state, 0.6);
  }

  makeDecision(decision, ruleId, state, confidence) {
    return {
      decision,
      state: state.current,
      confidence: Number(confidence.toFixed(2)),
      trigger: 'rule_based',
      ruleId,
      cooldownApplied: decision !== 'stay_silent'
    };
  }

  checkCooldown(key, minutes) {
    const now = Date.now();
    const last = this.cooldowns.get(key);
    if (!last || now - last > minutes * 60000) {
      this.cooldowns.set(key, now);
      return true;
    }
    return false;
  }

  oncePerDay(key) {
    const day = getDayKey();
    const last = this.lastDecisionDay.get(key);
    if (last === day) return false;
    this.lastDecisionDay.set(key, day);
    return true;
  }
}
