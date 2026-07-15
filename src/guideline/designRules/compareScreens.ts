import type { ExtractedComponent } from '../../types/analysis'
import type { DesignRuleCheck, DesignRuleMatch } from '../../types/designRules'
import type { ScreenComponent } from '../../types/meaxure'
import type { QaCheck, QaComponentMatch, QaReport } from '../../types/qa'
import { createId } from '../../utils/format'
import { loadDesignRules } from './loadDesignRules'
import { backgroundCheck } from './checks/background.check'
import { borderCheck } from './checks/border.check'
import { typographyCheck } from './checks/typography.check'
import { geometryCheck } from './checks/geometry.check'

const checks: DesignRuleCheck[] = [backgroundCheck, borderCheck, typographyCheck, geometryCheck]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** HTML/CSS 정적 분석으로 판단할 수 없어 항상 UNVERIFIABLE로 보고하는 행위성 항목 */
const BEHAVIORAL_ITEMS = [
  '클릭 후 실제 동작',
  '키보드 접근성 및 포커스 이동',
  'Tooltip 노출 시간',
  '검색 결과 반환 로직',
  '비동기 Loading 처리',
  '브라우저 resize 시 responsive behavior',
]

/** 심볼 이름을 design-rules DB에서 정확 매칭 (이름 기반이라 신뢰도 높음) */
function matchByName(sc: ScreenComponent): {
  match: DesignRuleMatch | null
  candidates: string[]
} {
  const db = loadDesignRules()
  const comp = db.components.find((c) => norm(c.component) === norm(sc.component))
  if (!comp) return { match: null, candidates: [] }

  const wantVariant = sc.variant ? norm(sc.variant) : null
  const wantState = sc.state ? norm(sc.state) : null

  const candidates: string[] = []
  for (const v of comp.variants) {
    for (const s of v.states) {
      const variantOk = wantVariant === null || norm(v.name) === wantVariant
      const stateOk = wantState === null ? s.name === '(unspecified)' : norm(s.name) === wantState
      if (variantOk && stateOk) {
        return {
          match: {
            component: comp.component,
            variant: v.name,
            state: s.name,
            spec: s,
            confidence: s.confidence,
          },
          candidates: [],
        }
      }
      candidates.push(`${comp.component} / ${v.name} / ${s.name}`)
    }
  }
  return { match: null, candidates: candidates.slice(0, 5) }
}

function unverifiableCheck(sc: ScreenComponent, candidates: string[]): QaCheck {
  return {
    id: createId('check'),
    status: 'UNVERIFIABLE',
    severity: 'info',
    component: sc.component,
    variant: sc.variant,
    state: sc.state,
    selector: `${sc.artboardName} › ${sc.symbolName}`,
    property: 'component-identity',
    expected: null,
    actual: null,
    difference: null,
    source: { artboard: null },
    confidence: 'low',
    suggestion:
      candidates.length > 0
        ? `가이드라인에서 정확한 variant/state를 찾지 못했습니다. 후보: ${candidates.join(', ')}`
        : `'${sc.component}' 컴포넌트의 가이드라인 규칙이 design-rules DB에 없습니다.`,
    location: {
      artboard: sc.artboardName,
      imagePath: sc.artboardImagePath,
      rect: sc.rect,
    },
  }
}

/** MeaXure 화면 심볼들을 design-rules DB와 비교해 QA 리포트를 만든다. */
export function compareScreens(screenComponents: ScreenComponent[]): QaReport {
  const componentMatches: QaComponentMatch[] = []
  const allChecks: QaCheck[] = []

  for (const sc of screenComponents) {
    const { match, candidates } = matchByName(sc)

    componentMatches.push({
      componentId: sc.id,
      selector: `${sc.artboardName} › ${sc.symbolName}`,
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
      allChecks.push(unverifiableCheck(sc, candidates))
      continue
    }

    // 기존 카테고리 체크 재사용을 위한 어댑터
    const adapter: ExtractedComponent = {
      id: sc.id,
      type: sc.component,
      tagName: 'symbol',
      selector: `${sc.artboardName} › ${sc.symbolName}`,
      attributes: {},
    }
    for (const check of checks) {
      const results = check.run({ component: adapter, actualCss: sc.actualCss, match })
      for (const r of results) {
        r.location = {
          artboard: sc.artboardName,
          imagePath: sc.artboardImagePath,
          rect: sc.rect,
        }
        allChecks.push(r)
      }
    }
  }

  // 행위성 항목은 항상 UNVERIFIABLE (실패 처리 금지 — 런타임 테스트 필요)
  for (const item of BEHAVIORAL_ITEMS) {
    allChecks.push({
      id: createId('check'),
      status: 'UNVERIFIABLE',
      severity: 'info',
      component: '(전체 화면)',
      variant: null,
      state: null,
      selector: '—',
      property: item,
      expected: null,
      actual: null,
      difference: null,
      source: { artboard: null, rule: '정적 HTML/CSS 분석으로 검증 불가' },
      confidence: 'high',
      suggestion: '런타임 인터랙션 테스트(예: Playwright)로 별도 검증이 필요합니다.',
    })
  }

  const pass = allChecks.filter((c) => c.status === 'PASS').length
  const error = allChecks.filter((c) => c.status === 'ERROR').length
  const warning = allChecks.filter((c) => c.status === 'WARNING').length
  const unverifiable = allChecks.filter((c) => c.status === 'UNVERIFIABLE').length
  const verifiable = pass + error + warning

  return {
    summary: {
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
