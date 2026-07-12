import type { ComponentRule } from '../../types/analysis'

export const badgeRule: ComponentRule = {
  type: 'badge',
  matches: (element) => element.classList.contains('badge'),
}
