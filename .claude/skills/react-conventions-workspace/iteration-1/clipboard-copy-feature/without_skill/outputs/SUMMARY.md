# Clipboard Copy Feature — Guideline Violations

## What was built

Dashboard의 "Guideline Violations" 탭(`CssViolationsPanel`)에서 각 위반 항목을 클릭하면
해당 항목의 원본 `targetSelector` 값이 클립보드로 복사되도록 기능을 추가했습니다.
복사가 성공하면 항목 상단에 "Selector 복사됨!" 텍스트가 1.5초간 표시되어 사용자에게
피드백을 줍니다.

## Where the logic lives

- **`src/utils/clipboard.ts`** (new)
  - `copyToClipboard(text: string): Promise<boolean>` — 순수 유틸 함수.
  - 우선 `navigator.clipboard.writeText`(Secure Context에서 표준 Clipboard API)를 시도하고,
    실패하거나 사용 불가한 환경(예: HTTP, 구형 브라우저)에서는 숨겨진 `<textarea>` +
    `document.execCommand('copy')` 방식으로 폴백합니다.
  - 프로젝트 내 다른 DOM 관련 유틸(`src/utils/dom.ts`)과 동일한 위치/스타일 컨벤션을 따름.

- **`src/hooks/useCopyToClipboard.ts`** (new)
  - 재사용 가능한 React 훅. `copy(text, key)` 호출 시 `copyToClipboard`를 실행하고,
    성공하면 `copiedKey` state를 해당 `key`로 설정한 뒤 1.5초 후 자동으로 초기화합니다.
  - 여러 리스트 항목 중 "방금 복사된 항목"이 어느 것인지 구분하기 위해 텍스트가 아닌
    `key`(고유 식별자) 기준으로 상태를 관리합니다.
  - 기존 `src/hooks/useDashboardFilters.ts`와 동일하게 단순 `useState` 기반 훅 패턴을 따름
    (외부 상태관리 라이브러리나 토스트 라이브러리는 프로젝트에 없으므로 추가하지 않음).
  - 언마운트 시 setTimeout을 정리하는 cleanup 포함.

- **`src/components/dashboard/CssViolationsPanel.tsx`** (modified)
  - 기존에는 각 위반 항목이 단순 `<li>` 텍스트였으나, 클릭 가능한 `<button type="button">`으로
    감싸 접근성(키보드 포커스, `title` 툴팁)을 확보했습니다.
  - `onClick`에서 `copy(violation.targetSelector, key)`를 호출하여 원본 selector
    (`violation.targetSelector`)를 그대로 클립보드에 복사합니다.
  - `useCopyToClipboard`의 `copiedKey`를 사용해 방금 클릭한 항목에만 "Selector 복사됨!"
    표시가 나타나도록 처리했습니다.
  - 기존 severity 배지, 메시지, selector/expected/actual 텍스트 레이아웃은 그대로 유지하고
    hover/focus 시 배경색이 살짝 바뀌도록 스타일만 추가했습니다.

## Files created/modified (relative to Repo root)

- `src/utils/clipboard.ts` — created
- `src/hooks/useCopyToClipboard.ts` — created
- `src/components/dashboard/CssViolationsPanel.tsx` — modified
