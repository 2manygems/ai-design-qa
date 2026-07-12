import type { UxWritingFeedback } from '../../types/analysis'

interface UxWritingPanelProps {
  feedback: UxWritingFeedback[]
}

export function UxWritingPanel({ feedback }: UxWritingPanelProps) {
  if (feedback.length === 0) {
    return <p className="text-sm text-gray-500">AI 리뷰 결과가 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-gray-200">
      {feedback.map((item) => (
        <li key={item.stringId} className="py-3">
          <p className="text-sm font-medium text-gray-900">
            {item.originalText}
          </p>
          <ul className="mt-1 space-y-1">
            {item.issues.map((issue, index) => (
              <li key={index} className="text-xs text-gray-500">
                [{issue.type}] {issue.comment}
                {issue.suggestion ? ` → ${issue.suggestion}` : ''}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
