import { useState } from 'react'
import { LayoutDashboard, Kanban, Bot, Settings, FileText, Shield, Network, ChevronDown, Bell, Search, Plus, Menu, Factory } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import KanbanBoard from './pages/KanbanBoard'
import AgentCenter from './pages/AgentCenter'
import RuleEngine from './pages/RuleEngine'
import EngineeringView from './pages/EngineeringView'
import SettingsPage from './pages/SettingsPage'

const navItems = [
  { id: 'dashboard', label: '工作台大盘', icon: LayoutDashboard },
  { id: 'kanban', label: '流水线看板', icon: Kanban },
  { id: 'agents', label: 'Agent中心', icon: Bot },
  { id: 'rules', label: '规则引擎', icon: Shield },
  { id: 'engineering', label: '工程链路', icon: Network },
  { id: 'settings', label: '系统设置', icon: Settings }
]

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAgentTip, setShowAgentTip] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'kanban': return <KanbanBoard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      case 'agents': return <AgentCenter />
      case 'rules': return <RuleEngine />
      case 'engineering': return <EngineeringView />
      case 'settings': return <SettingsPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2E3F4D] border border-gray-200/50 rounded-xl flex items-center justify-center">
                <Factory className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">智能软件工厂</h1>
                <p className="text-xs text-gray-500">Smart Factory</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#2E3F4D] border border-gray-200/50 rounded-xl flex items-center justify-center mx-auto">
              <Factory className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">收起菜单</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索工单、项目、Agent..."
                className="w-80 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              新建工单
            </button>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              <div className="w-8 h-8 bg-[#2E3F4D] border border-gray-200/50 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-sm font-medium">A</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">Admin</p>
                <p className="text-xs text-gray-500">超级管理员</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
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
            <div className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#2E3F4D] border border-gray-200/50 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">智脑</h3>
                  <p className="text-xs text-green-500">在线</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
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
            <div className="absolute -top-2 -right-2 bg-[#2E3F4D] border border-gray-200/50 text-blue-400 text-xs font-bold px-2 py-1 rounded-full shadow-md">
              智脑
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App