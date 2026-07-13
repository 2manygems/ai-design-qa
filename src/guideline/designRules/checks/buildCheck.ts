import type { DesignRuleCheckInput } from '../../../types/designRules'
import type { QaCheck, QaConfidence, QaSeverity, QaStatus } from '../../../types/qa'
import { createId } from '../../../utils/format'

const CONFIDENCE_RANK: Record<QaConfidence, number> = { high: 3, medium: 2, low: 1 }

/** 스펙 신뢰도와 매칭 신뢰도 중 낮은 쪽 */
export function combinedConfidence(input: DesignRuleCheckInput): QaConfidence {
  const a = input.match.spec.confidence
  const b = input.match.confidence
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b
}

interface BuildCheckParams {
  input: DesignRuleCheckInput
  property: string
  expected: string | null
  actual: string | null
  status: QaStatus
  severity?: QaSeverity
  difference?: string | null
  suggestion?: string | null
}

/**
 * 검사 결과 생성. 불일치라도 신뢰도가 high가 아니면 ERROR 대신 WARNING으로 낮춘다
 * (canonical이 아닌 근거로 ERROR를 내지 않는다 — false positive 방지).
 */
export function buildCheck({
  input,
  property,
  expected,
  actual,
  status,
  severity,
  difference = null,
  suggestion = null,
}: BuildCheckParams): QaCheck {
  const confidence = combinedConfidence(input)
  let finalStatus = status
  let finalSeverity = severity ?? 'info'

  if (status === 'ERROR' && confidence !== 'high') {
    finalStatus = 'WARNING'
  }
  if (finalStatus === 'PASS' || finalStatus === 'UNVERIFIABLE') {
    finalSeverity = 'info'
  }

  const source = input.match.spec.source[0] ?? null
  return {
    id: createId('check'),
    status: finalStatus,
    severity: finalSeverity,
    component: input.match.component,
    variant: input.match.variant,
    state: input.match.state,
    selector: input.component.selector,
    property,
    expected,
    actual,
    difference,
    source: {
      artboard: source?.artboard ?? null,
      layerName: source?.layerName ?? null,
    },
    confidence,
    suggestion,
  }
}
