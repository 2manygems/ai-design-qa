interface SourceHighlighterProps {
  selector: string
}

// Phase 6에서 원본 HTML 미리보기와 연동해 실제 위치를 하이라이트합니다.
export function SourceHighlighter({ selector }: SourceHighlighterProps) {
  return (
    <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
      {selector}
    </code>
  )
}
