import type { ComponentRule } from '../../types/analysis'

export const badgeRule: ComponentRule = {
  type: 'badge',
  matches: (element) =>
    Array.from(element.classList).some((className) => className.includes('badge')),
}
