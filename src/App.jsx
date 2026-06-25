import { useState } from 'react'
import KanbanBoard, { AppSimulator } from './pages/KanbanBoard'

function App() {
  // Check for simulator mode
  const urlParams = new URLSearchParams(window.location.search)
  const simulatorAppIdStr = urlParams.get('simulator')
  if (simulatorAppIdStr) {
    const appId = parseInt(simulatorAppIdStr, 10)
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="w-full h-full max-w-6xl">
          <AppSimulator appId={appId} onClose={() => window.close()} closeLabel="关闭模拟器窗口" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <main className="flex-1 min-w-0 flex flex-col relative">
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <KanbanBoard />
        </div>
      </main>
    </div>
  )
}

export default App
