import { useState } from 'react'
import { Bot } from 'lucide-react'
import KanbanBoard, { AppSimulator } from './pages/KanbanBoard'

function App() {
  const [showAgentTip, setShowAgentTip] = useState(false)

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

      <div className="fixed bottom-6 right-6 z-50">
        <div
          className="relative cursor-pointer group"
          onMouseEnter={() => setShowAgentTip(true)}
          onMouseLeave={() => setShowAgentTip(false)}
        >
          {showAgentTip && (
            <div className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-xl p-8 border border-gray-200">
              <div className="flex items-center gap-6 mb-3">
                <div className="w-10 h-10 bg-[#2E3F4D] border border-gray-200/50 rounded-full flex items-center justify-center">
                  <Bot className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">智脑</h3>
                  <p className="text-[24px] text-green-500">在线</p>
                </div>
              </div>
              <p className="text-[28px] text-gray-600 leading-relaxed">
                你好，我是软件工厂超级智能体，能帮你完成智能需求分析、智能设计、智能开发、智能测试、智能部署等软件研发全链路工作
              </p>
            </div>
          )}
          <div className="w-16 h-16 relative">
            <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2E3F4D"/>
                  <stop offset="100%" stopColor="#1B2732"/>
                </linearGradient>
                <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#22d3ee"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <ellipse cx="32" cy="38" rx="18" ry="20" fill="url(#headGrad)" filter="url(#glow)"/>
              <rect x="14" y="18" width="36" height="4" rx="2" fill="#3b82f6"/>
              <rect x="20" y="30" width="8" height="8" rx="1" fill="url(#faceGrad)"/>
              <rect x="36" y="30" width="8" height="8" rx="1" fill="url(#faceGrad)"/>
              <rect x="26" y="42" width="12" height="3" rx="1" fill="#1B2732"/>
              <circle cx="20" cy="30" r="2" fill="#22d3ee"/>
              <circle cx="44" cy="30" r="2" fill="#22d3ee"/>
              <rect x="8" y="28" width="6" height="16" rx="3" fill="url(#headGrad)"/>
              <rect x="50" y="28" width="6" height="16" rx="3" fill="url(#headGrad)"/>
              <ellipse cx="32" cy="14" rx="10" ry="4" fill="url(#headGrad)"/>
              <circle cx="32" cy="10" r="3" fill="#22d3ee" filter="url(#glow)"/>
            </svg>
            <div className="absolute -top-2 -right-2 bg-[#2E3F4D] border border-gray-200/50 text-blue-400 text-[24px] font-bold px-4 py-2 rounded-full shadow-md">
              智脑
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
