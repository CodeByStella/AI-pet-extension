# Decision Layer MVP - Project Plan

## Objective

Define the full decision layer before implementation:

- Identify all user activities that can be detected in a Chrome Extension
- Identify the decisions that can be produced from those signals
- Convert raw activity into interpretable user state
- Build the engine first, without UI or pet rendering

Goal: prove the system can behave like a context-aware companion through behavior analysis alone.

## Scope (MVP)

### Included

- Activity tracking (browser-level)
- State modeling (user behavior)
- Rule-based + simple AI decision engine
- Decision logging system

### Excluded (later phase)

- UI rendering (no pet yet)
- Animation / 3D
- Voice interaction
- Complex LLM conversations

## System Architecture

```text
[Content Script]
  ↓
[Activity Collector]
  ↓
[State Manager]
  ↓
[Decision Engine]
  ↓
[Decision Output Logger]
```

## Detectable Activities

The first step is to define everything a Chrome Extension can realistically detect for the decision layer.

### 1. Browser Focus and Presence

These signals indicate whether the user is present and engaged with the browser at all.

- Browser window focused or blurred
- Tab currently active
- Time spent on active tab
- Browser idle / locked state via `chrome.idle`
- Return after idle
- Session start and session end

These signals support decisions like:

- `check_presence`
- `welcome_back`
- `pause_interaction`
- `resume_interaction`

### 2. Navigation Activity

These signals show where the user is and how often they change context.

- URL change
- Page load / reload
- Single-page app route changes
- Back / forward navigation patterns
- New tab opened
- Tab closed
- Domain frequency
- Category of current site if classified

These signals support decisions like:

- `detect_context_switch`
- `detect_research_mode`
- `detect_distraction`
- `track_session_theme`

### 3. Tab Management Behavior

These signals reflect multitasking and context switching.

- Tab switching frequency
- Number of open tabs
- Repeated switching between a small set of tabs
- Rapid open/close behavior
- Long stay on one tab versus fragmented browsing
- Window switching if observable from extension context

These signals support decisions like:

- `detect_multi_tasking`
- `detect_focus_mode`
- `detect_overload`
- `suggest_reduce_tabs`

### 4. Mouse Activity

These signals help estimate active engagement versus passive presence.

- Mouse movement frequency
- Mouse movement variance
- Click frequency
- Long periods without movement
- Repeated pointer motion without clicking
- Hover-heavy behavior

These signals support decisions like:

- `detect_active_work`
- `detect_passive_attention`
- `detect_fatigue`
- `detect_inactivity`

### 5. Scroll Activity

These signals help differentiate reading, browsing, and passive consumption.

- Scroll frequency
- Scroll distance
- Scroll speed
- Continuous reading-like slow scrolling
- Fast scanning / jumping behavior
- No scroll on long pages

These signals support decisions like:

- `detect_reading_mode`
- `detect_scanning_mode`
- `detect_passive_consumption`
- `detect_low_engagement`

### 6. Keyboard Activity

These signals are useful when content script permissions allow input observation at a safe, privacy-respecting level.

- Keydown frequency
- Burst typing periods
- Long pauses between typing
- Typing rhythm intensity
- Presence of text input interaction without capturing text content

These signals support decisions like:

- `detect_deep_work`
- `detect_composing_mode`
- `detect_low_energy`
- `detect_focus_break`

### 7. Time Context

These are not direct behaviors, but they strongly affect interpretation of behavior.

- Local time of day
- Day of week
- Session duration
- Continuous work duration
- Time since last break
- Time since browser became active

These signals support decisions like:

- `suggest_break`
- `suggest_sleep`
- `reduce_interruptions`
- `increase_gentle_checkins`

### 8. Page Context Signals

These help infer what type of activity the user is doing on the current page.

- Domain
- URL pattern
- Page title
- Detected site type: docs, video, chat, coding tool, social media, shopping, news
- Media playback presence if detectable
- Form/input presence
- Reading-heavy page versus interaction-heavy page

These signals support decisions like:

- `detect_work_context`
- `detect_learning_context`
- `detect_entertainment_context`
- `detect_social_distraction`

### 9. Engagement Quality Signals

These are derived from combining multiple low-level behaviors.

- Long active duration with low input variance
- High tab switching + short dwell time
- Slow scroll + stable tab + moderate input
- Repeated idle-return cycles
- High activity bursts followed by inactivity

These signals support decisions like:

- `detect_fatigue`
- `detect_restlessness`
- `detect_flow_state`
- `detect_cognitive_overload`

### 10. What Should Not Be Collected

To keep the MVP safe and privacy-respecting, avoid collecting:

- Raw typed text
- Password field content
- Personal message contents
- Full browsing history outside active MVP scope
- Sensitive page contents unless explicitly needed and approved

## Decision Inventory

After defining detectable activities, define the decisions the system is allowed to make.

### 1. Presence Decisions

- `check_presence`
- `welcome_back`
- `pause_behavior`
- `resume_behavior`

### 2. Focus Decisions

- `detect_focus_mode`
- `protect_focus`
- `avoid_interrupting`
- `mark_deep_work`

### 3. Fatigue and Energy Decisions

- `suggest_break`
- `suggest_micro_break`
- `suggest_sleep`
- `detect_low_energy`

### 4. Attention and Distraction Decisions

- `detect_distraction`
- `detect_multi_tasking`
- `detect_context_switch_overload`
- `suggest_refocus`

### 5. Consumption Style Decisions

- `detect_reading_mode`
- `detect_scanning_mode`
- `detect_passive_consumption`
- `detect_active_interaction`

### 6. Work Pattern Decisions

- `detect_research_mode`
- `detect_learning_mode`
- `detect_execution_mode`
- `detect_planning_mode`

### 7. Interaction Strategy Decisions

These are not UI yet, but they define how the future companion should behave.

- `stay_silent`
- `gentle_checkin`
- `supportive_nudge`
- `delay_interruption`
- `increase_attention`
- `lower_attention`

## State Model

Raw activity should be converted into stable, interpretable states.

Example states:

- `idle`
- `present_but_passive`
- `focused_working`
- `reading_deeply`
- `scrolling_passively`
- `multi_tasking`
- `researching`
- `distracted`
- `fatigued`
- `returning_after_break`

Example logic:

```text
if active_tab_duration is high
and tab_switch_rate is low
and keyboard_activity is moderate:
  state = "focused_working"

if idle_time is high:
  state = "idle"

if tab_switch_rate is high
and dwell_time is low:
  state = "multi_tasking"
```

Storage:

- In-memory runtime state
- `chrome.storage.local` for recent history and derived summaries

## Decision Engine

This is the core of the MVP.

### Rule-Based First

Start with deterministic rules so behavior is understandable and debuggable.

Example rules:

```text
IF state == "fatigued"
THEN decision = "suggest_break"

IF state == "idle"
THEN decision = "check_presence"

IF state == "focused_working"
THEN decision = "avoid_interrupting"

IF state == "multi_tasking"
THEN decision = "suggest_refocus"
```

### Scoring Layer Next

After rules work, add weighted scoring for smoother decision quality.

```text
fatigue_score =
  (long_active_duration * 0.4) +
  (low_input_variance * 0.3) +
  (repeated_context_switching * 0.3)

if fatigue_score > threshold:
  decision = "suggest_break"
```

### Optional LLM Assist Later

Later, the system can pass a compact state summary into a local or API-based model.

Input:

```text
User state summary JSON
```

Output:

```text
Decision label
```

## Decision Output Logger

Store all decisions for evaluation.

Format:

```json
{
  "timestamp": "...",
  "signals": {
    "activeTabDuration": 4200,
    "tabSwitchRate": 0.12,
    "scrollRate": 0.44
  },
  "state": "fatigued",
  "decision": "suggest_break",
  "confidence": 0.82
}
```

Purpose:

- Debugging
- Behavior tuning
- Future model training
- Validating whether decisions match real behavior

## Folder Structure

```text
/extension
  /src
    content.js
    background.js
    activity/
      collector.js
    state/
      stateManager.js
    decision/
      rulesEngine.js
      scorer.js
    utils/
      time.js
      logger.js
  manifest.json
```

## Tech Stack

- Chrome Extension (Manifest V3)
- Vanilla JS or TypeScript
- Optional:
  - Zustand for state handling
  - RxJS for event stream handling

## Testing Strategy

### Manual Testing

- Work 1+ hour -> expect fatigue detection
- Leave idle -> detect inactivity
- Rapid tab switching -> detect multitasking

### Metrics

- Decision accuracy (subjective)
- False positives
- CPU usage

## Success Criteria

You succeed if:

- The system generates meaningful decisions
- Decisions feel human-like / helpful
- Logs show consistent behavioral patterns

## Key Insight

Right now you are not building:

> "a pet"

You are building:

> a behavioral intelligence engine

If this layer is strong, everything else (pet, UI, voice) becomes easy.

## Immediate Build Priority

Implementation should begin in this order:

1. Finalize the full activity inventory
2. Finalize the allowed decision inventory
3. Define state derivation rules
4. Implement collectors
5. Implement state manager
6. Implement decision engine
7. Add logging and evaluation
