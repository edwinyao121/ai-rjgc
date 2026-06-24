import { useState } from 'react'
import { Bot, Plus, Search, Settings, Activity, CheckCircle, XCircle, Loader, ChevronRight, Power, Pause, Play, MoreHorizontal, Clock, TrendingUp, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const agents = [
  {
    id: 1,
    name: '需求设计 Agent',
    description: '负责需求分析、系统设计、架构规划',
    status: 'running',
    role: 'designer',
    tasks: 45,
    successRate: 96,
    avgTime: '12分钟',
    color: 'indigo',
    tasksData: [
      { name: '周一', success: 5, failed: 0 },
      { name: '周二', success: 7, failed: 1 },
      { name: '周三', success: 6, failed: 0 },
      { name: '周四', success: 8, failed: 1 },
      { name: '周五', success: 5, failed: 0 },
      { name: '周六', success: 3, failed: 0 },
      { name: '周日', success: 2, failed: 0 }
    ]
  },
  {
    id: 2,
    name: '代码生成 Agent',
    description: '负责代码生成、代码审查、编译构建',
    status: 'running',
    role: 'developer',
    tasks: 67,
    successRate: 92,
    avgTime: '25分钟',
    color: 'purple',
    tasksData: [
      { name: '周一', success: 8, failed: 1 },
      { name: '周二', success: 10, failed: 2 },
      { name: '周三', success: 9, failed: 1 },
      { name: '周四', success: 11, failed: 2 },
      { name: '周五', success: 8, failed: 1 },
      { name: '周六', success: 4, failed: 0 },
      { name: '周日', success: 3, failed: 0 }
    ]
  },
  {
    id: 3,
    name: '测试质量 Agent',
    description: '负责单元测试、质量检测、安全扫描',
    status: 'idle',
    role: 'tester',
    tasks: 38,
    successRate: 98,
    avgTime: '18分钟',
    color: 'amber',
    tasksData: [
      { name: '周一', success: 4, failed: 0 },
      { name: '周二', success: 6, failed: 0 },
      { name: '周三', success: 5, failed: 1 },
      { name: '周四', success: 7, failed: 0 },
      { name: '周五', success: 5, failed: 0 },
      { name: '周六', success: 2, failed: 0 },
      { name: '周日', success: 1, failed: 0 }
    ]
  },
  {
    id: 4,
    name: '部署交付 Agent',
    description: '负责打包部署、环境配置、服务监控',
    status: 'running',
    role: 'deployer',
    tasks: 22,
    successRate: 100,
    avgTime: '8分钟',
    color: 'emerald',
    tasksData: [
      { name: '周一', success: 3, failed: 0 },
      { name: '周二', success: 4, failed: 0 },
      { name: '周三', success: 3, failed: 0 },
      { name: '周四', success: 5, failed: 0 },
      { name: '周五', success: 4, failed: 0 },
      { name: '周六', success: 2, failed: 0 },
      { name: '周日', success: 1, failed: 0 }
    ]
  }
]

const recentTasks = [
  { id: 'T-001', agent: '需求设计 Agent', task: '电商订单系统需求分析', status: 'completed', time: '12分钟', quality: 96 },
  { id: 'T-002', agent: '代码生成 Agent', task: '用户认证模块代码生成', status: 'completed', time: '25分钟', quality: 92 },
  { id: 'T-003', agent: '测试质量 Agent', task: '支付模块测试用例生成', status: 'running', time: '8分钟', quality: 0 },
  { id: 'T-004', agent: '部署交付 Agent', task: '物流服务Docker镜像构建', status: 'running', time: '3分钟', quality: 0 },
  { id: 'T-005', agent: '代码生成 Agent', task: '库存管理接口实现', status: 'failed', time: '30分钟', quality: 0 }
]

const statusColors = {
  running: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  idle: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
}

const colorMap = {
  indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'border-indigo-200' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
  amber: { bg: 'bg-amber-100', icon: 'text-amber-600', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-200' }
}

function AgentCard({ agent, onClick }) {
  const colors = colorMap[agent.color]
  const status = statusColors[agent.status]

  return (
    <div
      onClick={() => onClick(agent)}
      className={`bg-white rounded-xl p-10 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 cursor-pointer transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className={`${colors.bg} p-6 rounded-xl`}>
            <Bot className={`w-12 h-12 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{agent.name}</h3>
            <p className="text-[28px] text-gray-500">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full text-[24px] font-medium ${status.bg} ${status.text}`}>
            {agent.status === 'running' ? '运行中' : agent.status === 'idle' ? '空闲' : '异常'}
          </span>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <MoreHorizontal className="w-8 h-8 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-4">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-[48px] font-bold text-gray-800">{agent.tasks}</p>
          <p className="text-[24px] text-gray-500">总任务数</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-[48px] font-bold text-green-600">{agent.successRate}%</p>
          <p className="text-[24px] text-gray-500">成功率</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-[48px] font-bold text-gray-800">{agent.avgTime}</p>
          <p className="text-[24px] text-gray-500">平均耗时</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-[48px] font-bold text-blue-600">{agent.tasks}</p>
          <p className="text-[24px] text-gray-500">本周任务</p>
        </div>
      </div>

      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={agent.tasksData}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#1B2732', border: '1px solid rgba(187, 203, 217, 0.35)', borderRadius: '8px', fontSize: '12px', color: '#E5EAFF' }}
              itemStyle={{ color: '#E5EAFF' }}
              labelStyle={{ color: '#C9D2D9' }}
            />
            <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AgentCenter() {
  const [agentsData, setAgentsData] = useState(agents)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredAgents = agentsData.filter(agent => {
    const matchesSearch = agent.name.includes(searchTerm) || agent.description.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[48px] font-bold text-gray-800">Agent 管理中心</h1>
          <p className="text-gray-500 text-[28px] mt-1">管理、配置、监控所有 AI Agent</p>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-4 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-8 h-8" />
            注册新 Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <Bot className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <p className="text-[48px] font-bold text-gray-800">4</p>
              <p className="text-[24px] text-gray-500">全部 Agent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="bg-green-100 p-4 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <p className="text-[48px] font-bold text-gray-800">3</p>
              <p className="text-[24px] text-gray-500">运行中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <Pause className="w-10 h-10 text-gray-600" />
            </div>
            <div>
              <p className="text-[48px] font-bold text-gray-800">1</p>
              <p className="text-[24px] text-gray-500">空闲</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="bg-purple-100 p-4 rounded-lg">
              <Activity className="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <p className="text-[48px] font-bold text-gray-800">96%</p>
              <p className="text-[24px] text-gray-500">平均成功率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-8 mb-4">
          <div className="relative flex-1">
            <Search className="w-8 h-8 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索 Agent..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-8 py-4 text-[28px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-8 py-4 text-[28px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">全部状态</option>
            <option value="running">运行中</option>
            <option value="idle">空闲</option>
            <option value="error">异常</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {filteredAgents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onClick={setSelectedAgent} />
          ))}
        </div>
      </div>

      {selectedAgent && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-8">
              <div className={`${colorMap[selectedAgent.color].bg} p-8 rounded-xl`}>
                <Bot className={`w-16 h-16 ${colorMap[selectedAgent.color].icon}`} />
              </div>
              <div>
                <h2 className="text-[40px] font-bold text-gray-800">{selectedAgent.name}</h2>
                <p className="text-gray-500">{selectedAgent.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Settings className="w-10 h-10 text-gray-600" />
              </button>
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-[28px] text-gray-700"
              >
                关闭
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-8 mb-6">
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-[24px] text-gray-500 mb-1">绑定工位</p>
              <p className="font-semibold text-gray-800">
                {selectedAgent.role === 'designer' ? '设计工位' :
                 selectedAgent.role === 'developer' ? '开发工位' :
                 selectedAgent.role === 'tester' ? '测试工位' : '交付工位'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-[24px] text-gray-500 mb-1">总任务数</p>
              <p className="font-semibold text-gray-800">{selectedAgent.tasks}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-[24px] text-gray-500 mb-1">成功率</p>
              <p className="font-semibold text-green-600">{selectedAgent.successRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-[24px] text-gray-500 mb-1">平均耗时</p>
              <p className="font-semibold text-gray-800">{selectedAgent.avgTime}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-[24px] text-gray-500 mb-1">当前状态</p>
              <span className={`px-4 py-2 rounded-full text-[24px] font-medium ${statusColors[selectedAgent.status].bg} ${statusColors[selectedAgent.status].text}`}>
                {selectedAgent.status === 'running' ? '运行中' : selectedAgent.status === 'idle' ? '空闲' : '异常'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">任务趋势</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedAgent.tasksData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1B2732', border: '1px solid rgba(187, 203, 217, 0.35)', borderRadius: '8px', fontSize: '12px', color: '#E5EAFF' }}
                      itemStyle={{ color: '#E5EAFF' }}
                      labelStyle={{ color: '#C9D2D9' }}
                    />
                    <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="成功" />
                    <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="失败" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Agent 配置</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-6">
                    <Zap className="w-8 h-8 text-amber-500" />
                    <span className="text-[28px] text-gray-700">自动调度</span>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full relative">
                    <div className="w-10 h-10 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-6">
                    <Clock className="w-8 h-8 text-blue-500" />
                    <span className="text-[28px] text-gray-700">失败自动重试</span>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full relative">
                    <div className="w-10 h-10 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-6">
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                    <span className="text-[28px] text-gray-700">并行执行</span>
                  </div>
                  <div className="w-12 h-12 bg-gray-300 rounded-full relative">
                    <div className="w-10 h-10 bg-white rounded-full absolute left-0.5 top-0.5 shadow"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Agent 执行记录</h2>
          <button className="text-indigo-600 text-[28px] hover:underline">查看全部</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[28px] text-gray-500 border-b border-gray-100">
                <th className="pb-6 font-medium">任务ID</th>
                <th className="pb-6 font-medium">Agent</th>
                <th className="pb-6 font-medium">任务描述</th>
                <th className="pb-6 font-medium">状态</th>
                <th className="pb-6 font-medium">耗时</th>
                <th className="pb-6 font-medium">质量</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-6 text-[28px] font-mono text-gray-600">{task.id}</td>
                  <td className="py-6 text-[28px] text-gray-700">{task.agent}</td>
                  <td className="py-6 text-[28px] text-gray-700">{task.task}</td>
                  <td className="py-6">
                    <span className={`px-4 py-2 rounded-full text-[24px] font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {task.status === 'completed' ? '完成' : task.status === 'running' ? '进行中' : '失败'}
                    </span>
                  </td>
                  <td className="py-6 text-[28px] text-gray-600">{task.time}</td>
                  <td className="py-6 text-[28px]">
                    {task.quality > 0 ? (
                      <span className={task.quality >= 90 ? 'text-green-600' : 'text-amber-600'}>{task.quality}%</span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AgentCenter