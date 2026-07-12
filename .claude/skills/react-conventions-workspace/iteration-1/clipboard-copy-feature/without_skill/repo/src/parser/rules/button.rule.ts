import type { ComponentRule } from '../../types/analysis'

export const buttonRule: ComponentRule = {
  type: 'button',
  matches: (element) =>
    element.tagName === 'BUTTON' || element.getAttribute('role') === 'button',
}
