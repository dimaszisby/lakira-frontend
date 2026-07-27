# Component Review Scorecard (Portfolio Standard)

Use this scorecard in PR reviews for any new or heavily changed UI component.

Scoring:

- `0` = not met
- `1` = partially met
- `2` = fully met

Passing threshold:

- `>= 16 / 20` and no critical accessibility failure.

---

## 1. API and Architecture (0-2)

- Clear prop contract and naming.
- Controlled/uncontrolled behavior is explicit.
- No feature-coupled leakage into primitive design.

Score: `__ / 2`

## 2. Semantic and A11y Baseline (0-2)

- Correct semantic element/role.
- Accessible name present.
- Core ARIA/state attributes correct.

Score: `__ / 2`

## 3. Keyboard and Focus Behavior (0-2)

- Keyboard interaction works for all actions.
- Focus-visible states are clear.
- Focus transfer/restore works where needed.

Score: `__ / 2`

## 4. Styling System Integrity (0-2)

- Uses semantic tokens, not hard-coded visual values.
- Variant and size styling are scalable.
- No dynamic Tailwind-class pitfalls.

Score: `__ / 2`

## 5. State Completeness (0-2)

- Supports and styles required states (default/hover/active/focus/disabled).
- Loading/error/empty states handled where relevant.

Score: `__ / 2`

## 6. Testing Quality (0-2)

- User-centric behavior tests exist.
- Edge cases covered.
- Tests assert semantics, not internal markup details.

Score: `__ / 2`

## 7. Performance Discipline (0-2)

- Client boundary is justified.
- No heavy dependency leakage into primitives.
- Avoids unnecessary re-renders and effects.

Score: `__ / 2`

## 8. Reusability and Extensibility (0-2)

- API is reusable beyond current screen.
- Composition points (slots/addons) are intentional and limited.
- Future variants can be added safely.

Score: `__ / 2`

## 9. Documentation and Discoverability (0-2)

- Usage examples included in PR or docs.
- Known constraints/tradeoffs documented.
- Deprecation/migration notes added when replacing old patterns.

Score: `__ / 2`

## 10. Code Quality and Readability (0-2)

- Logic is easy to follow.
- No dead props/unused branches.
- Naming and structure match project conventions.

Score: `__ / 2`

---

## Final Score

- Total: `__ / 20`
- Result: `PASS` / `REWORK`

---

## Critical Failure Conditions (Auto-Rework)

Any of these triggers mandatory rework regardless of score:

1. Missing accessible name for interactive control.
2. Keyboard-only user cannot complete primary interaction.
3. Focus style is invisible or broken.
4. Component introduces hard-coded palette values in shared primitive without rationale.
5. Required tests are missing for core behavior.
