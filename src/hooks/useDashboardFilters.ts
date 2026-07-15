import { useState } from 'react'

export type DashboardTab =
  | 'screen-qa'
  | 'components'
  | 'strings'
  | 'css'
  | 'design-qa'
  | 'ux-writing'

export function useDashboardFilters(initialTab: DashboardTab = 'components') {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab)

  return { activeTab, setActiveTab }
}
