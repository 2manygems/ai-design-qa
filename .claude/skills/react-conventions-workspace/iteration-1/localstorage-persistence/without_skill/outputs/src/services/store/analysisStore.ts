import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AnalysisResult } from '../../types/analysis'

export type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'done' | 'error'

interface AnalysisState {
  uploadedHtml: string | null
  status: AnalysisStatus
  result: AnalysisResult | null
  error: string | null
  setUploadedHtml: (html: string) => void
  setStatus: (status: AnalysisStatus) => void
  setResult: (result: AnalysisResult) => void
  setError: (error: string) => void
  reset: () => void
}

const ANALYSIS_STORAGE_KEY = 'ai-design-qa/analysis-store'

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      uploadedHtml: null,
      status: 'idle',
      result: null,
      error: null,
      setUploadedHtml: (html) => set({ uploadedHtml: html }),
      setStatus: (status) => set({ status }),
      setResult: (result) => set({ result, status: 'done' }),
      setError: (error) => set({ error, status: 'error' }),
      reset: () =>
        set({ uploadedHtml: null, status: 'idle', result: null, error: null }),
    }),
    {
      name: ANALYSIS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // 진행 중 상태(parsing/analyzing)나 일시적 에러는 새로고침 후 유지할 필요가 없으므로 제외한다.
      partialize: (state) => ({
        uploadedHtml: state.uploadedHtml,
        status: state.status === 'done' ? 'done' : 'idle',
        result: state.result,
      }),
    },
  ),
)
