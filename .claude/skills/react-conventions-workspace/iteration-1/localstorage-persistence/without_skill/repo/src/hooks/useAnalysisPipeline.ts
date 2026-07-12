import { useCallback } from 'react'
import { parseHtml } from '../parser/parseHtml'
import { extractComponents } from '../parser/extractComponents'
import { extractStrings } from '../parser/extractStrings'
import { extractCss } from '../parser/extractCss'
import { loadGuideline } from '../guideline/loadGuideline'
import { compareGuideline } from '../guideline/compareGuideline'
import { reviewStrings } from '../review/reviewStrings'
import { createId } from '../utils/format'
import { useAnalysisStore } from '../services/store/analysisStore'

export function useAnalysisPipeline() {
  const setStatus = useAnalysisStore((state) => state.setStatus)
  const setResult = useAnalysisStore((state) => state.setResult)
  const setError = useAnalysisStore((state) => state.setError)

  const runAnalysis = useCallback(
    async (html: string) => {
      try {
        setStatus('parsing')
        const doc = parseHtml(html)
        const components = extractComponents(doc)
        const strings = extractStrings(doc)
        const css = extractCss(doc)

        setStatus('analyzing')
        const guideline = loadGuideline()
        const guidelineViolations = compareGuideline({ components, css }, guideline)
        const uxWritingReview = await reviewStrings(strings)

        setResult({
          id: createId('analysis'),
          sourceHtml: html,
          components,
          strings,
          css,
          guidelineViolations,
          uxWritingReview,
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      }
    },
    [setStatus, setResult, setError],
  )

  return { runAnalysis }
}
