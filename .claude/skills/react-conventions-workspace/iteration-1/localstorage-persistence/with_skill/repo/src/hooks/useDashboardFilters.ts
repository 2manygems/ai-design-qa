import { useState } from 'react'

export type DashboardTab = 'components' | 'strings' | 'css' | 'ux-writing'

export function useDashboardFilters() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('components')

  return { activeTab, setActiveTab }
}
