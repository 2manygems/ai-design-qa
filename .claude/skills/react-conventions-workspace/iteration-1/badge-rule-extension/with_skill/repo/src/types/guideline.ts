import type { Severity } from './common'
import type { ExtractedComponent, ExtractedCssRule } from './analysis'

export interface DesignGuideline {
  colors: { name: string; value: string }[]
  typography: {
    name: string
    fontSize: string
    fontWeight: number
    lineHeight: string
  }[]
  spacing: number[]
  componentRules?: {
    type: string
    requiredAttributes?: string[]
    allowedClasses?: string[]
  }[]
}

export interface GuidelineViolation {
  ruleId: string
  severity: Severity
  message: string
  targetSelector: string
  expected: string
  actual: string
}

export interface GuidelineRule {
  ruleId: string
  check: (
    input: { components: ExtractedComponent[]; css: ExtractedCssRule[] },
    guideline: DesignGuideline,
  ) => GuidelineViolation[]
}
