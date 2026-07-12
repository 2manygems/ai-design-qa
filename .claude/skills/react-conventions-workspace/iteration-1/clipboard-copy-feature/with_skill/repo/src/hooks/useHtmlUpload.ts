import { useCallback } from 'react'
import { useAnalysisStore } from '../services/store/analysisStore'

export function useHtmlUpload() {
  const setUploadedHtml = useAnalysisStore((state) => state.setUploadedHtml)

  const uploadFile = useCallback(
    async (file: File) => {
      const html = await file.text()
      setUploadedHtml(html)
    },
    [setUploadedHtml],
  )

  return { uploadFile }
}
