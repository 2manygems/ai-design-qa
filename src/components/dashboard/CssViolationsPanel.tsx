import { useState } from 'react'
import type { GuidelineViolation } from '../../types/guideline'

interface CssViolationsPanelProps {
  violations: GuidelineViolation[]
}

const SEVERITY_CONFIG: Record<
  GuidelineViolation['severity'],
  { icon: string; bgColor: string; textColor: string; label: string }
> = {
  error: {
    icon: '❌',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    label: '오류',
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    label: '경고',
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    label: '정보',
  },
}

export function CssViolationsPanel({ violations }: CssViolationsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (violations.length === 0) {
    return (
      <div className="rounded-lg bg-green-50 p-4">
        <p className="text-sm text-green-700">✓ 모든 가이드라인 규칙을 준수하고 있습니다!</p>
      </div>
    )
  }

  const errorCount = violations.filter((v) => v.severity === 'error').length
  const warningCount = violations.filter((v) => v.severity === 'warning').length
  const infoCount = violations.filter((v) => v.severity === 'info').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {errorCount > 0 && (
          <div className="rounded bg-red-100 p-2 text-center">
            <p className="text-sm font-medium text-red-700">{errorCount}</p>
            <p className="text-xs text-red-600">오류</p>
          </div>
        )}
        {warningCount > 0 && (
          <div className="rounded bg-yellow-100 p-2 text-center">
            <p className="text-sm font-medium text-yellow-700">{warningCount}</p>
            <p className="text-xs text-yellow-600">경고</p>
          </div>
        )}
        {infoCount > 0 && (
          <div className="rounded bg-blue-100 p-2 text-center">
            <p className="text-sm font-medium text-blue-700">{infoCount}</p>
            <p className="text-xs text-blue-600">정보</p>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {violations.map((violation, index) => {
          const config = SEVERITY_CONFIG[violation.severity]
          const isExpanded = expandedIndex === index

          return (
            <li
              key={`${violation.ruleId}-${index}`}
              className={`rounded-lg border border-gray-200 transition-colors ${config.bgColor}`}
            >
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full px-4 py-3 text-left hover:bg-black/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${config.textColor}`}>
                        {config.label} · {violation.ruleId}
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {violation.message}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-lg">
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-3 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">선택자</p>
                    <code className="mt-1 block rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
                      {violation.targetSelector}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600">현재 값</p>
                      <code className="mt-1 block rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                        {violation.actual}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">예상 값</p>
                      <code className="mt-1 block rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        {violation.expected}
                      </code>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(violation.targetSelector)
                      }
                      className="mt-2 w-full rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      📋 선택자 복사
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
