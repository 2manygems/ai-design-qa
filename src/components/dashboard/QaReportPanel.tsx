import { useState } from 'react'
import type { QaCheck, QaReport, QaStatus } from '../../types/qa'

interface QaReportPanelProps {
  report: QaReport
}

const STATUS_CONFIG: Record<
  QaStatus,
  { icon: string; bgColor: string; textColor: string; label: string }
> = {
  ERROR: { icon: '❌', bgColor: 'bg-red-50', textColor: 'text-red-700', label: '오류' },
  WARNING: { icon: '⚠️', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', label: '경고' },
  UNVERIFIABLE: {
    icon: '❔',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    label: '검증 불가',
  },
  PASS: { icon: '✅', bgColor: 'bg-green-50', textColor: 'text-green-700', label: '통과' },
}

const STATUS_ORDER: QaStatus[] = ['ERROR', 'WARNING', 'UNVERIFIABLE', 'PASS']

function CheckCard({ check }: { check: QaCheck }) {
  const [expanded, setExpanded] = useState(false)
  const config = STATUS_CONFIG[check.status]

  return (
    <li className={`rounded-lg border border-gray-200 ${config.bgColor}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 text-left hover:bg-black/5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-lg">{config.icon}</span>
            <div>
              <p className={`text-sm font-medium ${config.textColor}`}>
                {config.label} · {check.component}
                {check.variant ? ` / ${check.variant}` : ''}
                {check.state ? ` / ${check.state}` : ''} · {check.property}
              </p>
              {check.expected && check.actual && (
                <p className="mt-1 text-sm text-gray-900">
                  기대 {check.expected} → 실제 {check.actual}
                  {check.difference ? ` (${check.difference})` : ''}
                </p>
              )}
              {!check.expected && check.suggestion && (
                <p className="mt-1 text-sm text-gray-700">{check.suggestion}</p>
              )}
            </div>
          </div>
          <span className="text-lg text-gray-400">{expanded ? '−' : '+'}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-gray-200 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-gray-600">선택자</p>
            <code className="mt-1 block rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
              {check.selector}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-medium text-gray-600">심각도 / 신뢰도</p>
              <p className="mt-1 text-gray-800">
                {check.severity} / {check.confidence}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-600">가이드라인 출처</p>
              <p className="mt-1 text-gray-800">
                {check.source.artboard ?? '—'}
                {check.source.layerName ? ` · ${check.source.layerName}` : ''}
              </p>
            </div>
          </div>
          {check.suggestion && (
            <div>
              <p className="text-xs font-medium text-gray-600">수정 제안</p>
              <p className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">
                {check.suggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function QaReportPanel({ report }: QaReportPanelProps) {
  const [showPass, setShowPass] = useState(false)
  const { summary } = report

  const visibleChecks = [...report.checks]
    .filter((c) => showPass || c.status !== 'PASS')
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <div className="rounded bg-blue-100 p-2 text-center">
          <p className="text-lg font-semibold text-blue-700">
            {summary.score === null ? '—' : summary.score}
          </p>
          <p className="text-xs text-blue-600">점수</p>
        </div>
        <div className="rounded bg-green-100 p-2 text-center">
          <p className="text-sm font-medium text-green-700">{summary.pass}</p>
          <p className="text-xs text-green-600">통과</p>
        </div>
        <div className="rounded bg-red-100 p-2 text-center">
          <p className="text-sm font-medium text-red-700">{summary.error}</p>
          <p className="text-xs text-red-600">오류</p>
        </div>
        <div className="rounded bg-yellow-100 p-2 text-center">
          <p className="text-sm font-medium text-yellow-700">{summary.warning}</p>
          <p className="text-xs text-yellow-600">경고</p>
        </div>
        <div className="rounded bg-gray-100 p-2 text-center">
          <p className="text-sm font-medium text-gray-700">{summary.unverifiable}</p>
          <p className="text-xs text-gray-600">검증 불가</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          점수는 검증 가능한 검사만 반영합니다 (검증 불가 항목 제외).
        </p>
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          {showPass ? '통과 항목 숨기기' : `통과 항목 보기 (${summary.pass})`}
        </button>
      </div>

      {visibleChecks.length === 0 ? (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-700">✓ 보고할 이슈가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleChecks.map((check) => (
            <CheckCard key={check.id} check={check} />
          ))}
        </ul>
      )}
    </div>
  )
}
