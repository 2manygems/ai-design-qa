import type { ComponentRule, ExtractedComponent } from '../types/analysis'
import { getSelectorPath } from '../utils/dom'
import { createId } from '../utils/format'
import { buttonRule } from './rules/button.rule'
import { inputRule } from './rules/input.rule'
import { cardRule } from './rules/card.rule'

const rules: ComponentRule[] = [buttonRule, inputRule, cardRule]

export function extractComponents(doc: Document): ExtractedComponent[] {
  const components: ExtractedComponent[] = []

  doc.body.querySelectorAll('*').forEach((element) => {
    const rule = rules.find((r) => r.matches(element))
    if (!rule) return

    components.push({
      id: createId('component'),
      type: rule.type,
      tagName: element.tagName.toLowerCase(),
      selector: getSelectorPath(element),
      attributes: Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
      ),
    })
  })

  return components
}
