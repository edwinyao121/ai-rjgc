import { useState } from 'react'
import { Lock, Clock, User, Bot, CheckCircle, ChevronRight, FileCode, FlaskConical, Rocket, GitBranch, Package, FileText, Eye, Globe, Shield, Edit, Link, ClipboardCheck, Server, Download } from 'lucide-react'

const workOrders = [
  {
    id: 1,
    title: '电商订单系统',
    domain: '电商域',
    priority: 'high',
    creator: '张三',
    progress: 60,
    lastUpdate: '5分钟前',
    currentStage: 4,
    stages: [
      {
        id: 1,
        name: '需求待入厂',
        icon: Package,
        status: 'completed',
        time: '10:00',
        duration: '5分钟',
        gate: { entry: null, exit: '需求校验' },
        items: [
          { type: 'input', label: '原始需求', value: '电商订单全流程管理' },
          { type: 'ai', label: 'AI 需求分析', value: '已拆解为 12 个功能模块' }
        ],
        outputs: [
          { label: '《需求规格说明书》', status: 'done', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '需求完整性审核', status: 'passed', reviewer: '张三', time: '10:00' }
        ]
      },
      {
        id: 2,
        name: '系统设计',
        icon: GitBranch,
        status: 'completed',
        time: '10:05',
        duration: '25分钟',
        gate: { entry: '需求通过', exit: '设计完备' },
        items: [
          { type: 'ai', label: '架构方案', value: '前后端分离架构' },
          { type: 'ai', label: '模块划分', value: '8 个核心模块' },
          { type: 'ai', label: '接口定义', value: '45 个 RESTful API' }
        ],
        outputs: [
          { label: '《软件设计说明书》', status: 'done', url: '#' },
          { label: '《接口设计文档》', status: 'done', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '设计评审', status: 'passed', reviewer: '李四', time: '10:30' }
        ]
      },
      {
        id: 3,
        name: '智能编码',
        icon: FileCode,
        status: 'completed',
        time: '10:30',
        duration: '45分钟',
        gate: { entry: '设计完备', exit: '编译通过' },
        items: [
          { type: 'ai', label: '代码生成', value: '125 个源文件' },
          { type: 'ai', label: '编译构建', value: '构建成功' },
          { type: 'ai', label: '代码规范', value: '合规检查通过' }
        ],
        outputs: [
          { label: '代码仓库', value: 'git@code.example.com:ecommerce-order.git', isLink: true },
          { label: '构建产物', value: 'order-service-v1.0.0.jar', isFile: true }
        ],
        reviews: [
          { type: '智能检视', label: 'CodeReview', status: 'passed', issues: '0 严重问题' }
        ]
      },
      {
        id: 4,
        name: '测试质检',
        icon: FlaskConical,
        status: 'active',
        time: '11:15',
        duration: '进行中',
        gate: { entry: '编译通过', exit: '质检通过' },
        items: [
          { type: 'ai', label: '测试用例', value: '生成 86 条用例' },
          { type: 'ai', label: '用例执行', value: '执行中 3/5', progress: 60 },
          { type: 'ai', label: '覆盖率', value: '当前 72%' }
        ],
        outputs: [
          { label: '《测试报告》', status: 'pending', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '测试评审', status: 'pending', reviewer: '-', time: '-' }
        ]
      },
      {
        id: 5,
        name: '部署交付',
        icon: Rocket,
        status: 'pending',
        time: '-',
        duration: '-',
        gate: { entry: '质检通过', exit: '部署成功' },
        items: [
          { type: 'pending', label: '打包部署', value: '等待测试完成' },
          { type: 'pending', label: '环境配置', value: '-' },
          { type: 'pending', label: '健康检查', value: '-' }
        ],
        outputs: [
          { label: '访问地址', value: '待分配', isLink: true }
        ],
        reviews: [
          { type: '人工审核', label: '上线审批', status: 'pending', reviewer: '-', time: '-' }
        ]
      }
    ]
  },
  {
    id: 2,
    title: '用户认证中心',
    domain: '基础域',
    priority: 'critical',
    creator: '李四',
    progress: 95,
    lastUpdate: '2分钟前',
    currentStage: 5,
    stages: [
      {
        id: 1,
        name: '需求分析',
        icon: Package,
        status: 'completed',
        time: '09:30',
        duration: '5分钟',
        gate: { entry: null, exit: '需求校验' },
        items: [
          { type: 'input', label: '原始需求', value: '统一身份认证中心' }
        ],
        outputs: [
          { label: '《需求规格说明书》', status: 'done', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '需求完整性审核', status: 'passed', reviewer: '李四', time: '09:30' }
        ]
      },
      {
        id: 2,
        name: '系统设计',
        icon: GitBranch,
        status: 'completed',
        time: '09:35',
        duration: '20分钟',
        gate: { entry: '需求通过', exit: '设计完备' },
        items: [
          { type: 'ai', label: '架构方案', value: 'OAuth2.0 + JWT 方案' },
          { type: 'ai', label: '模块划分', value: '6 个核心模块' },
          { type: 'ai', label: '接口定义', value: '32 个 RESTful API' }
        ],
        outputs: [
          { label: '《软件设计说明书》', status: 'done', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '设计评审', status: 'passed', reviewer: '王五', time: '09:55' }
        ]
      },
      {
        id: 3,
        name: '智能编码',
        icon: FileCode,
        status: 'completed',
        time: '09:55',
        duration: '40分钟',
        gate: { entry: '设计完备', exit: '编译通过' },
        items: [
          { type: 'ai', label: '代码生成', value: '98 个源文件' },
          { type: 'ai', label: '编译构建', value: '构建成功' },
          { type: 'ai', label: '代码规范', value: '合规检查通过' }
        ],
        outputs: [
          { label: '代码仓库', value: 'git@code.example.com:auth-center.git', isLink: true }
        ],
        reviews: [
          { type: '智能检视', label: 'CodeReview', status: 'passed', issues: '0 严重问题' }
        ]
      },
      {
        id: 4,
        name: '测试质检',
        icon: FlaskConical,
        status: 'completed',
        time: '10:35',
        duration: '30分钟',
        gate: { entry: '编译通过', exit: '质检通过' },
        items: [
          { type: 'ai', label: '测试用例', value: '生成 72 条用例' },
          { type: 'ai', label: '用例执行', value: '执行完成 72/72' },
          { type: 'ai', label: '覆盖率', value: '96%' }
        ],
        outputs: [
          { label: '《测试报告》', status: 'done', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '测试评审', status: 'passed', reviewer: '赵六', time: '11:05' }
        ]
      },
      {
        id: 5,
        name: '部署交付',
        icon: Rocket,
        status: 'active',
        time: '11:05',
        duration: '进行中',
        gate: { entry: '质检通过', exit: '部署成功' },
        items: [
          { type: 'ai', label: '打包部署', value: '部署中 2/3 环境' },
          { type: 'ai', label: '环境配置', value: '预发环境: 完成' },
          { type: 'ai', label: '健康检查', value: '生产环境: 检查中' }
        ],
        outputs: [
          { label: '访问地址', value: 'https://auth.example.com', isLink: true },
          { label: '预发地址', value: 'https://auth-pre.example.com', isLink: true }
        ],
        reviews: [
          { type: '人工审核', label: '上线审批', status: 'in_progress', reviewer: '周八', time: '11:05' }
        ]
      }
    ]
  }
]

const priorityTextColors = { critical: 'text-red-600 bg-red-50', high: 'text-orange-600 bg-orange-50', medium: 'text-yellow-600 bg-yellow-50', low: 'text-gray-600 bg-gray-100' }
const stageColors = {
  1: { bg: 'bg-slate-50', border: 'border-slate-300', header: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-600' },
  2: { bg: 'bg-indigo-50', border: 'border-indigo-300', header: 'bg-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-600' },
  3: { bg: 'bg-purple-50', border: 'border-purple-300', header: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
  4: { bg: 'bg-amber-50', border: 'border-amber-300', header: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
  5: { bg: 'bg-emerald-50', border: 'border-emerald-300', header: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' }
}

const itemTypeIcons = {
  input: FileText,
  ai: Bot,
  pending: Clock
}

function StageCard({ stage, index, isLast }) {
  const colors = stageColors[stage.id]
  const Icon = stage.icon
  const ItemIcon = itemTypeIcons[stage.items[0]?.type] || Bot

  return (
    <div className={`w-56 rounded-xl ${colors.bg} border-2 ${colors.border} flex flex-col flex-shrink-0 ${
      stage.status === 'active' ? 'ring-2 ring-blue-400 shadow-lg' : ''
    } ${stage.status === 'pending' ? 'opacity-70' : ''}`}>
      <div className={`${colors.header} rounded-t-xl px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`font-semibold text-sm ${colors.text}`}>{stage.name}</span>
        </div>
        {stage.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {stage.status === 'active' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
        {stage.status === 'pending' && <Lock className="w-4 h-4 text-gray-400" />}
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className="text-xs text-gray-500">
          <span>{stage.time}</span>
          <span className="mx-1">·</span>
          <span className={stage.status === 'active' ? 'text-blue-600 font-medium' : ''}>{stage.duration}</span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">环节内容</p>
          {stage.items.map((item, i) => {
            const ItemTypeIcon = itemTypeIcons[item.type] || Bot
            return (
              <div key={i} className="bg-white/80 rounded-lg p-2 border border-gray-200/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <ItemTypeIcon className={`w-3 h-3 ${item.type === 'ai' ? 'text-blue-500' : item.type === 'input' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-800 truncate flex-1">{item.value}</span>
                  {item.progress !== undefined && (
                    <span className="text-xs text-blue-600 ml-1">{item.progress}%</span>
                  )}
                </div>
                {item.progress !== undefined && (
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">输出物</p>
          {stage.outputs.map((output, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/80 rounded-lg p-2 border border-gray-200/50">
              {output.isLink ? (
                <>
                  <Link className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-gray-800 truncate flex-1">{output.value}</span>
                </>
              ) : output.isFile ? (
                <>
                  <Download className="w-3 h-3 text-purple-500 flex-shrink-0" />
                  <span className="text-xs text-gray-800 truncate flex-1">{output.value}</span>
                </>
              ) : (
                <>
                  <FileText className={`w-3 h-3 flex-shrink-0 ${output.status === 'done' ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={`text-xs flex-1 ${output.status === 'done' ? 'text-gray-800' : 'text-gray-400'}`}>{output.label}</span>
                  {output.status === 'done' && <CheckCircle className="w-3 h-3 text-green-500" />}
                  {output.status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">审核环节</p>
          {stage.reviews.map((review, i) => (
            <div key={i} className="bg-white/80 rounded-lg p-2 border border-gray-200/50">
              <div className="flex items-center gap-1.5 mb-1">
                {review.type === '人工审核' && <User className="w-3 h-3 text-purple-500" />}
                {review.type === '智能检视' && <Eye className="w-3 h-3 text-blue-500" />}
                <span className="text-xs font-medium text-gray-600">{review.label}</span>
              </div>
              <div className="flex items-center justify-between">
                {review.status === 'passed' && (
                  <span className="text-xs text-green-600">已通过</span>
                )}
                {review.status === 'pending' && (
                  <span className="text-xs text-amber-600">待审核</span>
                )}
                {review.status === 'in_progress' && (
                  <span className="text-xs text-blue-600">审核中</span>
                )}
                {review.reviewer && (
                  <span className="text-xs text-gray-500">{review.reviewer}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`px-3 py-2 border-t ${colors.border} rounded-b-xl`}>
        <div className="flex items-center justify-between text-xs">
          <span className={colors.text}>准出: {stage.gate.exit}</span>
        </div>
      </div>
    </div>
  )
}

function WorkOrderCard({ order, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          order.priority === 'critical' ? 'bg-gradient-to-br from-red-500 to-orange-600' :
          'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          <span className="text-white font-bold text-sm">{order.title[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 text-sm truncate">{order.title}</h3>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${priorityTextColors[order.priority]}`}>
              {order.priority === 'critical' ? '紧急' : order.priority === 'high' ? '高' : '中'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{order.domain} · {order.creator}</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">当前阶段</span>
          <span className="font-medium text-blue-600 truncate ml-2">
            {order.stages.find(s => s.status === 'active')?.name.replace('中', '') || '已完成'}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            style={{ width: `${order.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>WO-{String(order.id).padStart(3, '0')}</span>
        <span>{order.progress}%</span>
      </div>
    </div>
  )
}

function KanbanBoard() {
  const [selectedOrder, setSelectedOrder] = useState(workOrders[0])
  const [orders] = useState(workOrders)

  const completedCount = selectedOrder.stages.filter(s => s.status === 'completed').length
  const activeCount = selectedOrder.stages.filter(s => s.status === 'active').length
  const pendingCount = selectedOrder.stages.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">流水线看板</h1>
          <p className="text-gray-500 text-sm mt-1">软件系统生产全链路可视化</p>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-72 flex-shrink-0 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm px-1">软件系统列表 ({orders.length})</h2>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            {orders.map(order => (
              <WorkOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">{selectedOrder.title}</h2>
              <p className="text-sm text-gray-500">{selectedOrder.domain} · {selectedOrder.creator} · {selectedOrder.lastUpdate}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-green-700">{completedCount} 完成</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-700">{activeCount} 进行中</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                <Lock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">{pendingCount} 等待</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex items-start gap-2 h-full pb-2">
              {selectedOrder.stages.map((stage, index) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  isLast={index === selectedOrder.stages.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KanbanBoard