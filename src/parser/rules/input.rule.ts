import type { ComponentRule } from '../../types/analysis'

export const inputRule: ComponentRule = {
  type: 'input',
  matches: (element) =>
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT',
}
