import type { AnalysisResult } from '../../types/analysis'

interface SummaryScoreCardProps {
  result: AnalysisResult
}

export function SummaryScoreCard({ result }: SummaryScoreCardProps) {
  const stats = [
    { label: 'Components', value: result.components.length },
    { label: 'Strings', value: result.strings.length },
    { label: 'Guideline Violations', value: result.guidelineViolations.length },
    { label: 'UX Writing Reviews', value: result.uxWritingReview.length },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gray-200 p-4 text-center"
        >
          <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
