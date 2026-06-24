import { useState } from 'react'
import { LayoutDashboard, Kanban, Bot, Settings, FileText, Shield, Network, ChevronDown, Bell, Search, Plus, Menu, Factory, ShoppingBag } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import KanbanBoard, { AppSimulator } from './pages/KanbanBoard'
import AppStore from './pages/AppStore'
import AgentCenter from './pages/AgentCenter'
import RuleEngine from './pages/RuleEngine'
import EngineeringView from './pages/EngineeringView'
import SettingsPage from './pages/SettingsPage'

const navItems = [
  { id: 'dashboard', label: '工作台大盘', icon: LayoutDashboard },
  { id: 'kanban', label: '应用生产线', icon: Kanban },
  { id: 'appstore', label: '应用商店', icon: ShoppingBag },
  { id: 'agents', label: 'Agent中心', icon: Bot },
  { id: 'rules', label: '规则引擎', icon: Shield },
  { id: 'engineering', label: '工程链路', icon: Network },
  { id: 'settings', label: '系统设置', icon: Settings }
]

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAgentTip, setShowAgentTip] = useState(false)
  const [newWorkOrderRequest, setNewWorkOrderRequest] = useState(0)

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

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'kanban': return <KanbanBoard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} newWorkOrderRequest={newWorkOrderRequest} />
      case 'appstore': return <AppStore />
      case 'agents': return <AgentCenter />
      case 'rules': return <RuleEngine />
      case 'engineering': return <EngineeringView />
      case 'settings': return <SettingsPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`${sidebarOpen ? 'w-56 border-r border-gray-200' : 'w-0 overflow-hidden border-none'} bg-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-white flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#22d3ee] rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-[20px] bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-wide leading-tight truncate">
                  智能软件工厂
                </h1>
                <p className="text-[18px] text-gray-400 tracking-wider font-semibold uppercase leading-none mt-0.5 truncate">
                  Smart Factory
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#22d3ee] rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 mx-auto">
              <Factory className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-3 px-4 py-3 mx-3 my-0.5 rounded-lg transition-all duration-200 group text-[20px] ${
                  isActive
                    ? 'bg-blue-50/80 text-blue-600 font-semibold shadow-sm shadow-blue-500/5'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-[20px] font-medium"
          >
            <Menu className="w-5 h-5 text-gray-400" />
            {sidebarOpen && <span>收起菜单</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-3 bg-white hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 shadow-md flex items-center justify-center"
            title="展开菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className={`flex-1 overflow-auto p-4 lg:p-6 ${sidebarOpen ? '' : 'pl-20 lg:pl-20'}`}>
          {renderPage()}
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
