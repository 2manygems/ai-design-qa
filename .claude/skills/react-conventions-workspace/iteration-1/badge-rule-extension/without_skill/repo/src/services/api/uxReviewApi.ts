import type { ExtractedString, UxWritingFeedback } from '../../types/analysis'

// Phase 4에서 서버(AI 프록시) 엔드포인트로 교체합니다.
export async function requestUxWritingReview(
  strings: ExtractedString[],
): Promise<UxWritingFeedback[]> {
  void strings
  return []
}
