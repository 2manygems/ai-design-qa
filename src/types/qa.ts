export type QaStatus = 'PASS' | 'ERROR' | 'WARNING' | 'UNVERIFIABLE'

export type QaSeverity = 'critical' | 'major' | 'minor' | 'info'

export type QaConfidence = 'high' | 'medium' | 'low'

/** 판정 근거가 된 가이드라인 출처 */
export interface QaSource {
  artboard: string | null
  layerName?: string | null
  rule?: string | null
}

/** 화면 아트보드 내 위반 위치 (이미지 캡쳐 오버레이용) */
export interface QaLocation {
  artboard: string
  imagePath: string | null
  rect: { x: number; y: number; width: number; height: number }
}

/** 단일 속성 검사 결과 — 모든 오류/경고는 근거를 포함해야 한다 */
export interface QaCheck {
  id: string
  status: QaStatus
  severity: QaSeverity
  component: string
  variant: string | null
  state: string | null
  selector: string
  property: string
  expected: string | null
  actual: string | null
  difference: string | null
  source: QaSource
  confidence: QaConfidence
  suggestion: string | null
  /** MeaXure 화면 업로드일 때만 존재 */
  location?: QaLocation
}

/** 요소별 컴포넌트 식별 결과 */
export interface QaComponentMatch {
  componentId: string
  selector: string
  matched: {
    component: string
    variant: string
    state: string
    confidence: QaConfidence
  } | null
  /** 매칭 실패 시 가능한 후보 목록 */
  candidates: string[]
}

export interface QaSummary {
  /** 검증 가능한 검사(PASS+ERROR+WARNING) 중 PASS 비율. 검증 가능 항목이 없으면 null */
  score: number | null
  pass: number
  error: number
  warning: number
  unverifiable: number
}

export interface QaReport {
  summary: QaSummary
  components: QaComponentMatch[]
  checks: QaCheck[]
}
