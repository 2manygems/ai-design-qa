import type { ExtractedComponent } from '../../types/analysis'
import type {
  DesignRuleDatabase,
  DesignRuleMatch,
  DesignRuleState,
} from '../../types/designRules'
import {
  colorsEqual,
  normalizeRadius,
  parseBorderShorthand,
  pxNumber,
} from '../../utils/cssValue'

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export interface MatchResult {
  match: DesignRuleMatch | null
  /** 매칭 실패 시 가능한 후보 (component / variant / state) */
  candidates: string[]
}

interface StateCandidate {
  component: string
  variant: string
  state: string
  spec: DesignRuleState
}

/**
 * CSS 유사도 점수: 스펙과 실제 CSS가 일치하는 핵심 속성 수.
 * 비교 가능한 속성이 있는데 불일치하면 감점 없이 0점 처리 (보수적).
 */
function similarityScore(spec: DesignRuleState, css: Record<string, string>): number {
  let score = 0

  const bg = css['background-color'] ?? css['background']
  if (spec.background?.color && bg && colorsEqual(spec.background.color, bg)) score++

  if (spec.border?.borderRadius && css['border-radius']) {
    if (normalizeRadius(spec.border.borderRadius) === normalizeRadius(css['border-radius'])) score++
  }

  if (spec.border?.border && css['border']) {
    const e = parseBorderShorthand(spec.border.border)
    const a = parseBorderShorthand(css['border'])
    if (e.color && a.color && colorsEqual(e.color, a.color)) score++
  }

  const t = spec.typography?.[0]
  if (t?.fontSize && css['font-size'] && pxNumber(t.fontSize) === pxNumber(css['font-size'])) {
    score++
  }

  if (spec.geometry.height != null && css['height']) {
    const h = pxNumber(css['height'])
    if (h != null && Math.abs(h - spec.geometry.height) <= 1) score++
  }

  return score
}

/**
 * 추출된 컴포넌트를 design-rules DB의 component/variant/state에 매칭한다.
 * 1) data-component / data-variant / data-state 명시 메타데이터 우선
 * 2) 없으면 파서의 type과 CSS 유사도로 최적 후보 선택
 * 3) 확정할 수 없으면 매칭하지 않는다 (UNVERIFIABLE — 강제 매칭 금지)
 */
export function matchComponent(
  component: ExtractedComponent,
  actualCss: Record<string, string>,
  db: DesignRuleDatabase,
): MatchResult {
  const explicitComponent = component.attributes['data-component']
  const explicitVariant = component.attributes['data-variant']
  const explicitState = component.attributes['data-state']

  // 후보 컴포넌트 결정
  const componentCandidates = db.components.filter((c) => {
    if (explicitComponent) return norm(c.component) === norm(explicitComponent)
    // 파서 타입(button, input, card...)이 컴포넌트명에 단어로 포함되면 후보
    return norm(c.component).split(' ').includes(norm(component.type))
  })
  if (componentCandidates.length === 0) return { match: null, candidates: [] }

  // (variant, state) 전체 후보 펼치기
  let stateCandidates: StateCandidate[] = componentCandidates.flatMap((c) =>
    c.variants.flatMap((v) =>
      v.states.map((s) => ({ component: c.component, variant: v.name, state: s.name, spec: s })),
    ),
  )

  if (explicitVariant) {
    stateCandidates = stateCandidates.filter((sc) => norm(sc.variant) === norm(explicitVariant))
  }
  if (explicitState) {
    stateCandidates = stateCandidates.filter((sc) => norm(sc.state) === norm(explicitState))
  }

  const label = (sc: StateCandidate) => `${sc.component} / ${sc.variant} / ${sc.state}`

  if (stateCandidates.length === 0) return { match: null, candidates: [] }

  // 명시 메타데이터로 유일하게 결정된 경우 → 신뢰도 high
  if (explicitComponent && explicitVariant && explicitState && stateCandidates.length === 1) {
    const sc = stateCandidates[0]
    return {
      match: { ...sc, confidence: sc.spec.confidence === 'high' ? 'high' : 'medium' },
      candidates: [],
    }
  }

  // CSS 유사도로 최적 후보 선택
  const scored = stateCandidates
    .map((sc) => ({ sc, score: similarityScore(sc.spec, actualCss) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  const second = scored[1]
  const uniqueBest = best.score >= 2 && (!second || second.score < best.score)

  if (uniqueBest) {
    const specConfidence = best.sc.spec.confidence
    return {
      match: {
        ...best.sc,
        // 유사도 기반 추정 매칭은 high로 올리지 않는다
        confidence: specConfidence === 'high' ? 'medium' : specConfidence,
      },
      candidates: [],
    }
  }

  // 확정 불가 → 상위 후보만 보고
  return {
    match: null,
    candidates: scored.slice(0, 5).map(({ sc }) => label(sc)),
  }
}
