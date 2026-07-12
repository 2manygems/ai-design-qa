import { useAnalysisStore } from './services/store/analysisStore'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const status = useAnalysisStore((state) => state.status)

  return status === 'done' ? <DashboardPage /> : <UploadPage />
}

export default App
