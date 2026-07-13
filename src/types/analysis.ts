import type { GuidelineViolation } from './guideline'
import type { QaReport } from './qa'

export interface ExtractedComponent {
  id: string
  type: string
  tagName: string
  selector: string
  attributes: Record<string, string>
  children?: ExtractedComponent[]
}

export interface ComponentRule {
  type: string
  matches: (element: Element) => boolean
}

export type StringSource =
  | 'textContent'
  | 'placeholder'
  | 'alt'
  | 'aria-label'
  | 'title'

export interface ExtractedString {
  id: string
  text: string
  source: StringSource
  componentId?: string
  selector: string
}

export type CssOrigin = 'inline' | 'style-tag' | 'stylesheet'

export interface ExtractedCssRule {
  selector: string
  properties: Record<string, string>
  origin: CssOrigin
}

export interface UxWritingIssue {
  type: string
  comment: string
  suggestion?: string
}

export interface UxWritingFeedback {
  stringId: string
  originalText: string
  issues: UxWritingIssue[]
  score?: number
}

export interface AnalysisResult {
  id: string
  sourceHtml: string
  components: ExtractedComponent[]
  strings: ExtractedString[]
  css: ExtractedCssRule[]
  guidelineViolations: GuidelineViolation[]
  qaReport: QaReport
  uxWritingReview: UxWritingFeedback[]
  createdAt: string
}
