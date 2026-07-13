import type { ExtractedComponent } from './analysis'
import type { QaCheck, QaConfidence } from './qa'

/** design-rules/components/*.json 의 source 참조 */
export interface DesignRuleSource {
  artboard: string
  layerName: string
  objectID: string
}

export interface DesignRuleTypography {
  role: string
  content: string | null
  fontFamily: string | null
  fontSize: string | null
  fontWeight: number | null
  lineHeight: string | null
  color: string | null
  textAlign: string | null
  derivedPadding: { left: number; right: number; top: number; bottom: number }
}

export interface DesignRuleState {
  name: string
  geometry: {
    width: number | null
    height: number | null
    minWidth: number | null
    maxWidth: number | null
    observedWidths?: number[]
    widthNote?: string
  }
  spacing: {
    derived: boolean
    note: string
    textPadding: { left: number; right: number; top: number; bottom: number }
  } | null
  border: { border: string | null; borderRadius: string | null; sourceLayer: string } | null
  background: {
    color: string | null
    opacity: number | null
    boxShadow: string | null
    sourceLayer: string
  } | null
  typography: DesignRuleTypography[] | null
  icon: { name: string; width: number; height: number }[] | null
  content: string[] | null
  behavior: null
  responsive: null
  stateOverlays: { name: string; css: Record<string, string> }[] | null
  nestedComponents: string[] | null
  source: DesignRuleSource[]
  confidence: QaConfidence
  note?: string
}

export interface DesignRuleVariant {
  name: string
  states: DesignRuleState[]
}

export interface DesignRuleComponent {
  component: string
  description: string | null
  variants: DesignRuleVariant[]
}

/** design-rules/components/<name>.json 파일 하나 */
export interface DesignRuleFile {
  sourceArtboard: string
  components: DesignRuleComponent[]
}

export interface DesignRuleDatabase {
  components: DesignRuleComponent[]
}

/** 매칭 결과: 어떤 컴포넌트의 어떤 variant/state 스펙에 대응하는지 */
export interface DesignRuleMatch {
  component: string
  variant: string
  state: string
  spec: DesignRuleState
  confidence: QaConfidence
}

export interface DesignRuleCheckInput {
  component: ExtractedComponent
  /** 요소에 적용되는 유효 CSS 속성 (셀렉터 매칭 + 특이도 정렬 병합 결과) */
  actualCss: Record<string, string>
  match: DesignRuleMatch
}

/** guideline/designRules/checks/ 의 확장 단위 (rules/ 패턴) */
export interface DesignRuleCheck {
  category: string
  run: (input: DesignRuleCheckInput) => QaCheck[]
}
