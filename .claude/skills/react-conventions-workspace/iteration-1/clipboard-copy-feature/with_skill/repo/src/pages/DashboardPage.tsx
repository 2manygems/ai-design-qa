import { useAnalysisStore } from '../services/store/analysisStore'
import { useDashboardFilters } from '../hooks/useDashboardFilters'
import type { DashboardTab } from '../hooks/useDashboardFilters'
import { SummaryScoreCard } from '../components/dashboard/SummaryScoreCard'
import { ComponentsPanel } from '../components/dashboard/ComponentsPanel'
import { StringsPanel } from '../components/dashboard/StringsPanel'
import { CssViolationsPanel } from '../components/dashboard/CssViolationsPanel'
import { UxWritingPanel } from '../components/dashboard/UxWritingPanel'
import { Button } from '../components/ui/Button'

const TABS: { key: DashboardTab; label: string }[] = [
  { key: 'components', label: 'Components' },
  { key: 'strings', label: 'Strings' },
  { key: 'css', label: 'Guideline Violations' },
  { key: 'ux-writing', label: 'UX Writing' },
]

export default function DashboardPage() {
  const result = useAnalysisStore((state) => state.result)
  const reset = useAnalysisStore((state) => state.reset)
  const { activeTab, setActiveTab } = useDashboardFilters()

  if (!result) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Analysis Dashboard</h1>
        <Button variant="secondary" onClick={reset}>
          새 파일 업로드
        </Button>
      </div>

      <SummaryScoreCard result={result} />

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'components' && (
        <ComponentsPanel components={result.components} />
      )}
      {activeTab === 'strings' && <StringsPanel strings={result.strings} />}
      {activeTab === 'css' && (
        <CssViolationsPanel violations={result.guidelineViolations} />
      )}
      {activeTab === 'ux-writing' && (
        <UxWritingPanel feedback={result.uxWritingReview} />
      )}
    </div>
  )
}
