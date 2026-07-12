# Summary: Add `badge` component extraction rule

## What was built

Added recognition for a new `badge` component type to the extraction
pipeline: any DOM element whose `class` list contains `badge` is now
classified as `type: 'badge'` in `ExtractedComponent[]`.

## Where the logic lives, and why

This project uses the `rules/` extension pattern documented in the
react-conventions skill: independent, swappable checks (`is this element a
button`, `is this element a card`, etc.) each get their own file in
`src/parser/rules/`, registered in the `rules` array inside
`src/parser/extractComponents.ts`, rather than adding another branch to a
growing conditional.

- **`src/parser/rules/badge.rule.ts`** (new) - defines `badgeRule: ComponentRule`,
  matching elements via `element.classList.contains('badge')`. This mirrors
  the existing `cardRule` in `card.rule.ts`, which uses the identical
  `classList.contains('card')` check - the new rule follows that established
  precedent exactly, one rule per file, independently readable/testable.
- **`src/parser/extractComponents.ts`** (modified) - imported `badgeRule` and
  added it to the `rules: ComponentRule[]` array so it participates in the
  same `rules.find((r) => r.matches(element))` dispatch used for all other
  component types. Only the import block and the `rules` array line were
  changed; no other lines were touched, per the "change only what needs to
  change" guidance.

No changes were needed to `src/types/analysis.ts` - `ComponentRule.type` is
already a plain `string`, so `'badge'` fits the existing contract without
widening any type or union.

## Files created/modified

- `src/parser/rules/badge.rule.ts` - created
- `src/parser/extractComponents.ts` - modified (added import + array entry for `badgeRule`)
