---
name: react-conventions
description: This project's (AI Design QA) React/TypeScript architecture conventions — where new logic and components belong, how the rules/ extension pattern works, import/export style, styling, and state management. Use this whenever you write, add, or refactor any React component, hook, util, or pipeline module in this repo, and whenever you review or clean up existing frontend code here. Trigger even when the user doesn't say "convention" or "guideline" explicitly — e.g. "버튼 컴포넌트 만들어줘", "이 로직 훅으로 빼줘", "이거 어디에 넣어야 돼?", "코드 리뷰해줘", "새 추출 규칙 추가해줘" all qualify.
---

# React Conventions (AI Design QA)

This skill encodes the architecture this project settled on. The goal isn't
rules for their own sake — it's keeping the codebase predictable enough that
adding feature #50 is as easy as adding feature #5. Read the "why" behind
each pattern, not just the "what," so you can extend it sensibly when a new
situation doesn't fit neatly.

## Quick placement guide

Before writing code, decide where it lives. Ask these in order:

| The code... | Goes in... |
|---|---|
| Defines a shared type/contract used across modules | `types/` |
| Talks to the DOM/parses HTML, has no React dependency | `parser/` |
| Compares extracted data against the design guideline | `guideline/` |
| Calls the AI reviewer / builds its prompt | `review/` |
| Is a pure helper with no domain meaning (string/DOM utils) | `utils/` |
| Wraps React state/lifecycle around domain logic | `hooks/` |
| Calls an external API or holds global (Zustand) state | `services/api` or `services/store` |
| Renders reusable UI, no page-specific wiring | `components/` (in a feature subfolder, e.g. `components/dashboard/`) |
| Composes components into a full screen/route | `pages/` |

If a new concern doesn't fit any row, that's a signal to talk it through
rather than force it into the nearest folder — this table should stay
accurate, not get stretched.

## The `rules/` extension pattern

When a module needs to grow by adding independent, swappable checks —
"is this element a button," "does this color match the guideline" — don't
add another `if/else` branch to one growing function. Instead:

1. Define a shared interface once (see `ComponentRule` in `src/types/analysis.ts`,
   `GuidelineRule` in `src/types/guideline.ts`).
2. Add one file per rule in a `rules/` subfolder (e.g. `src/parser/rules/button.rule.ts`).
3. Register the new rule in the array in the orchestrating file
   (e.g. `src/parser/extractComponents.ts`).

This means adding rule #10 never requires touching rules #1-9, and each rule
is independently readable and testable. Use this pattern for `parser/rules/`
and `guideline/rules/` today, and reach for it again if `review/` grows
multiple independent check types.

## Types-first

Before writing logic, check `types/analysis.ts`, `types/guideline.ts`, and
`types/common.ts` for the shape you need — extend them there rather than
inlining a shape inside a component or function. Every pipeline stage
(`parser` → `guideline` → `review` → `hooks/useAnalysisPipeline.ts`) is glued
together purely by these shared types, so changing a type in one place is how
you propagate a change through the whole pipeline safely.

## Import style: `verbatimModuleSyntax`

`tsconfig.app.json` has `verbatimModuleSyntax: true`. This means:

- If an import is only used as a type, it must say `import type { X } from '...'`.
- Don't mix a type-only name into a value import from the same module without
  the `type` keyword — split them into two import statements instead.

This isn't stylistic pickiness — with `verbatimModuleSyntax` on, getting this
wrong is a build error, not a lint warning.

## Export style

Prefer **named exports** for components, hooks, and functions. The only
default exports in this codebase are page-level components already wired
into `App.tsx` (`pages/UploadPage.tsx`, `pages/DashboardPage.tsx`) — that's
the one place a 1:1 file-to-default-export mapping is useful for routing.
Everywhere else, named exports keep renames/refactors safe under IDE tooling
and keep call-sites unambiguous about what they're importing.

## Styling: Tailwind only

Use Tailwind utility classes directly in JSX. Don't add CSS modules,
styled-components, or `style={{ ... }}` objects — `src/index.css` should stay
a single `@import "tailwindcss"` line. Keeping styling in one system means
you can grep for any visual rule instead of hunting across CSS files.

## State management

- **Local, component-only state** → `useState`/`useReducer` inside the
  component, same as any React app.
- **Cross-feature or global state** (anything more than one page/component
  needs) → extend `src/services/store/analysisStore.ts` (Zustand). Don't
  introduce React Context or a second store for state that already has a
  natural home in the existing store — add a field/action to it instead.

## Don't break existing code

- Before adding something new, check whether an existing type or module
  already covers part of it (see the placement table and types-first section
  above) — extend it rather than duplicating logic nearby.
- When editing an existing file, change only the lines that need to change —
  don't rewrite the whole file. This keeps diffs reviewable and avoids
  accidentally reverting unrelated work.
- If a change affects a function signature that other modules depend on
  (especially anything called from `hooks/useAnalysisPipeline.ts`), update
  every call site in the same change rather than leaving the pipeline
  half-migrated.

## Review checklist

When reviewing or refactoring React/TS code in this repo, walk through:

- [ ] Is this logic in the folder the placement table points to?
- [ ] Are shared shapes defined in `types/`, not inlined ad hoc?
- [ ] Do type-only imports use `import type`?
- [ ] Are exports named, except for page-level default exports?
- [ ] No new CSS files, styled-components, or inline `style` objects?
- [ ] Does cross-cutting state go through the Zustand store instead of prop
      drilling or a new Context?
- [ ] If this is a new "kind of check" (extraction rule, guideline rule),
      does it follow the `rules/` pattern instead of a growing conditional?
