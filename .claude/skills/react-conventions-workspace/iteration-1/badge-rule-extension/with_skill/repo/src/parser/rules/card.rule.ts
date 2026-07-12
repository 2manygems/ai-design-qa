import type { ComponentRule } from '../../types/analysis'

export const cardRule: ComponentRule = {
  type: 'card',
  matches: (element) => element.classList.contains('card'),
}
