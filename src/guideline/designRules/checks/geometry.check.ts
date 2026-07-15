import type { DesignRuleCheck, DesignRuleCheckInput } from '../../../types/designRules'
import type { QaCheck } from '../../../types/qa'
import { pxNumber } from '../../../utils/cssValue'
import { buildCheck } from './buildCheck'

const LAYOUT_TOLERANCE_PX = 1

function checkDimension(
  input: DesignRuleCheckInput,
  property: 'width' | 'height',
  expected: number,
): QaCheck {
  const actualRaw = input.actualCss[property] ?? null
  if (!actualRaw) {
    return buildCheck({
      input,
      property,
      expected: `${expected}px`,
      actual: null,
      status: 'UNVERIFIABLE',
      suggestion: `제출된 CSS에 ${property}가 없어 정적 분석으로 확인할 수 없습니다. 런타임 측정이 필요합니다.`,
    })
  }

  const actual = pxNumber(actualRaw)
  if (actual === null) {
    return buildCheck({
      input,
      property,
      expected: `${expected}px`,
      actual: actualRaw,
      status: 'UNVERIFIABLE',
      suggestion: `상대 단위(${actualRaw})는 computed px로 변환 후 비교해야 합니다.`,
    })
  }

  const diff = actual - expected
  const equal = Math.abs(diff) <= LAYOUT_TOLERANCE_PX
  // width는 콘텐츠 길이에 따라 달라질 수 있어 위반이어도 WARNING (상황적 예외 가능)
  const mismatchStatus = property === 'width' ? 'WARNING' : 'ERROR'
  return buildCheck({
    input,
    property,
    expected: `${expected}px`,
    actual: actualRaw,
    status: equal ? 'PASS' : mismatchStatus,
    severity: 'minor',
    difference: equal ? null : `${diff > 0 ? '+' : ''}${diff}px`,
    suggestion: equal ? null : `${property}를 ${actualRaw}에서 ${expected}px(으)로 변경하세요.`,
  })
}

export const geometryCheck: DesignRuleCheck = {
  category: 'geometry',
  run: (input) => {
    const g = input.match.spec.geometry
    const checks: QaCheck[] = []
    if (g.height != null) checks.push(checkDimension(input, 'height', g.height))
    // width는 콘텐츠 의존이 아닌 고정값일 때만 검사한다
    if (g.width != null) checks.push(checkDimension(input, 'width', g.width))
    return checks
  },
}
