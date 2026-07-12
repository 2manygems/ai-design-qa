# Badge Component Rule Extension

## What was built

Added recognition of a new `badge` component type to the DOM component extraction
pipeline. Any element whose `class` attribute contains a class name that includes the
substring `badge` (e.g. `badge`, `badge-success`, `my-badge`, `status-badge`) is now
classified as `type: 'badge'` in the extracted components list.

## Where the logic lives

The project follows a rules-based architecture for component classification:
`src/parser/extractComponents.ts` walks the DOM and delegates matching to a list of
`ComponentRule` objects (each with a `type` and a `matches(element)` predicate), defined
individually under `src/parser/rules/`.

- **New rule file**: `src/parser/rules/badge.rule.ts`
  - Exports `badgeRule: ComponentRule` with `type: 'badge'`.
  - `matches` checks `element.classList` for any class name containing the substring
    `'badge'`, using `Array.from(element.classList).some((c) => c.includes('badge'))`.
  - This is a substring match (not an exact class match), per the requirement that
    "class에 'badge'가 포함되면 badge로 분류" (classify as badge if the class *contains*
    'badge'). This intentionally differs from `card.rule.ts`, which uses an exact
    `classList.contains('card')` check, because the task specifically asked for
    substring containment.

- **Registration**: `src/parser/extractComponents.ts`
  - Imported `badgeRule` from `./rules/badge.rule`.
  - Added `badgeRule` to the `rules: ComponentRule[]` array (after `cardRule`), so it
    participates in the same `rules.find((r) => r.matches(element))` lookup used for
    button/input/card.

No changes were needed in `src/types/analysis.ts` since `ExtractedComponent.type` and
`ComponentRule.type` are typed as plain `string`, so no union type update was required.

## Files created/modified (paths relative to repo root)

- `src/parser/rules/badge.rule.ts` — created. New `ComponentRule` for badge detection.
- `src/parser/extractComponents.ts` — modified. Imports and registers `badgeRule` in
  the `rules` array.
