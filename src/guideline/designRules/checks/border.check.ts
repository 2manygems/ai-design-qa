import type { DesignRuleCheck, DesignRuleCheckInput } from '../../../types/designRules'
import type { QaCheck } from '../../../types/qa'
import {
  colorsEqual,
  normalizeRadius,
  parseBorderShorthand,
  pxNumber,
} from '../../../utils/cssValue'
import { buildCheck } from './buildCheck'

function checkRadius(input: DesignRuleCheckInput, expected: string): QaCheck {
  const actual = input.actualCss['border-radius'] ?? null
  if (!actual) {
    return buildCheck({
      input,
      property: 'border-radius',
      expected,
      actual: null,
      status: 'UNVERIFIABLE',
      suggestion: '제출된 CSS에서 border-radius를 확인할 수 없습니다.',
    })
  }

  const e = pxNumber(normalizeRadius(expected))
  const a = pxNumber(normalizeRadius(actual))
  const equal = e != null && a != null ? e === a : normalizeRadius(expected) === normalizeRadius(actual)
  const diff = e != null && a != null && !equal ? `${a - e > 0 ? '+' : ''}${a - e}px` : null

  return buildCheck({
    input,
    property: 'border-radius',
    expected,
    actual,
    status: equal ? 'PASS' : 'ERROR',
    severity: 'major',
    difference: diff,
    suggestion: equal ? null : `border-radius를 ${actual}에서 ${expected}(으)로 변경하세요.`,
  })
}

function actualBorder(css: Record<string, string>): string | null {
  if (css['border']) return css['border']
  if (css['border-width'] || css['border-style'] || css['border-color']) {
    return [css['border-width'], css['border-style'], css['border-color']]
      .filter(Boolean)
      .join(' ')
  }
  return null
}

function checkBorder(input: DesignRuleCheckInput, expected: string): QaCheck {
  const actual = actualBorder(input.actualCss)
  if (!actual) {
    return buildCheck({
      input,
      property: 'border',
      expected,
      actual: null,
      status: 'UNVERIFIABLE',
      suggestion: '제출된 CSS에서 border를 확인할 수 없습니다.',
    })
  }

  const e = parseBorderShorthand(expected)
  const a = parseBorderShorthand(actual)
  const mismatches: string[] = []

  if (e.width && a.width && pxNumber(e.width) !== pxNumber(a.width)) {
    mismatches.push(`두께 ${a.width} ≠ ${e.width}`)
  }
  if (e.style && a.style && e.style !== a.style) {
    mismatches.push(`스타일 ${a.style} ≠ ${e.style}`)
  }
  if (e.color && a.color) {
    const eq = colorsEqual(e.color, a.color)
    if (eq === false) mismatches.push(`색상 ${a.color} ≠ ${e.color}`)
  }

  const equal = mismatches.length === 0
  return buildCheck({
    input,
    property: 'border',
    expected,
    actual,
    status: equal ? 'PASS' : 'ERROR',
    severity: 'major',
    difference: equal ? null : mismatches.join(', '),
    suggestion: equal ? null : `border를 '${expected}'(으)로 변경하세요.`,
  })
}

export const borderCheck: DesignRuleCheck = {
  category: 'border',
  run: (input) => {
    const spec = input.match.spec.border
    if (!spec) return []

    const checks: QaCheck[] = []
    if (spec.borderRadius) checks.push(checkRadius(input, spec.borderRadius))
    if (spec.border) checks.push(checkBorder(input, spec.border))
    return checks
  },
}
