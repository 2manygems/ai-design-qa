import { useState } from 'react'
import type { GuidelineViolation } from '../../types/guideline'
import { copyToClipboard } from '../../utils/clipboard'

interface CssViolationsPanelProps {
  violations: GuidelineViolation[]
}

const SEVERITY_CLASSES: Record<GuidelineViolation['severity'], string> = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
}

export function CssViolationsPanel({ violations }: CssViolationsPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (violations.length === 0) {
    return <p className="text-sm text-gray-500">가이드라인 위반 사항이 없습니다.</p>
  }

  async function handleCopySelector(index: number, selector: string) {
    const succeeded = await copyToClipboard(selector)
    if (!succeeded) return
    setCopiedIndex(index)
    window.setTimeout(() => {
      setCopiedIndex((current) => (current === index ? null : current))
    }, 1500)
  }

  return (
    <ul className="divide-y divide-gray-200">
      {violations.map((violation, index) => (
        <li key={`${violation.ruleId}-${index}`} className="py-3">
          <button
            type="button"
            onClick={() => handleCopySelector(index, violation.targetSelector)}
            title="클릭하여 selector 복사"
            className="w-full rounded-md text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
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
            <p className="mt-1 text-xs text-blue-600">
              {copiedIndex === index ? '복사됨!' : '클릭하여 selector 복사'}
            </p>
          </button>
        </li>
      ))}
    </ul>
  )
}
