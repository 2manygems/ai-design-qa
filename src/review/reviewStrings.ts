import type { ExtractedString, UxWritingFeedback } from '../types/analysis'
import { requestUxWritingReview } from '../services/api/uxReviewApi'

export async function reviewStrings(
  strings: ExtractedString[],
): Promise<UxWritingFeedback[]> {
  return requestUxWritingReview(strings)
}
