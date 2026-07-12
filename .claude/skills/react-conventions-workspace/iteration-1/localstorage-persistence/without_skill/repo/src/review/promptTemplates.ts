import type { ExtractedString } from '../types/analysis'

export function buildUxWritingReviewPrompt(strings: ExtractedString[]): string {
  const list = strings.map((s) => `- (${s.source}) ${s.text}`).join('\n')

  return [
    '다음은 UI에서 추출한 문자열 목록입니다. 각 문자열의 UX Writing 품질(명확성, 톤앤매너, 일관성)을 검토하고 개선안을 제안해 주세요.',
    list,
  ].join('\n\n')
}
