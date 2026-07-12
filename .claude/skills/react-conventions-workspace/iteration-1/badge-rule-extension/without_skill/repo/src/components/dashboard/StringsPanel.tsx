import type { ExtractedString } from '../../types/analysis'

interface StringsPanelProps {
  strings: ExtractedString[]
}

export function StringsPanel({ strings }: StringsPanelProps) {
  if (strings.length === 0) {
    return <p className="text-sm text-gray-500">추출된 문자열이 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-gray-200">
      {strings.map((item) => (
        <li key={item.id} className="py-3">
          <p className="text-sm text-gray-900">{item.text}</p>
          <p className="mt-1 text-xs text-gray-400">
            {item.source} · {item.selector}
          </p>
        </li>
      ))}
    </ul>
  )
}
