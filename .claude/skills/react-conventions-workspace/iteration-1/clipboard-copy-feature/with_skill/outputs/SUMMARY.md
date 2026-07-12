# Summary: Guideline Violation selector 클립보드 복사 기능

## What was built

Dashboard의 "Guideline Violations" 탭(`CssViolationsPanel`)에서 각 위반 항목을
클릭하면 해당 항목의 원본 selector(`GuidelineViolation.targetSelector`)를
클립보드에 복사하는 기능을 추가했습니다.

- 각 리스트 항목(`<li>`)의 콘텐츠를 클릭 가능한 `<button type="button">`으로
  감싸서 클릭 시 `handleCopySelector`가 실행되고, 해당 violation의
  `targetSelector`가 클립보드로 복사됩니다.
- 복사 성공 시 항목 하단에 "복사됨!" 피드백 문구가 1.5초간 표시된 뒤 원래
  안내 문구("클릭하여 selector 복사")로 되돌아갑니다.
- 클립보드 API 자체는 재사용 가능한 순수 유틸 함수로 분리했습니다.

## Where each piece of logic lives, and why

- **`src/utils/clipboard.ts`** (신규)
  - `copyToClipboard(text): Promise<boolean>` — DOM/브라우저 API를 다루지만
    특정 도메인 지식(가이드라인, selector 등)이 전혀 없는 순수 헬퍼이므로
    스킬의 배치 가이드 표에서 "Is a pure helper with no domain meaning
    (string/DOM utils) → `utils/`"에 해당합니다.
  - `navigator.clipboard.writeText`를 우선 시도하고, 보안 컨텍스트가 아니거나
    API가 없는 환경(구형 브라우저 등)에서는 `document.execCommand('copy')`
    기반의 legacy textarea 방식으로 폴백하도록 구현해 견고성을 높였습니다.
  - 다른 패널(예: `StringsPanel`, `ComponentsPanel`)도 이미 selector를
    표시하고 있어 향후 동일한 복사 기능이 필요해지면 이 유틸을 그대로
    재사용할 수 있습니다.

- **`src/components/dashboard/CssViolationsPanel.tsx`** (수정)
  - 클릭 핸들러(`handleCopySelector`)와 "지금 복사된 항목이 어느 index인지"
    상태(`copiedIndex`)는 이 컴포넌트에만 필요한 순수 UI 상태이므로
    `useState`로 로컬에 두었습니다. 스킬의 상태 관리 가이드에 따르면
    Zustand 스토어(`analysisStore`)는 "cross-feature or global state"를 위한
    것이고, 복사 피드백처럼 한 컴포넌트 내부에서만 쓰이는 일시적 UI 상태를
    전역 스토어에 넣는 것은 과한 설계이기 때문입니다.
  - 기존 `GuidelineViolation` 타입에 이미 `targetSelector` 필드가 있었으므로
    새로운 타입을 추가하지 않았습니다(스킬의 "types-first" / 기존 타입을
    먼저 확인하라는 원칙).
  - 스타일은 기존 Tailwind 유틸리티 클래스 패턴을 그대로 따랐고(별도 CSS나
    inline style 없음), 항목 전체를 감싸는 `<button>`에 hover/focus-visible
    상태를 추가해 클릭 가능함을 시각적으로 드러냈습니다.
  - `import type { GuidelineViolation }`처럼 타입 전용 import는 그대로
    유지하여 `verbatimModuleSyntax` 요구사항을 만족합니다.
  - 기존 마크업(뱃지, 메시지, selector/expected/actual 텍스트)은 그대로
    두고 클릭/피드백 로직만 추가했으므로 변경 범위를 최소화했습니다.

## Files created / modified (relative to Repo root)

- `src/utils/clipboard.ts` — **신규 생성**. 클립보드 복사 유틸(`copyToClipboard`),
  Clipboard API + legacy fallback 지원.
- `src/components/dashboard/CssViolationsPanel.tsx` — **수정**. 각 위반 항목을
  클릭 가능한 버튼으로 변경하고, 클릭 시 `targetSelector`를 클립보드에 복사한
  뒤 "복사됨!" 피드백을 잠시 보여주는 로직 추가.

두 파일 모두 `outputs/` 아래 동일한 상대 경로로 복사되어 있습니다:

- `outputs/src/utils/clipboard.ts`
- `outputs/src/components/dashboard/CssViolationsPanel.tsx`
