import type { ExtractedCssRule } from '../types/analysis'

export function extractCss(doc: Document): ExtractedCssRule[] {
  const rules: ExtractedCssRule[] = []

  doc.querySelectorAll('[style]').forEach((element) => {
    const style = element.getAttribute('style')
    if (!style) return

    const properties: Record<string, string> = {}
    style.split(';').forEach((declaration) => {
      const [prop, value] = declaration.split(':')
      if (prop && value) properties[prop.trim()] = value.trim()
    })

    rules.push({
      selector: element.tagName.toLowerCase(),
      properties,
      origin: 'inline',
    })
  })

  doc.querySelectorAll('style').forEach((styleTag) => {
    rules.push({
      selector: '(style tag)',
      properties: { cssText: styleTag.textContent ?? '' },
      origin: 'style-tag',
    })
  })

  return rules
}
