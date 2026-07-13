import type { DesignRuleCheck } from '../../../types/designRules'
import { colorsEqual } from '../../../utils/cssValue'
import { buildCheck } from './buildCheck'

export const backgroundCheck: DesignRuleCheck = {
  category: 'background',
  run: (input) => {
    const expected = input.match.spec.background?.color
    if (!expected) return [] // 가이드라인에 규칙이 없으면 검사하지 않는다

    const actual = input.actualCss['background-color'] ?? input.actualCss['background'] ?? null
    if (!actual) {
      return [
        buildCheck({
          input,
          property: 'background-color',
          expected,
          actual: null,
          status: 'UNVERIFIABLE',
          suggestion: '제출된 CSS에서 배경색을 확인할 수 없습니다. 런타임 computed style 확인이 필요합니다.',
        }),
      ]
    }

    const equal = colorsEqual(expected, actual)
    if (equal === null) {
      return [
        buildCheck({
          input,
          property: 'background-color',
          expected,
          actual,
          status: 'UNVERIFIABLE',
          suggestion: '색상 값을 RGBA로 정규화할 수 없어 비교하지 못했습니다.',
        }),
      ]
    }

    return [
      buildCheck({
        input,
        property: 'background-color',
        expected,
        actual,
        status: equal ? 'PASS' : 'ERROR',
        severity: 'major',
        difference: equal ? null : `${actual} ≠ ${expected}`,
        suggestion: equal ? null : `배경색을 ${actual}에서 ${expected}(으)로 변경하세요.`,
      }),
    ]
  },
}
