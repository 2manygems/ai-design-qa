import type { DesignGuideline } from '../types/guideline'
import defaultGuideline from './defaultGuideline.json'

export function loadGuideline(): DesignGuideline {
  return defaultGuideline as DesignGuideline
}
