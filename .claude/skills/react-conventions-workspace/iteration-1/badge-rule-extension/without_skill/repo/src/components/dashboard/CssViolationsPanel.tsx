import type { GuidelineViolation } from '../../types/guideline'

interface CssViolationsPanelProps {
  violations: GuidelineViolation[]
}

const SEVERITY_CLASSES: Record<GuidelineViolation['severity'], string> = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
}

export function CssViolationsPanel({ violations }: CssViolationsPanelProps) {
  if (violations.length === 0) {
    return <p className="text-sm text-gray-500">가이드라인 위반 사항이 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-gray-200">
      {violations.map((violation, index) => (
        <li key={`${violation.ruleId}-${index}`} className="py-3">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASSES[violation.severity]}`}
          >
            {violation.severity}
          </span>
          <p className="mt-1 text-sm text-gray-900">{violation.message}</p>
          <p className="mt-1 text-xs text-gray-400">
            {violation.targetSelector} · expected: {violation.expected} · actual:{' '}
            {violation.actual}
          </p>
        </li>
      ))}
    </ul>
  )
}
