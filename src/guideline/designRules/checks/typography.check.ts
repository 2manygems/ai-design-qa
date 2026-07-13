import type { DesignRuleCheck, DesignRuleCheckInput } from '../../../types/designRules'
import type { QaCheck } from '../../../types/qa'
import {
  colorsEqual,
  normalizeFontWeight,
  primaryFontFamily,
  pxNumber,
} from '../../../utils/cssValue'
import { buildCheck } from './buildCheck'

interface PropCompare {
  property: string
  expected: string
  actual: string | null
  equal: boolean | null
  difference?: string | null
}

function compareProps(input: DesignRuleCheckInput): PropCompare[] {
  const t = input.match.spec.typography?.[0]
  if (!t) return []
  const css = input.actualCss
  const out: PropCompare[] = []

  if (t.fontFamily) {
    const actual = css['font-family'] ?? null
    out.push({
      property: 'font-family',
      expected: t.fontFamily,
      actual,
      equal: actual ? primaryFontFamily(t.fontFamily) === primaryFontFamily(actual) : null,
    })
  }
  if (t.fontSize) {
    const actual = css['font-size'] ?? null
    const e = pxNumber(t.fontSize)
    const a = actual ? pxNumber(actual) : null
    const equal = actual ? (e != null && a != null ? e === a : t.fontSize === actual) : null
    out.push({
      property: 'font-size',
      expected: t.fontSize,
      actual,
      equal,
      difference: equal === false && e != null && a != null ? `${a - e > 0 ? '+' : ''}${a - e}px` : null,
    })
  }
  if (t.fontWeight != null) {
    const actual = css['font-weight'] ?? null
    const a = actual ? normalizeFontWeight(actual) : null
    out.push({
      property: 'font-weight',
      expected: String(t.fontWeight),
      actual,
      equal: actual ? a === t.fontWeight : null,
    })
  }
  if (t.lineHeight) {
    const actual = css['line-height'] ?? null
    const e = pxNumber(t.lineHeight)
    const a = actual ? pxNumber(actual) : null
    out.push({
      property: 'line-height',
      expected: t.lineHeight,
      actual,
      equal: actual ? (e != null && a != null ? e === a : t.lineHeight === actual) : null,
    })
  }
  if (t.color) {
    const actual = css['color'] ?? null
    out.push({
      property: 'color',
      expected: t.color,
      actual,
      equal: actual ? colorsEqual(t.color, actual) : null,
    })
  }

  return out
}

export const typographyCheck: DesignRuleCheck = {
  category: 'typography',
  run: (input) => {
    const checks: QaCheck[] = []
    for (const p of compareProps(input)) {
      if (p.actual === null || p.equal === null) {
        checks.push(
          buildCheck({
            input,
            property: p.property,
            expected: p.expected,
            actual: p.actual,
            status: 'UNVERIFIABLE',
            suggestion: `제출된 CSS에서 ${p.property}를 확인할 수 없습니다.`,
          }),
        )
        continue
      }
      checks.push(
        buildCheck({
          input,
          property: p.property,
          expected: p.expected,
          actual: p.actual,
          status: p.equal ? 'PASS' : 'ERROR',
          severity: 'major',
          difference: p.equal ? null : (p.difference ?? `${p.actual} ≠ ${p.expected}`),
          suggestion: p.equal
            ? null
            : `${p.property}를 ${p.actual}에서 ${p.expected}(으)로 변경하세요.`,
        }),
      )
    }
    return checks
  },
}
