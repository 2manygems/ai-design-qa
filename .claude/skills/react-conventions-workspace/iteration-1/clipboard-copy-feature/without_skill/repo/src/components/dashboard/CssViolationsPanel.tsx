import type { GuidelineViolation } from '../../types/guideline'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

interface CssViolationsPanelProps {
  violations: GuidelineViolation[]
}

const SEVERITY_CLASSES: Record<GuidelineViolation['severity'], string> = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
}

export function CssViolationsPanel({ violations }: CssViolationsPanelProps) {
  const { copiedKey, copy } = useCopyToClipboard()

  if (violations.length === 0) {
    return <p className="text-sm text-gray-500">가이드라인 위반 사항이 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-gray-200">
      {violations.map((violation, index) => {
        const key = `${violation.ruleId}-${index}`
        const isCopied = copiedKey === key

        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => copy(violation.targetSelector, key)}
              title="클릭하여 selector 복사"
              className="w-full py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASSES[violation.severity]}`}
                >
                  {violation.severity}
                </span>
                {isCopied && (
                  <span className="text-xs font-medium text-green-600">
                    Selector 복사됨!
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-900">{violation.message}</p>
              <p className="mt-1 text-xs text-gray-400">
                {violation.targetSelector} · expected: {violation.expected} · actual:{' '}
                {violation.actual}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
