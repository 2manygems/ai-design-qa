import { useEffect, useState } from 'react'
import type { QaCheck, QaReport } from '../../types/qa'
import { captureRegion } from '../../utils/captureRegion'

interface ScreenQaPanelProps {
  report: QaReport
  /** imagePath("preview/xxx.png") → blob URL */
  imageUrls: Record<string, string>
}

/** 위반 위치를 preview 이미지에서 잘라 빨간 박스로 표시한 캡쳐 */
function ViolationCapture({ check, imageUrls }: { check: QaCheck; imageUrls: Record<string, string> }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const imagePath = check.location?.imagePath
  const rect = check.location?.rect
  const blobUrl = imagePath ? imageUrls[imagePath] : undefined

  useEffect(() => {
    if (!blobUrl || !rect) return
    let cancelled = false
    captureRegion(blobUrl, rect)
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [blobUrl, rect])

  if (!blobUrl || !rect || failed) return null
  if (!dataUrl) {
    return <div className="h-24 animate-pulse rounded bg-gray-100" />
  }
  return (
    <img
      src={dataUrl}
      alt={`${check.location?.artboard} 위반 위치 캡쳐`}
      className="max-h-64 w-auto max-w-full rounded border border-gray-300"
    />
  )
}

function IssueCard({ check, imageUrls }: { check: QaCheck; imageUrls: Record<string, string> }) {
  const isError = check.status === 'ERROR'
  const badge = isError
    ? { label: 'ERROR', cls: 'bg-red-100 text-red-700' }
    : { label: 'WARNING', cls: 'bg-yellow-100 text-yellow-700' }

  return (
    <li className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="text-sm font-medium text-gray-900">
          {check.component}
          {check.variant ? ` / ${check.variant}` : ''}
          {check.state ? ` / ${check.state}` : ''}
        </span>
        <span className="text-xs text-gray-500">· {check.property}</span>
      </div>

      {check.location && (
        <div className="space-y-2">
          <ViolationCapture check={check} imageUrls={imageUrls} />
          <p className="text-xs text-gray-600">
            📍 위치: <span className="font-medium">{check.location.artboard}</span>
            {' — '}x:{Math.round(check.location.rect.x)}, y:{Math.round(check.location.rect.y)}
            {' '}({Math.round(check.location.rect.width)}×{Math.round(check.location.rect.height)}px)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-red-200 bg-red-50 p-2">
          <p className="text-xs font-semibold text-red-700">AS IS</p>
          <code className="mt-1 block text-xs text-red-800">
            {check.property}: {check.actual ?? '—'}
          </code>
        </div>
        <div className="rounded border border-green-200 bg-green-50 p-2">
          <p className="text-xs font-semibold text-green-700">TO BE</p>
          <code className="mt-1 block text-xs text-green-800">
            {check.property}: {check.expected ?? '—'}
          </code>
        </div>
      </div>

      {check.suggestion && (
        <p className="rounded bg-blue-50 px-3 py-2 text-xs text-blue-800">
          💡 {check.suggestion}
        </p>
      )}
      <p className="text-xs text-gray-400">
        근거: {check.source.artboard ?? '—'}
        {check.source.layerName ? ` · ${check.source.layerName}` : ''} · 신뢰도 {check.confidence}
      </p>
    </li>
  )
}

export function ScreenQaPanel({ report, imageUrls }: ScreenQaPanelProps) {
  const { summary } = report
  const issues = report.checks
    .filter((c) => c.status === 'ERROR' || c.status === 'WARNING')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'ERROR' ? -1 : 1))
  const behavioral = report.checks.filter(
    (c) => c.status === 'UNVERIFIABLE' && c.selector === '—',
  )
  const unmatchedCount = summary.unverifiable - behavioral.length

  return (
    <div className="space-y-6">
      {/* 전체 정확도 요약 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-blue-600">
              {summary.score === null ? '—' : `${summary.score}%`}
            </p>
            <p className="mt-1 text-xs text-gray-500">전체 정확도</p>
          </div>
          <div className="grid flex-1 grid-cols-4 gap-2">
            <div className="rounded bg-green-50 p-3 text-center">
              <p className="text-xl font-semibold text-green-700">{summary.pass}</p>
              <p className="text-xs text-green-600">PASS</p>
            </div>
            <div className="rounded bg-red-50 p-3 text-center">
              <p className="text-xl font-semibold text-red-700">{summary.error}</p>
              <p className="text-xs text-red-600">ERROR</p>
            </div>
            <div className="rounded bg-yellow-50 p-3 text-center">
              <p className="text-xl font-semibold text-yellow-700">{summary.warning}</p>
              <p className="text-xs text-yellow-600">WARNING</p>
            </div>
            <div className="rounded bg-gray-50 p-3 text-center">
              <p className="text-xl font-semibold text-gray-700">{summary.unverifiable}</p>
              <p className="text-xs text-gray-600">UNVERIFIABLE</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          정확도는 검증 가능한 항목(PASS+ERROR+WARNING) 기준입니다. UNVERIFIABLE은 점수에
          반영되지 않습니다.
        </p>
      </div>

      {/* 이슈 목록 (ERROR 우선) */}
      {issues.length === 0 ? (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-700">✓ 가이드라인 위반이 발견되지 않았습니다.</p>
        </div>
      ) : (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            수정 필요 항목 ({issues.length})
          </h3>
          <ul className="space-y-3">
            {issues.map((check) => (
              <IssueCard key={check.id} check={check} imageUrls={imageUrls} />
            ))}
          </ul>
        </div>
      )}

      {/* 런타임 검증 필요 항목 */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          파일만으로 판단 불가 — 런타임 검증 필요 ({behavioral.length}
          {unmatchedCount > 0 ? ` + 미매칭 ${unmatchedCount}` : ''})
        </h3>
        <ul className="space-y-1">
          {behavioral.map((check) => (
            <li
              key={check.id}
              className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              <span>❔</span>
              <span>{check.property}</span>
              <span className="ml-auto text-xs text-gray-400">UNVERIFIABLE</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
