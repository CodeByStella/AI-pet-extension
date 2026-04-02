# AI Pet Extension

A Chrome Extension MVP focused on a **decision layer** that interprets browser behavior and produces companion-style decisions (without rendering a pet UI yet).

## Current Scopes

This repository currently contains planning artifacts for the Decision Layer MVP. The implementation goal is to turn low-level browser activity into meaningful user-state and action decisions.

### Included in MVP

- Browser activity tracking
- User state modeling
- Rule-based decisioning with optional scoring
- Decision logging for evaluation

### Out of Scope (for now)

- Pet visuals / animation
- Full UI experience
- Voice interactions
- Complex LLM conversation flows

## Planned Architecture

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

## Core Concept

The system should infer states like:

- `focused_working`
- `multi_tasking`
- `fatigued`
- `idle`
- `returning_after_break`

Then map those states into decisions such as:

- `avoid_interrupting`
- `suggest_break`
- `suggest_refocus`
- `welcome_back`

## Privacy Principles

The MVP is intended to be privacy-respecting:

- Do **not** collect raw typed text
- Do **not** collect password field content
- Avoid sensitive page content collection unless explicitly required and approved

## Implementation Priority

1. Finalize activity inventory
2. Finalize allowed decisions inventory
3. Define state derivation rules
4. Implement collectors
5. Implement state manager
6. Implement decision engine
7. Add logging and evaluation

## Project Docs

- Main plan: `docs/plan.md`

## Status

Planning phase in progress. The next milestone is implementing the first working rules-based decision pipeline.
