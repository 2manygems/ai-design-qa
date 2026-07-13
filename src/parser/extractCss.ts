import type { ExtractedCssRule } from '../types/analysis'
import { getSelectorPath } from '../utils/dom'

function parseDeclarations(block: string): Record<string, string> {
  const properties: Record<string, string> = {}
  block.split(';').forEach((declaration) => {
    const idx = declaration.indexOf(':')
    if (idx === -1) return
    const prop = declaration.slice(0, idx).trim().toLowerCase()
    const value = declaration.slice(idx + 1).trim()
    if (prop && value) properties[prop] = value
  })
  return properties
}

/**
 * 스타일시트 텍스트를 셀렉터 단위 규칙으로 파싱한다.
 * @media 등 중첩 블록은 내부 규칙을 재귀적으로 펼친다 (미디어 조건은 셀렉터에 보존).
 */
function parseStylesheet(text: string, mediaPrefix = ''): ExtractedCssRule[] {
  const rules: ExtractedCssRule[] = []
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '') // 주석 제거

  let i = 0
  let selectorBuf = ''
  while (i < src.length) {
    const ch = src[i]
    if (ch === '{') {
      // 블록 끝 찾기 (중첩 지원)
      let depth = 1
      let j = i + 1
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth++
        else if (src[j] === '}') depth--
        j++
      }
      const body = src.slice(i + 1, j - 1)
      const selector = selectorBuf.trim()
      selectorBuf = ''
      i = j

      if (selector.startsWith('@')) {
        if (/^@(media|supports)/i.test(selector)) {
          rules.push(...parseStylesheet(body, `${mediaPrefix}${selector} `))
        }
        // @font-face, @keyframes 등은 컴포넌트 스타일 규칙이 아니므로 건너뛴다
        continue
      }

      const properties = parseDeclarations(body)
      if (Object.keys(properties).length === 0) continue
      for (const single of selector.split(',')) {
        const s = single.trim()
        if (s) rules.push({ selector: `${mediaPrefix}${s}`, properties, origin: 'stylesheet' })
      }
    } else if (ch === '}') {
      selectorBuf = ''
      i++
    } else {
      selectorBuf += ch
      i++
    }
  }
  return rules
}

export function extractCss(doc: Document): ExtractedCssRule[] {
  const rules: ExtractedCssRule[] = []

  doc.querySelectorAll('style').forEach((styleTag) => {
    rules.push(...parseStylesheet(styleTag.textContent ?? ''))
  })

  doc.querySelectorAll('[style]').forEach((element) => {
    const style = element.getAttribute('style')
    if (!style) return
    const properties = parseDeclarations(style)
    if (Object.keys(properties).length === 0) return
    rules.push({
      selector: getSelectorPath(element),
      properties,
      origin: 'inline',
    })
  })

  return rules
}
