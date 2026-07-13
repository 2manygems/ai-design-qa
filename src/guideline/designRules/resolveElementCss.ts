import type { ExtractedComponent, ExtractedCssRule } from '../../types/analysis'

interface MatchedRule {
  specificity: number
  properties: Record<string, string>
}

/** 셀렉터의 마지막 복합 셀렉터(예: 'div > button.btn' → 'button.btn')를 파싱 */
function parseLastCompound(selector: string) {
  const compound = selector.split(/[\s>+~]+/).filter(Boolean).pop() ?? ''
  // 다른 상태(:hover 등)의 규칙은 기본 상태 비교에 적용하지 않는다
  if (compound.includes(':')) return null

  const tag = compound.match(/^[a-z][a-z0-9-]*/i)?.[0]?.toLowerCase() ?? null
  const id = compound.match(/#([^.#[]+)/)?.[1] ?? null
  const classes = [...compound.matchAll(/\.([^.#[:]+)/g)].map((m) => m[1])
  return { tag, id, classes }
}

/**
 * 컴포넌트 요소에 적용되는 유효 CSS를 계산한다.
 * 근사 매칭: 셀렉터의 마지막 복합 셀렉터만 검사하고 조상 조건은 무시한다.
 * 우선순위: 태그(1) < 클래스(10) < id(100) < 인라인 스타일.
 */
export function resolveElementCss(
  component: ExtractedComponent,
  cssRules: ExtractedCssRule[],
): Record<string, string> {
  const classes = new Set((component.attributes.class ?? '').split(/\s+/).filter(Boolean))
  const id = component.attributes.id ?? null

  const matched: MatchedRule[] = []
  let inline: Record<string, string> | null = null

  for (const rule of cssRules) {
    if (rule.origin === 'inline') {
      if (rule.selector === component.selector) inline = rule.properties
      continue
    }
    // 미디어 조건이 붙은 규칙은 기본 뷰포트 비교에서 제외
    if (rule.selector.startsWith('@')) continue

    const compound = parseLastCompound(rule.selector)
    if (!compound) continue
    if (compound.tag && compound.tag !== component.tagName) continue
    if (compound.id && compound.id !== id) continue
    if (!compound.classes.every((c) => classes.has(c))) continue
    if (!compound.tag && !compound.id && compound.classes.length === 0) continue

    matched.push({
      specificity:
        (compound.id ? 100 : 0) + compound.classes.length * 10 + (compound.tag ? 1 : 0),
      properties: rule.properties,
    })
  }

  matched.sort((a, b) => a.specificity - b.specificity)

  const effective: Record<string, string> = {}
  for (const m of matched) Object.assign(effective, m.properties)
  if (inline) Object.assign(effective, inline)
  return effective
}
