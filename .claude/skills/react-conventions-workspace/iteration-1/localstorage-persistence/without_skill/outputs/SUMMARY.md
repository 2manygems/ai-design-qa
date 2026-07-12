# localStorage Persistence - Summary

## What was built

분석 결과(및 진행 상태)를 새로고침해도 유지되도록, 앱의 유일한 전역 상태 저장소인 Zustand 스토어
(`src/services/store/analysisStore.ts`)에 Zustand의 내장 `persist` 미들웨어를 적용했습니다.

- `create<AnalysisState>()(persist(...))` 형태로 스토어를 감싸고, `zustand/middleware`의
  `persist` + `createJSONStorage(() => localStorage)`를 사용해 `localStorage`에 저장합니다.
- 저장 키: `ai-design-qa/analysis-store`
- `partialize`로 저장 대상을 `uploadedHtml`, `status`, `result`로 한정했습니다.
  - `error`는 새로고침 후에도 남아있을 필요가 없는 일시적 상태이므로 저장하지 않습니다.
  - `status`는 `'done'`이 아니면(`parsing`/`analyzing`/`error` 등 진행 중이거나 일시적인 상태) `'idle'`로
    정규화해서 저장합니다. 분석 도중 새로고침했을 때 어중간한 상태로 복원되는 것을 방지하기 위함입니다.
  - `uploadedHtml`은 상태와 무관하게 항상 저장하여, 업로드만 하고 새로고침해도 미리보기가 유지됩니다.
- 액션 함수(`setUploadedHtml`, `setStatus`, `setResult`, `setError`, `reset`)는 `partialize`에서
  제외되며, zustand persist의 기본 병합 로직(`merge`)이 store 초기화 시 이 함수들을 다시 채워주므로
  별도 처리가 필요 없습니다.

이 스토어는 앱 전체에서 이미 단일 진실 공급원(source of truth)으로 쓰이고 있어(`App.tsx`가
`status === 'done'` 값으로 대시보드/업로드 화면을 전환), 이 지점 하나만 영속화하면 새로고침 시
분석 결과 화면이 그대로 복원됩니다. 별도의 `useEffect` 기반 수동 저장/복원 로직이나 새로운 컴포넌트는
추가하지 않았습니다 - 기존 zustand 컨벤션을 그대로 따르는 가장 단순한 방법을 선택했습니다.

새 의존성은 추가하지 않았습니다 (`zustand@5.0.14`에 `zustand/middleware`의 `persist`/
`createJSONStorage`가 이미 포함되어 있음을 `package-lock.json`에서 확인).

## Where the logic lives

- **`src/services/store/analysisStore.ts`** - 유일하게 수정된 파일. `persist` 미들웨어 설정과
  `partialize` 로직이 전부 여기에 있습니다.

## Files created/modified

- Modified: `src/services/store/analysisStore.ts`
  - `create<AnalysisState>` -> `create<AnalysisState>()(persist(...))`로 변경
  - `zustand/middleware`에서 `persist`, `createJSONStorage` import 추가
  - `localStorage`에 저장하는 `persist` 옵션(`name`, `storage`, `partialize`) 추가
