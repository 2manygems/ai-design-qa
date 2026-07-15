import { useCallback } from 'react'
import { parseHtml } from '../parser/parseHtml'
import { extractComponents } from '../parser/extractComponents'
import { extractStrings } from '../parser/extractStrings'
import { extractCss } from '../parser/extractCss'
import { loadGuideline } from '../guideline/loadGuideline'
import { compareGuideline } from '../guideline/compareGuideline'
import { compareWithDesignRules } from '../guideline/designRules/compareWithDesignRules'
import { compareScreens } from '../guideline/designRules/compareScreens'
import { extractScreenComponents } from '../parser/parseMeaXure'
import type { ScreenUpload } from '../types/meaxure'
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
        const qaReport = compareWithDesignRules({ components, css })
        const uxWritingReview = await reviewStrings(strings)

        setResult({
          id: createId('analysis'),
          sourceHtml: html,
          components,
          strings,
          css,
          guidelineViolations,
          qaReport,
          uxWritingReview,
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      }
    },
    [setStatus, setResult, setError],
  )

  const runScreenAnalysis = useCallback(
    (upload: ScreenUpload) => {
      try {
        setStatus('parsing')
        const screenComponents = extractScreenComponents(upload.data)

        setStatus('analyzing')
        const screenQa = compareScreens(screenComponents)

        setResult({
          id: createId('analysis'),
          sourceHtml: upload.fileName,
          components: [],
          strings: [],
          css: [],
          guidelineViolations: [],
          qaReport: screenQa,
          screenQa,
          uxWritingReview: [],
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Screen analysis failed')
      }
    },
    [setStatus, setResult, setError],
  )

  return { runAnalysis, runScreenAnalysis }
}
