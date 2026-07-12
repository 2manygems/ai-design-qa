# Summary: Persist analysis results to localStorage

## What was built

The analysis result (and the state needed to correctly show the dashboard
vs. upload screen) is now persisted to `localStorage`, so refreshing the
page keeps the user on the dashboard with their last analysis instead of
bouncing back to the empty upload screen.

This was done by wrapping the existing Zustand store in Zustand's built-in
`persist` middleware (`zustand/middleware`, already available since the
project depends on `zustand@^5.0.14`), rather than introducing a new
mechanism (custom `localStorage.getItem/setItem` calls, a new hook, or a
new Context).

### Behavior
- `uploadedHtml`, `status` (collapsed to `'done'` or `'idle'` -- see below),
  and `result` are persisted under the localStorage key
  `ai-design-qa/analysis-store`.
- `error` and the action functions are intentionally **not** persisted:
  - `error` is transient/session-only -- showing a stale error after reload
    would be misleading.
  - Action functions can't be (and don't need to be) serialized; Zustand's
    `persist` merges the fresh in-memory functions back in on rehydration
    automatically.
- `status` is narrowed through `partialize` so that only a completed
  (`'done'`) run survives a refresh. Transient statuses (`'parsing'`,
  `'analyzing'`, `'error'`) collapse to `'idle'` on save, since those states
  describe an in-flight process that can't meaningfully resume after a page
  reload -- persisting `'parsing'` verbatim would strand the UI showing a
  spinner forever with no pipeline actually running.
- `App.tsx` already branches purely on `status === 'done'` vs. else, and
  `DashboardPage.tsx` already reads `result` from the store, so no changes
  were needed in either -- they pick up persisted state automatically on
  the next mount.

## Where the logic was placed, and why

Per the skill's placement table: "Calls an external API or holds global
(Zustand) state -> `services/api` or `services/store`." Persistence of
global state is a concern of the store that owns that state, not a
separate layer -- so the change lives entirely inside the existing file:

- `src/services/store/analysisStore.ts` -- wrapped the existing
  `create<AnalysisState>()` call with `persist(...)` from
  `zustand/middleware`, and added a `partialize` option to control exactly
  what gets written to `localStorage`.

This also follows the skill's "Don't break existing code" guidance:
- No new store, Context, or persistence utility was introduced -- the
  existing store was extended in place, per "extend it rather than
  introduce a new Context/second store."
- Only the lines that needed to change were touched (the `create` call
  signature and its options); the state shape, action names, and every
  call site (`UploadPage.tsx`, `DashboardPage.tsx`, `useHtmlUpload.ts`,
  `useAnalysisPipeline.ts`, `App.tsx`) were left untouched because the
  public store API (`AnalysisState`) didn't change at all -- only *how* the
  store is created changed.
- Named export (`useAnalysisStore`) is preserved unchanged.
- Import style respects `verbatimModuleSyntax`: the type-only import
  (`AnalysisResult`) stays as `import type`, while `persist` (a value) is
  a separate plain `import`.

## Files created/modified

- **Modified**: `src/services/store/analysisStore.ts`
  - Added `import { persist } from 'zustand/middleware'`.
  - Wrapped the store creator in `persist(...)` with
    `name: 'ai-design-qa/analysis-store'` and a `partialize` function that
    saves `uploadedHtml`, a collapsed `status`, and `result` to
    localStorage.

No other files required changes -- the rest of the pipeline (`UploadPage`,
`DashboardPage`, `App.tsx`, `useAnalysisPipeline`, `useHtmlUpload`) already
reads/writes exclusively through the `useAnalysisStore` hook's public API,
so persistence is transparent to them.
