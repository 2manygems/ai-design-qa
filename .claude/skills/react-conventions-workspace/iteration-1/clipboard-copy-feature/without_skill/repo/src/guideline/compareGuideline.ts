import type { ExtractedComponent, ExtractedCssRule } from '../types/analysis'
import type {
  DesignGuideline,
  GuidelineRule,
  GuidelineViolation,
} from '../types/guideline'
import { colorRule } from './rules/color.rule'
import { typographyRule } from './rules/typography.rule'
import { spacingRule } from './rules/spacing.rule'

const rules: GuidelineRule[] = [colorRule, typographyRule, spacingRule]

export function compareGuideline(
  input: { components: ExtractedComponent[]; css: ExtractedCssRule[] },
  guideline: DesignGuideline,
): GuidelineViolation[] {
  return rules.flatMap((rule) => rule.check(input, guideline))
}
