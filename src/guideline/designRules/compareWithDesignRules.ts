import type { ExtractedComponent, ExtractedCssRule } from '../../types/analysis'
import type { DesignRuleCheck } from '../../types/designRules'
import type { QaCheck, QaComponentMatch, QaReport } from '../../types/qa'
import { createId } from '../../utils/format'
import { loadDesignRules } from './loadDesignRules'
import { matchComponent } from './matchComponent'
import { resolveElementCss } from './resolveElementCss'
import { backgroundCheck } from './checks/background.check'
import { borderCheck } from './checks/border.check'
import { typographyCheck } from './checks/typography.check'
import { geometryCheck } from './checks/geometry.check'

const checks: DesignRuleCheck[] = [backgroundCheck, borderCheck, typographyCheck, geometryCheck]

export function compareWithDesignRules(input: {
  components: ExtractedComponent[]
  css: ExtractedCssRule[]
}): QaReport {
  const db = loadDesignRules()
  const componentMatches: QaComponentMatch[] = []
  const allChecks: QaCheck[] = []

  for (const component of input.components) {
    const actualCss = resolveElementCss(component, input.css)
    const { match, candidates } = matchComponent(component, actualCss, db)

    componentMatches.push({
      componentId: component.id,
      selector: component.selector,
      matched: match
        ? {
            component: match.component,
            variant: match.variant,
            state: match.state,
            confidence: match.confidence,
          }
        : null,
      candidates,
    })

    if (!match) {
      // 강제 매칭 금지 — 식별 불가는 UNVERIFIABLE로 보고하고 후보만 제공
      allChecks.push({
        id: createId('check'),
        status: 'UNVERIFIABLE',
        severity: 'info',
        component: component.type,
        variant: null,
        state: null,
        selector: component.selector,
        property: 'component-identity',
        expected: null,
        actual: null,
        difference: null,
        source: { artboard: null },
        confidence: 'low',
        suggestion:
          candidates.length > 0
            ? `variant/state를 확정할 수 없습니다. 후보: ${candidates.join(', ')}. data-component/data-variant/data-state 속성을 추가하면 정확한 검사가 가능합니다.`
            : '가이드라인에서 대응하는 컴포넌트 규칙을 찾지 못했습니다.',
      })
      continue
    }

    for (const check of checks) {
      allChecks.push(...check.run({ component, actualCss, match }))
    }
  }

  const pass = allChecks.filter((c) => c.status === 'PASS').length
  const error = allChecks.filter((c) => c.status === 'ERROR').length
  const warning = allChecks.filter((c) => c.status === 'WARNING').length
  const unverifiable = allChecks.filter((c) => c.status === 'UNVERIFIABLE').length
  const verifiable = pass + error + warning

  return {
    summary: {
      // UNVERIFIABLE은 점수에 반영하지 않는다
      score: verifiable > 0 ? Math.round((pass / verifiable) * 100) : null,
      pass,
      error,
      warning,
      unverifiable,
    },
    components: componentMatches,
    checks: allChecks,
  }
}
