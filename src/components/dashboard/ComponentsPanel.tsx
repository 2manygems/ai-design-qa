import type { ExtractedComponent } from '../../types/analysis'

interface ComponentsPanelProps {
  components: ExtractedComponent[]
}

export function ComponentsPanel({ components }: ComponentsPanelProps) {
  if (components.length === 0) {
    return <p className="text-sm text-gray-500">추출된 컴포넌트가 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-gray-200">
      {components.map((component) => (
        <li key={component.id} className="py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {component.type}
            </span>
            <span className="text-sm text-gray-500">{component.tagName}</span>
          </div>
          <p className="mt-1 truncate text-xs text-gray-400">
            {component.selector}
          </p>
        </li>
      ))}
    </ul>
  )
}
