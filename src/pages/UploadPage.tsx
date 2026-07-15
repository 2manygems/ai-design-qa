import { useAnalysisStore } from '../services/store/analysisStore'
import { useAnalysisPipeline } from '../hooks/useAnalysisPipeline'
import { UploadDropzone } from '../components/upload/UploadDropzone'
import { UploadPreview } from '../components/upload/UploadPreview'
import { Button } from '../components/ui/Button'

export default function UploadPage() {
  const uploadedHtml = useAnalysisStore((state) => state.uploadedHtml)
  const screenUpload = useAnalysisStore((state) => state.screenUpload)
  const status = useAnalysisStore((state) => state.status)
  const error = useAnalysisStore((state) => state.error)
  const { runAnalysis, runScreenAnalysis } = useAnalysisPipeline()

  const isRunning = status === 'parsing' || status === 'analyzing'

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI Design QA</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sketch HTML을 업로드하면 컴포넌트, 문자열, CSS를 분석하고 디자인
          가이드라인과 비교합니다.
        </p>
      </div>

      <UploadDropzone />

      {uploadedHtml && (
        <div className="space-y-4">
          <UploadPreview html={uploadedHtml} />
          <Button disabled={isRunning} onClick={() => runAnalysis(uploadedHtml)}>
            {isRunning ? '분석 중...' : '분석 시작'}
          </Button>
        </div>
      )}

      {screenUpload && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">📦 {screenUpload.fileName}</p>
            <p className="mt-1 text-xs text-gray-600">
              MeaXure export · 아트보드 {screenUpload.data.artboards.length}개 · preview
              이미지 {Object.keys(screenUpload.imageUrls).length}개
            </p>
          </div>
          <Button disabled={isRunning} onClick={() => runScreenAnalysis(screenUpload)}>
            {isRunning ? '분석 중...' : '분석 시작'}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
