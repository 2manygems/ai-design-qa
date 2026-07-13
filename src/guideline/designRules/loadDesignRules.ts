import type { DesignRuleDatabase, DesignRuleFile } from '../../types/designRules'

/**
 * npm run extract-guide 가 생성한 design-rules/components/*.json 을 로드한다.
 * _cross-references.json 은 canonical 규칙이 아니므로 제외.
 */
const modules = import.meta.glob<DesignRuleFile>(
  '../../../design-rules/components/*.json',
  { eager: true, import: 'default' },
)

let cached: DesignRuleDatabase | null = null

export function loadDesignRules(): DesignRuleDatabase {
  if (cached) return cached
  const components = Object.entries(modules)
    .filter(([path]) => !path.includes('_cross-references'))
    .flatMap(([, file]) => file.components)
  cached = { components }
  return cached
}
