import type { ExtractedString, StringSource } from '../types/analysis'
import { getSelectorPath } from '../utils/dom'
import { createId } from '../utils/format'

const ATTRIBUTE_SOURCES: StringSource[] = [
  'placeholder',
  'alt',
  'aria-label',
  'title',
]

export function extractStrings(doc: Document): ExtractedString[] {
  const strings: ExtractedString[] = []

  doc.body.querySelectorAll('*').forEach((element) => {
    for (const source of ATTRIBUTE_SOURCES) {
      const value = element.getAttribute(source)
      if (value?.trim()) {
        strings.push({
          id: createId('string'),
          text: value.trim(),
          source,
          selector: getSelectorPath(element),
        })
      }
    }

    const ownText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .join(' ')

    if (ownText) {
      strings.push({
        id: createId('string'),
        text: ownText,
        source: 'textContent',
        selector: getSelectorPath(element),
      })
    }
  })

  return strings
}
