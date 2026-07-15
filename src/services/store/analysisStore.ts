import { create } from 'zustand'
import type { AnalysisResult } from '../../types/analysis'
import type { ScreenUpload } from '../../types/meaxure'

export type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'done' | 'error'

interface AnalysisState {
  uploadedHtml: string | null
  screenUpload: ScreenUpload | null
  status: AnalysisStatus
  result: AnalysisResult | null
  error: string | null
  setUploadedHtml: (html: string) => void
  setScreenUpload: (upload: ScreenUpload) => void
  setStatus: (status: AnalysisStatus) => void
  setResult: (result: AnalysisResult) => void
  setError: (error: string) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  uploadedHtml: null,
  screenUpload: null,
  status: 'idle',
  result: null,
  error: null,
  setUploadedHtml: (html) =>
    set({ uploadedHtml: html, screenUpload: null, error: null }),
  setScreenUpload: (upload) =>
    set({ screenUpload: upload, uploadedHtml: null, error: null }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result, status: 'done' }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => {
    // 화면 preview blob URL 해제
    const upload = get().screenUpload
    if (upload) {
      for (const url of Object.values(upload.imageUrls)) URL.revokeObjectURL(url)
    }
    set({
      uploadedHtml: null,
      screenUpload: null,
      status: 'idle',
      result: null,
      error: null,
    })
  },
}))
