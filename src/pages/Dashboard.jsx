import { Package, Clock, Code, FlaskConical, Rocket, CheckCircle, TrendingUp, AlertTriangle, Bot, Shield, ArrowRight } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const statsData = [
  { title: '在途工单', value: 24, change: '+3', trend: 'up', icon: Package, color: 'blue' },
  { title: '设计中', value: 5, change: '+1', trend: 'up', icon: Clock, color: 'cyan' },
  { title: '开发中', value: 8, change: '-2', trend: 'down', icon: Code, color: 'purple' },
  { title: '测试中', value: 4, change: '+1', trend: 'up', icon: FlaskConical, color: 'amber' },
  { title: '部署中', value: 3, change: '0', trend: 'neutral', icon: Rocket, color: 'emerald' },
  { title: '已完成', value: 127, change: '+12', trend: 'up', icon: CheckCircle, color: 'green' }
]

const trendData = [
  { name: '周一', completed: 4, blocked: 1 },
  { name: '周二', completed: 6, blocked: 2 },
  { name: '周三', completed: 8, blocked: 1 },
  { name: '周四', completed: 5, blocked: 3 },
  { name: '周五', completed: 9, blocked: 1 },
  { name: '周六', completed: 3, blocked: 0 },
  { name: '周日', completed: 2, blocked: 1 }
]

const pipelineDistData = [
  { name: '需求', value: 5, color: '#6366f1' },
  { name: '设计', value: 4, color: '#06b6d4' },
  { name: '开发', value: 8, color: '#8b5cf6' },
  { name: '测试', value: 4, color: '#f59e0b' },
  { name: '部署', value: 3, color: '#10b981' }
]

const agentPerformance = [
  { name: '需求设计', success: 96, failed: 4, tasks: 45 },
  { name: '代码生成', success: 92, failed: 8, tasks: 67 },
  { name: '测试质量', success: 98, failed: 2, tasks: 38 },
  { name: '部署交付', success: 100, failed: 0, tasks: 22 }
]

const recentTasks = [
  { id: 'WO-2024-001', name: '电商订单系统', stage: '开发中', progress: 55, creator: '张三', time: '5分钟前' },
  { id: 'WO-2024-002', name: '用户认证中心', stage: '测试中', progress: 78, creator: '李四', time: '2分钟前' },
  { id: 'WO-2024-003', name: '支付结算系统', stage: '部署中', progress: 92, creator: '王五', time: '1分钟前' },
  { id: 'WO-2024-004', name: '物流跟踪服务', stage: '设计中', progress: 35, creator: '赵六', time: '10分钟前' }
]

const gateBlocks = [
  { reason: '需求描述不完整', count: 5, trend: '+2' },
  { reason: '代码编译失败', count: 3, trend: '-1' },
  { reason: '测试覆盖率不足', count: 4, trend: '+1' },
  { reason: '高危漏洞未修复', count: 2, trend: '0' },
  { reason: '规范检查不通过', count: 3, trend: '+2' }
]

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', dot: 'bg-blue-500' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', dot: 'bg-cyan-500' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', dot: 'bg-purple-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', dot: 'bg-green-500' }
}

function StatCard({ data }) {
  const { title, value, change, trend, icon: Icon, color } = data
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-[28px]">{title}</p>
          <p className="text-[48px] font-bold text-gray-800 mt-1">{value}</p>
          <div className="flex items-center gap-2 mt-2">
            {trend === 'up' && <TrendingUp className="w-6 h-6 text-green-500" />}
            {trend === 'down' && <TrendingUp className="w-6 h-6 text-red-500 rotate-180" />}
            <span className={`text-[24px] ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
              {change} 较上周
            </span>
          </div>
        </div>
        <div className={`${colors.bg} p-6 rounded-xl`}>
          <Icon className={`w-12 h-12 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[48px] font-bold text-gray-800">工作台大盘</h1>
          <p className="text-gray-500 text-[28px] mt-1">实时监控软件工厂生产状态</p>
        </div>
        <div className="flex items-center gap-4 text-[28px] text-gray-500">
          <span className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></span>
          最后更新: 刚刚
        </div>
      </div>

      <div className="grid grid-cols-6 gap-8">
        {statsData.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 bg-white rounded-xl p-10 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">工单完成趋势</h2>
            <div className="flex items-center gap-8 text-[24px]">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500"></span> 完成
              </span>
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-400"></span> 拦截
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1B2732', border: '1px solid rgba(187, 203, 217, 0.35)', borderRadius: '8px', fontSize: '12px', color: '#E5EAFF' }}
                  itemStyle={{ color: '#E5EAFF' }}
                  labelStyle={{ color: '#C9D2D9' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="blocked" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">流水线分布</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pipelineDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1B2732', border: '1px solid rgba(187, 203, 217, 0.35)', borderRadius: '8px', fontSize: '12px', color: '#E5EAFF' }}
                  itemStyle={{ color: '#E5EAFF' }}
                  labelStyle={{ color: '#C9D2D9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {pipelineDistData.map((item, index) => (
              <div key={index} className="flex items-center gap-4 text-[24px]">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12">
        <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">最近工单</h2>
            <button className="text-blue-600 text-[28px] hover:underline flex items-center gap-2">
              查看全部 <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6">
            {recentTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Code className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-[28px]">{task.name}</p>
                    <p className="text-[24px] text-gray-500">{task.id} · {task.creator}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[24px] px-4 py-2 bg-blue-50 text-blue-600 rounded-full">{task.stage}</span>
                  <p className="text-[24px] text-gray-500 mt-1">{task.progress}% · {task.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Agent 性能</h2>
            <div className="flex items-center gap-2 text-[24px] text-gray-500">
              <Bot className="w-6 h-6" />
              4 个 Agent
            </div>
          </div>
          <div className="space-y-6">
            {agentPerformance.map((agent, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[28px] font-medium text-gray-700">{agent.name}</span>
                  <span className="text-[24px] text-gray-500">{agent.tasks} 任务</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${agent.success}%` }}></div>
                  </div>
                  <span className="text-[24px] font-medium text-green-600">{agent.success}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">门禁拦截</h2>
            <div className="flex items-center gap-2 text-[24px] text-red-500">
              <AlertTriangle className="w-6 h-6" />
              本周 17 次
            </div>
          </div>
          <div className="space-y-4">
            {gateBlocks.map((block, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <Shield className="w-8 h-8 text-amber-500" />
                  <span className="text-[28px] text-gray-700">{block.reason}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[28px] font-medium text-gray-800">{block.count}</span>
                  <span className={`text-[24px] ${block.trend.startsWith('+') ? 'text-red-500' : block.trend.startsWith('-') ? 'text-green-500' : 'text-gray-400'}`}>
                    {block.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard