import { useState, useEffect, useRef } from 'react'
import { Lock, Clock, User, Bot, CheckCircle, ChevronRight, FileCode, FlaskConical, Rocket, GitBranch, Package, FileText, Eye, Globe, Shield, Edit, Link, ClipboardCheck, Server, Download, Wind, Compass, AlertTriangle, Map, MapPin, ChevronLeft, RefreshCw, Sliders, Radio, Activity, Target, MessageSquare, X } from 'lucide-react'

const workOrders = [
  {
    id: 1,
    title: '航母母港潮汐窗口计算器',
    domain: '海洋域',
    priority: 'high',
    creator: '张三',
    progress: 80,
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
          { type: 'input', label: '原始需求', value: '接入四大航母母港潮汐数据，根据12.8米吃水阈值计算可出港时间窗并显示倒计时。' },
          { type: 'ai', label: 'AI 需求分析', value: '拆解为数据抓取、吃水深度校验、仪表盘展示和倒计时计算模块' }
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
          { type: 'ai', label: '架构方案', value: '潮汐API集成 + 四格仪表盘前端 + 10分钟刷新机制' },
          { type: 'ai', label: '接口定义', value: '4 个港口潮汐数据对接 API' }
        ],
        outputs: [
          { label: '《系统设计说明书》', status: 'done', url: '#' }
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
          { type: 'ai', label: '代码生成', value: '生成 10 分钟轮询抓取及倒计时计算逻辑' },
          { type: 'ai', label: '编译构建', value: '构建成功' }
        ],
        outputs: [
          { label: '代码仓库', value: 'git@code.example.com:tide-calculator.git', isLink: true },
          { label: '构建产物', value: 'tide-service-v1.0.0.jar', isFile: true }
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
          { type: 'ai', label: '测试用例', value: '生成 24 条用例（吃水深度边界、时间窗倒计时校验等）' },
          { type: 'ai', label: '用例执行', value: '执行中 18/24', progress: 75 },
          { type: 'ai', label: '覆盖率', value: '当前 88%' }
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
          { type: 'pending', label: '环境配置', value: '-' }
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
    title: '甲板风实时计算器',
    domain: '航空域',
    priority: 'critical',
    creator: '李四',
    progress: 95,
    lastUpdate: '2分钟前',
    currentStage: 5,
    stages: [
      {
        id: 1,
        name: '需求待入厂',
        icon: Package,
        status: 'completed',
        time: '09:30',
        duration: '5分钟',
        gate: { entry: null, exit: '需求校验' },
        items: [
          { type: 'input', label: '原始需求', value: '接入全球风场数据，设定最小风速阈值20节，叠加航母30节航速计算合成甲板风。' }
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
          { type: 'ai', label: '架构方案', value: '全球气象格点风场集成 + 向量合成算法 + 5分钟定时刷新' }
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
          { type: 'ai', label: '代码生成', value: '向量叠加算法模块、多区域风速合成引擎' }
        ],
        outputs: [
          { label: '代码仓库', value: 'git@code.example.com:deck-wind.git', isLink: true }
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
          { type: 'ai', label: '测试用例', value: '生成 45 条用例（覆盖顺风、逆风、临界起降风速等）' },
          { type: 'ai', label: '用例执行', value: '执行完成 45/45' },
          { type: 'ai', label: '覆盖率', value: '94%' }
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
          { label: '访问地址', value: 'https://deck-wind.example.com', isLink: true },
          { label: '预发地址', value: 'https://deck-wind-pre.example.com', isLink: true }
        ],
        reviews: [
          { type: '人工审核', label: '上线审批', status: 'in_progress', reviewer: '周八', time: '11:05' }
        ]
      }
    ]
  },
  {
    id: 3,
    title: '海域网格商船密度异常告警器',
    domain: '监控域',
    priority: 'high',
    creator: '王五',
    progress: 40,
    lastUpdate: '10分钟前',
    currentStage: 2,
    stages: [
      {
        id: 1,
        name: '需求待入厂',
        icon: Package,
        status: 'completed',
        time: '08:30',
        duration: '10分钟',
        gate: { entry: null, exit: '需求校验' },
        items: [
          { type: 'input', label: '原始需求', value: '接入AIS位置数据，按50海里网格监控，相比30天均值低于70%黄警，低于50%红警，3分钟刷新。' }
        ],
        outputs: [
          { label: '《需求规格说明书》', status: 'done', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '需求完整性审核', status: 'passed', reviewer: '王五', time: '08:40' }
        ]
      },
      {
        id: 2,
        name: '系统设计',
        icon: GitBranch,
        status: 'active',
        time: '08:45',
        duration: '进行中',
        gate: { entry: '需求通过', exit: '设计完备' },
        items: [
          { type: 'ai', label: '架构方案', value: 'AIS数据流引擎 + 网格化密度统计算法 + 3分钟滑动平均比对机制' },
          { type: 'ai', label: '算法模型', value: '网格基准线计算及突变告警规则' }
        ],
        outputs: [
          { label: '《系统设计说明书》', status: 'pending', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '设计评审', status: 'pending', reviewer: '-', time: '-' }
        ]
      },
      {
        id: 3,
        name: '智能编码',
        icon: FileCode,
        status: 'pending',
        time: '-',
        duration: '-',
        gate: { entry: '设计完备', exit: '编译通过' },
        items: [
          { type: 'pending', label: '编码开发', value: '等待设计文档完成' }
        ],
        outputs: [
          { label: '代码仓库', value: '未创建', isLink: false }
        ],
        reviews: [
          { type: '智能检视', label: 'CodeReview', status: 'pending' }
        ]
      },
      {
        id: 4,
        name: '测试质检',
        icon: FlaskConical,
        status: 'pending',
        time: '-',
        duration: '-',
        gate: { entry: '编译通过', exit: '质检通过' },
        items: [
          { type: 'pending', label: '用例准备', value: '待编码完成后生成' }
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
          { type: 'pending', label: '打包部署', value: '等待测试完成' }
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
    id: 4,
    title: '开源社区异常监测',
    domain: '情报域',
    priority: 'medium',
    creator: '赵六',
    progress: 20,
    lastUpdate: '30分钟前',
    currentStage: 1,
    stages: [
      {
        id: 1,
        name: '需求待入厂',
        icon: Package,
        status: 'active',
        time: '11:00',
        duration: '进行中',
        gate: { entry: null, exit: '需求校验' },
        items: [
          { type: 'input', label: '原始需求', value: '接入Twitter/Insta公开接口，抓取含航母军舰等位置帖子，在地图上绘制目击热度散点图，检测突发目击潮。' },
          { type: 'ai', label: '需求分析', value: '支持关键词多语言搜索、EXIF及文本地理实体提取、同一海域目击事件多账户空间聚类。' }
        ],
        outputs: [
          { label: '《需求规格说明书》', status: 'pending', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '需求完整性审核', status: 'in_progress', reviewer: '赵六', time: '11:00' }
        ]
      },
      {
        id: 2,
        name: '系统设计',
        icon: GitBranch,
        status: 'pending',
        time: '-',
        duration: '-',
        gate: { entry: '需求通过', exit: '设计完备' },
        items: [
          { type: 'pending', label: '架构设计', value: '抓取器 + 坐标解析器 + 空间聚类服务 + 散点图可视化前端' }
        ],
        outputs: [
          { label: '《系统设计文档》', status: 'pending', url: '#' }
        ],
        reviews: [
          { type: '人工审核', label: '设计评审', status: 'pending', reviewer: '-', time: '-' }
        ]
      },
      {
        id: 3,
        name: '智能编码',
        icon: FileCode,
        status: 'pending',
        time: '-',
        duration: '-',
        gate: { entry: '设计完备', exit: '编译通过' },
        items: [
          { type: 'pending', label: '代码生成', value: '待设计完成' }
        ],
        outputs: [
          { label: '代码仓库', value: '未创建', isLink: false }
        ],
        reviews: [
          { type: '智能检视', label: 'CodeReview', status: 'pending' }
        ]
      },
      {
        id: 4,
        name: '测试质检',
        icon: FlaskConical,
        status: 'pending',
        time: '-',
        duration: '-',
        gate: { entry: '编译通过', exit: '质检通过' },
        items: [
          { type: 'pending', label: '用例准备', value: '待编码完成后生成' }
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
          { type: 'pending', label: '部署', value: '等待测试完成' }
        ],
        outputs: [
          { label: '访问地址', value: '待分配', isLink: true }
        ],
        reviews: [
          { type: '人工审核', label: '上线审批', status: 'pending', reviewer: '-', time: '-' }
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

// Simulators
function TideCalculatorSimulator() {
  const [tides, setTides] = useState([
    { name: '诺福克港 (Norfolk)', tide: 13.5, time: '14:00 - 18:30', status: 'open', countdown: '' },
    { name: '圣迭戈港 (San Diego)', tide: 11.4, time: '19:40 - 23:15', status: 'closed', countdown: '01小时35分钟' },
    { name: '布雷默顿港 (Bremerton)', tide: 14.1, time: '12:30 - 17:00', status: 'open', countdown: '' },
    { name: '横须贺港 (Yokosuka)', tide: 12.1, time: '21:10 - 01:45', status: 'closed', countdown: '03小时12分钟' }
  ])
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setTides(prev => prev.map(t => {
        const change = (Math.random() - 0.5) * 0.4
        const newTide = Math.round((t.tide + change) * 10) / 10
        const isSatisfied = newTide >= 12.8
        return {
          ...t,
          tide: newTide,
          status: isSatisfied ? 'open' : 'closed',
          countdown: isSatisfied ? '' : `${Math.floor(Math.random() * 3) + 1}小时${Math.floor(Math.random() * 50) + 10}分钟`
        }
      }))
      setRefreshing(false)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-300">潮汐数据源已接入 (每10分钟自动刷新)</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#243340] border border-blue-500/30 hover:border-blue-500/80 text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50 rounded text-xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          手动拉取最新数据
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {tides.map((port, idx) => (
          <div key={idx} className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">{port.name}</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                port.status === 'open' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                {port.status === 'open' ? '窗口开放' : '窗口关闭'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1B2732] rounded-lg p-3 border border-slate-700/30">
                <span className="text-xs text-slate-300 block mb-1">当前潮高</span>
                <span className={`text-2xl font-black ${port.tide >= 12.8 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {port.tide} 米
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">吃水阈值: 12.8 米</span>
              </div>

              <div className="bg-[#1B2732] rounded-lg p-3 border border-slate-700/30 flex flex-col justify-center">
                {port.status === 'open' ? (
                  <>
                    <span className="text-xs text-slate-300 block mb-1">当前窗口截止</span>
                    <span className="text-sm font-semibold text-slate-200">{port.time}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-300 block mb-1">距离下一个窗口</span>
                    <span className="text-base font-bold text-red-400 animate-pulse">{port.countdown}</span>
                  </>
                )}
              </div>
            </div>

            <div className="h-16 relative bg-[#1B2732]/45 rounded-lg border border-slate-700/40 overflow-hidden flex items-end">
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 60">
                <line x1="0" y1="26" x2="300" y2="26" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                <text x="230" y="20" fill="#ef4444" className="text-[8px]">12.8米吃水线</text>
                <path
                  d={`M 0 ${35 - Math.sin(0)*15} Q 75 ${35 - Math.sin(1.5)*15} 150 ${35 - Math.sin(3)*15} T 300 ${35 - Math.sin(6)*15}`}
                  fill="none"
                  stroke={port.status === 'open' ? '#10b981' : '#38bdf8'}
                  strokeWidth="2"
                />
                <circle cx="150" cy={35 - Math.sin(3)*15} r="4" fill={port.status === 'open' ? '#10b981' : '#ef4444'} className="animate-ping" />
                <circle cx="150" cy={35 - Math.sin(3)*15} r="3" fill={port.status === 'open' ? '#10b981' : '#ef4444'} />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeckWindCalculatorSimulator() {
  const [windSpeed, setWindSpeed] = useState(12)
  const [windAngle, setWindAngle] = useState(45)
  const [carrierSpeed, setCarrierSpeed] = useState(25)
  const [carrierHeading, setCarrierHeading] = useState(0)

  const windRad = ((windAngle - carrierHeading) * Math.PI) / 180
  const vrx = -windSpeed * Math.sin(windRad)
  const vry = -windSpeed * Math.cos(windRad) - carrierSpeed
  const relativeSpeed = Math.round(Math.sqrt(vrx * vrx + vry * vry) * 10) / 10
  let relativeAngle = Math.round(Math.atan2(-vrx, -vry) * 180 / Math.PI)
  if (relativeAngle < 0) relativeAngle += 360

  const isSpeedOk = relativeSpeed >= 20
  const isAngleOk = relativeAngle <= 15 || relativeAngle >= 345
  const isSafe = isSpeedOk && isAngleOk

  const trueWindRad = (windAngle * Math.PI) / 180
  const twx = 100 - Math.sin(trueWindRad) * 40
  const twy = 100 - Math.cos(trueWindRad) * 40

  const relWindRad = (relativeAngle * Math.PI) / 180
  const rwx = 100 + Math.sin(relWindRad) * 60
  const rwy = 100 + Math.cos(relWindRad) * 60

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-5 space-y-5 col-span-1">
        <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          输入计算参数
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">真风风速 (knots)</span>
              <span className="font-bold text-blue-400">{windSpeed} 节</span>
            </div>
            <input
              type="range" min="0" max="50" value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">真风风向 (角度)</span>
              <span className="font-bold text-blue-400">{windAngle}°</span>
            </div>
            <input
              type="range" min="0" max="360" value={windAngle}
              onChange={(e) => setWindAngle(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">航母航速 (knots)</span>
              <span className="font-bold text-emerald-400">{carrierSpeed} 节</span>
            </div>
            <input
              type="range" min="0" max="30" value={carrierSpeed}
              onChange={(e) => setCarrierSpeed(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">航母航向 (角度)</span>
              <span className="font-bold text-emerald-400">{carrierHeading}°</span>
            </div>
            <input
              type="range" min="0" max="360" value={carrierHeading}
              onChange={(e) => setCarrierHeading(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center justify-center col-span-1">
        <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 w-full text-center mb-4 flex items-center justify-center gap-2">
          <Compass className="w-4 h-4 text-purple-400" />
          甲板合成风矢量解算
        </h3>

        <div className="relative w-48 h-48 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center">
          <div className="absolute w-full h-px bg-slate-800"></div>
          <div className="absolute h-full w-px bg-slate-800"></div>
          <div className="absolute inset-4 rounded-full border border-slate-800 border-dashed"></div>
          <span className="absolute top-1 text-[10px] text-slate-500 font-bold">N 0°</span>
          <span className="absolute bottom-1 text-[10px] text-slate-500 font-bold">S 180°</span>
          <span className="absolute right-1 text-[10px] text-slate-500 font-bold">E 90°</span>
          <span className="absolute left-1 text-[10px] text-slate-500 font-bold">W 270°</span>

          <svg className="w-full h-full absolute inset-0 z-10">
            <path d="M 100 100 L 92 20 A 80 80 0 0 1 108 20 Z" fill="rgba(16, 185, 129, 0.15)" />

            <g transform="translate(93, 85)">
              <path d="M 7 0 L 14 8 L 14 26 L 0 26 L 0 8 Z" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
              <line x1="7" y1="26" x2="7" y2="2" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
            </g>

            <line x1="100" y1="100" x2="100" y2={100 - carrierSpeed * 1.5} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-green)" />
            <line x1={twx} y1={twy} x2="100" y2="100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrow-blue)" />
            <line x1="100" y1="100" x2={rwx} y2={rwy} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red)" />

            <defs>
              <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
              </marker>
              <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="flex gap-4 mt-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-blue-500"></span> 真风</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-500"></span> 航速</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-red-500"></span> 合成甲板风</span>
        </div>
      </div>

      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-5 space-y-4 col-span-1 flex flex-col justify-between">
        <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400" />
          解算状态输出
        </h3>

        <div className="space-y-3 flex-1 justify-center flex flex-col">
          <div className="bg-[#1B2732] rounded-lg p-3 border border-slate-700/30 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-300 block">合成甲板风速</span>
              <span className="text-2xl font-black text-white">{relativeSpeed} 节</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isSpeedOk ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              {isSpeedOk ? '风速达标' : '风速偏低'}
            </span>
          </div>

          <div className="bg-[#1B2732] rounded-lg p-3 border border-slate-700/30 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-300 block">合成甲板风角</span>
              <span className="text-2xl font-black text-white">{relativeAngle}°</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isAngleOk ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              {isAngleOk ? '偏角合规' : '偏角超限'}
            </span>
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center border transition-all ${
          isSafe
            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-red-950/60 border-red-500 text-red-400'
        }`}>
          <span className="text-xs text-slate-300 block mb-1">舰载机安全起降状态</span>
          <span className="text-base font-bold flex items-center justify-center gap-1.5">
            {isSafe ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                满足安全着舰条件
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-red-400" />
                禁止着舰 / 需弹射辅助
              </>
            )}
          </span>
          <span className="text-[10px] text-slate-305/70 block mt-1">（最小甲板风速需20节，偏角±15°内）</span>
        </div>
      </div>
    </div>
  )
}

function MerchantVesselAlerterSimulator() {
  const [filterAlerts, setFilterAlerts] = useState(false)
  const [grids, setGrids] = useState([
    { id: 'A1', name: '冲绳东部海域', count: 12, baseline: 25, pct: 48, sparkline: [25, 23, 22, 19, 18, 15, 12, 12, 12, 12] },
    { id: 'A2', name: '横须贺外海', count: 28, baseline: 30, pct: 93, sparkline: [29, 31, 30, 28, 29, 29, 30, 27, 28, 28] },
    { id: 'B1', name: '南海北部网格', count: 14, baseline: 22, pct: 63, sparkline: [22, 21, 23, 20, 18, 17, 16, 15, 14, 14] },
    { id: 'B2', name: '关岛周边海域', count: 9, baseline: 20, pct: 45, sparkline: [21, 19, 17, 15, 13, 11, 10, 9, 9, 9] },
    { id: 'C1', name: '苏里高海峡', count: 19, baseline: 20, pct: 95, sparkline: [19, 21, 20, 20, 18, 19, 19, 20, 18, 19] },
    { id: 'C2', name: '巴林塘海峡', count: 8, baseline: 12, pct: 66, sparkline: [12, 11, 10, 11, 9, 8, 9, 8, 8, 8] }
  ])

  const triggerRefresh = () => {
    setGrids(prev => prev.map(g => {
      const change = Math.floor((Math.random() - 0.5) * 4)
      const newCount = Math.max(2, g.count + change)
      const newPct = Math.round((newCount / g.baseline) * 100)
      const newSpark = [...g.sparkline.slice(1), newCount]
      return {
        ...g,
        count: newCount,
        pct: newPct,
        sparkline: newSpark
      }
    }))
  }

  const displayedGrids = filterAlerts ? grids.filter(g => g.pct < 70) : grids

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>AIS 位置数据流活跃 (3分钟轮询)</span>
          </div>
          <button
            onClick={triggerRefresh}
            className="text-xs px-2.5 py-1 bg-[#243340] border border-blue-500/30 hover:border-blue-500/80 text-blue-400 hover:text-blue-300 font-semibold rounded flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            模拟AIS刷新
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300">只看异常告警网格</label>
          <input
            type="checkbox"
            checked={filterAlerts}
            onChange={(e) => setFilterAlerts(e.target.checked)}
            className="w-4 h-4 rounded bg-[#243340] border-slate-700 text-blue-500 accent-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {displayedGrids.map((grid) => {
          const status = grid.pct < 50 ? 'red' : grid.pct < 70 ? 'yellow' : 'green'
          const points = grid.sparkline.map((val, idx) => {
            const x = (idx * 16).toFixed(0)
            const maxVal = grid.baseline * 1.3
            const y = (35 - (val / maxVal) * 30).toFixed(0)
            return `${x},${y}`
          }).join(' ')

          return (
            <div key={grid.id} className={`bg-[#243340]/80 border rounded-xl p-4 space-y-3 transition-all ${
              status === 'red' ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
              status === 'yellow' ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              'border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">GRID {grid.id}</span>
                  <span className="text-sm font-bold text-white">{grid.name}</span>
                </div>
                <span className={`w-3 h-3 rounded-full ${
                  status === 'red' ? 'bg-red-500 animate-ping' :
                  status === 'yellow' ? 'bg-amber-500 animate-pulse' :
                  'bg-emerald-500'
                }`}></span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#1B2732] rounded-lg p-2.5 border border-slate-700/30">
                <div>
                  <span className="text-[10px] text-slate-400 block">当前商船</span>
                  <span className={`text-base font-black ${
                    status === 'red' ? 'text-red-400' :
                    status === 'yellow' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>{grid.count} 艘</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">30天均值</span>
                  <span className="text-base font-bold text-slate-300">{grid.baseline} 艘</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/30 pt-2 text-[10px]">
                <span className="text-slate-300">密度比例: </span>
                <span className={`font-bold ${
                  status === 'red' ? 'text-red-400' :
                  status === 'yellow' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>{grid.pct}%</span>
              </div>

              <div className="h-10 w-full relative pt-2 bg-[#1B2732]/30 rounded border border-slate-700/30">
                <svg className="w-full h-full" viewBox="0 0 144 40">
                  <line x1="0" y1="20" x2="144" y2="20" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
                  <polyline
                    fill="none"
                    stroke={status === 'red' ? '#ef4444' : status === 'yellow' ? '#f59e0b' : '#10b981'}
                    strokeWidth="1.5"
                    points={points}
                  />
                </svg>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CommunityMonitorSimulator() {
  const [analysing, setAnalysing] = useState(false)
  const [hasCluster, setHasCluster] = useState(false)
  const [posts, setPosts] = useState([
    { id: 1, source: 'Twitter', text: 'Spotted a massive navy vessel sailing east from Yokosuka Bay!', coords: '[35.281, 139.672]', time: '2分钟前' },
    { id: 2, source: 'Instagram', text: 'Huge grey ship near Uraga canal this morning. Co-ords captured in photo.', coords: '[35.250, 139.715]', time: '5分钟前' },
    { id: 3, source: 'Twitter', text: '横须贺外海目击到多艘军舰编队，看起来是航母群出港。', coords: '[35.295, 139.691]', time: '11分钟前' },
    { id: 4, source: 'Twitter', text: 'Big grey carrier heading out to Eastern Sea.', coords: '[35.264, 139.734]', time: '14分钟前' },
    { id: 5, source: 'Instagram', text: 'Relaxing day at Okinawa beach. Wait, is that a destroyer?', coords: '[26.212, 127.671]', time: '25分钟前' }
  ])

  const runClusterAnalysis = () => {
    setAnalysing(true)
    setTimeout(() => {
      setHasCluster(true)
      setAnalysing(false)
    }, 1200)
  }

  const resetAnalysis = () => {
    setHasCluster(false)
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-4 col-span-1 space-y-4 flex flex-col">
        <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-400" />
          最新社交媒体抓取流
        </h3>

        <div className="space-y-2 overflow-y-auto max-h-80 flex-1">
          {posts.map((post) => (
            <div key={post.id} className="bg-[#1B2732] rounded border border-slate-700/30 p-2.5 text-xs space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className={post.source === 'Twitter' ? 'text-sky-400 font-semibold' : 'text-pink-400 font-semibold'}>
                  @{post.source}
                </span>
                <span className="text-slate-400">{post.time}</span>
              </div>
              <p className="text-slate-300 leading-normal">{post.text}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>GPS: {post.coords}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-4 col-span-2 space-y-4 flex flex-col">
        <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Map className="w-4 h-4 text-indigo-400" />
            地理空间坐标落点散点图
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-sky-950 text-sky-400 border border-sky-800 rounded">每15分钟抓取</span>
        </h3>

        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative min-h-64 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-20">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border-r border-b border-slate-700"></div>
            ))}
          </div>

          <div className="absolute top-2 left-2 text-[10px] text-slate-600 font-mono">监控网格: 横须贺沿海防区</div>

          <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 300 200">
            <path d="M 0 50 Q 80 80 120 40 T 200 80 T 300 30 L 300 0 L 0 0 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
            <path d="M 50 180 Q 120 150 180 180 T 270 160" fill="none" stroke="#475569" strokeWidth="1.5" />
          </svg>

          <g transform="translate(10, 10)">
            <circle cx="150" cy="90" r="3" fill="#38bdf8" />
            <circle cx="165" cy="105" r="3" fill="#ec4899" />
            <circle cx="140" cy="115" r="3" fill="#38bdf8" />
            <circle cx="170" cy="85" r="3" fill="#38bdf8" />
            <circle cx="50" cy="150" r="3" fill="#ec4899" />
          </g>

          {hasCluster && (
            <g transform="translate(10, 10)">
              <circle cx="155" cy="98" r="32" fill="rgba(239, 68, 68, 0.12)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
              <g transform="translate(195, 80)">
                <rect width="110" height="42" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#ef4444" strokeWidth="1" />
                <text x="6" y="16" fill="#ef4444" className="text-[9px] font-bold">发现目击潮聚合</text>
                <text x="6" y="28" fill="#cbd5e1" className="text-[8px]">Yokosuka (4点重合)</text>
                <text x="6" y="36" fill="#10b981" className="text-[7px]">置信度: 92%</text>
              </g>
            </g>
          )}

          <div className="absolute bottom-4 right-4 flex gap-2">
            {!hasCluster ? (
              <button
                onClick={runClusterAnalysis}
                disabled={analysing}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-md flex items-center gap-1 transition-all"
              >
                <Target className="w-3.5 h-3.5" />
                {analysing ? '正在运行聚类分析...' : '运行目击潮空间聚类'}
              </button>
            ) : (
              <button
                onClick={resetAnalysis}
                className="px-3 py-1.5 bg-[#243340] border border-blue-500/30 hover:border-blue-500/80 text-blue-400 hover:text-blue-300 font-semibold rounded text-xs flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重置地图分析
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AppSimulator({ appId, onClose }) {
  const order = workOrders.find(o => o.id === appId)

  return (
    <div className="bg-[#1B2732] text-slate-100 rounded-xl border border-slate-700/50 p-6 flex flex-col h-full space-y-6 shadow-2xl overflow-y-auto" style={{ minHeight: 'calc(100vh - 180px)' }}>
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#243340] rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <h1 className="text-xl font-bold text-white">{order?.title}</h1>
              <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 border border-blue-800 rounded">已部署运行中</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{order?.domain} · 生产环境交付界面</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 border border-transparent"
        >
          返回研发看板
        </button>
      </div>

      <div className="flex-1">
        {appId === 1 && <TideCalculatorSimulator />}
        {appId === 2 && <DeckWindCalculatorSimulator />}
        {appId === 3 && <MerchantVesselAlerterSimulator />}
        {appId === 4 && <CommunityMonitorSimulator />}
      </div>
    </div>
  )
}

function WorkOrderCard({ order, isSelected, onClick, onGoToApp }) {
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
        <div className="flex items-center gap-1.5">
          <span>{order.progress}%</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onGoToApp(order.id)
            }}
            className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded text-[10px] font-semibold transition-all hover:scale-105"
          >
            运行
          </button>
        </div>
      </div>
    </div>
  )
}

// AI Chat Panel Component
function AIChatPanel({ activeOrder, onAdvanceStages, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `您好！我是【${activeOrder.title}】的 AI 研发专家。请输入您的系统重构或新增功能需求，我将为您自动编写方案、生成代码，并自动跑通流水线推进部署交付。`,
      time: '刚刚'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'ai',
        text: `您好！我是【${activeOrder.title}】的 AI 研发专家。请输入您的系统重构或新增功能需求，我将为您自动编写方案、生成代码，并自动跑通流水线推进部署交付。`,
        time: '刚刚'
      }
    ])
    setLoading(false)
  }, [activeOrder.id])

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputValue.trim() || loading) return

    const userText = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText, time: '刚刚' }])
    setLoading(true)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `已收到您的需求：“${userText}”。正在自动分析，启动 AI 智能研发流程重构交付...`,
        time: '刚刚'
      }])

      onAdvanceStages(activeOrder.id, (stageMsg) => {
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          sender: 'ai',
          text: stageMsg,
          time: '刚刚'
        }])
      }, () => {
        setLoading(false)
      })
    }, 1000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col shadow-sm h-full w-full">
      <div className="w-full flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold text-gray-800 text-xs flex-shrink-0">AI 研发助手</h3>
              <span className="text-[10px] text-gray-400">|</span>
              <p className="text-[10px] text-gray-500 truncate" title={activeOrder.title}>当前应用: {activeOrder.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <div className="flex items-center gap-1 text-blue-600 font-semibold text-[9px] flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                  <span>推进中...</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-650 transition-colors flex-shrink-0"
                title="收起助手"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs mb-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                  : 'bg-gray-100 text-gray-850 rounded-tl-none border border-gray-200/50'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 pt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`给【${activeOrder.title}】提需求...`}
            disabled={loading}
            className="flex-1 min-w-0 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  )
}

function KanbanBoard() {
  const [orders, setOrders] = useState(workOrders)
  const [selectedOrderId, setSelectedOrderId] = useState(workOrders[0].id)
  const [activeAppView, setActiveAppView] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(true)

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0]

  const completedCount = selectedOrder.stages.filter(s => s.status === 'completed').length
  const activeCount = selectedOrder.stages.filter(s => s.status === 'active').length
  const pendingCount = selectedOrder.stages.filter(s => s.status === 'pending').length

  const onAdvanceStages = (orderId, addAIMessage, onComplete) => {
    const originalOrder = workOrders.find(o => o.id === orderId)
    if (!originalOrder) return

    const steps = [
      {
        progress: 15,
        msg: "【需求待入厂】已分析需求规格书并重构校验规则...",
        updater: (stages) => {
          stages[0].status = 'active'
          stages[0].duration = '进行中'
          stages[1].status = 'pending'
          stages[2].status = 'pending'
          stages[3].status = 'pending'
          stages[4].status = 'pending'
        }
      },
      {
        progress: 35,
        msg: "【需求待入厂】通过审核。正在推进至【系统设计】：重构系统架构图与API接口定义...",
        updater: (stages) => {
          stages[0].status = 'completed'
          stages[0].duration = '5分钟'
          stages[1].status = 'active'
          stages[1].duration = '进行中'
        }
      },
      {
        progress: 60,
        msg: "【系统设计】评审通过。正在推进至【智能编码】：自动重构生成源文件，正在编译构建...",
        updater: (stages) => {
          stages[1].status = 'completed'
          stages[1].duration = '20分钟'
          stages[2].status = 'active'
          stages[2].duration = '进行中'
        }
      },
      {
        progress: 80,
        msg: "【智能编码】成功生成代码包。正在推进至【测试质检】：更新单元测试，自动运行测试集...",
        updater: (stages) => {
          stages[2].status = 'completed'
          stages[2].duration = '40分钟'
          stages[3].status = 'active'
          stages[3].duration = '进行中'
        }
      },
      {
        progress: 95,
        msg: "【测试质检】全数用例运行通过。正在推进至【部署交付】：打包全新容器镜像，开启灰度部署...",
        updater: (stages) => {
          stages[3].status = 'completed'
          stages[3].duration = '30分钟'
          stages[4].status = 'active'
          stages[4].duration = '进行中'
        }
      },
      {
        progress: 100,
        msg: "【部署交付】部署成功！新版本已上线至生产环境。您可以点击页面顶部的‘访问部署应用’以体验最新版系统。",
        updater: (stages) => {
          stages[4].status = 'completed'
          stages[4].duration = '15分钟'
        }
      }
    ]

    let currentStep = 0

    const executeStep = () => {
      if (currentStep >= steps.length) {
        onComplete()
        return
      }

      const step = steps[currentStep]
      addAIMessage(step.msg)

      setOrders(prevOrders => {
        return prevOrders.map(o => {
          if (o.id === orderId) {
            const updatedStages = o.stages.map(s => ({
              ...s,
              items: s.items.map(item => ({ ...item })),
              outputs: s.outputs.map(out => ({ ...out })),
              reviews: s.reviews.map(rev => ({ ...rev }))
            }))
            step.updater(updatedStages)
            return {
              ...o,
              progress: step.progress,
              stages: updatedStages
            }
          }
          return o
        })
      })

      currentStep++
      setTimeout(executeStep, 2000)
    }

    executeStep()
  }

  if (activeAppView !== null) {
    return (
      <AppSimulator appId={activeAppView} onClose={() => setActiveAppView(null)} />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">流水线看板</h1>
          <p className="text-gray-500 text-sm mt-1">软件系统生产全链路可视化</p>
        </div>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-72 flex-shrink-0 space-y-3 mr-4">
          <h2 className="font-semibold text-gray-700 text-sm px-1">应用列表 ({orders.length})</h2>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            {orders.map(order => (
              <WorkOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrderId(order.id)}
                onGoToApp={setActiveAppView}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-gray-800 text-lg">{selectedOrder.title}</h2>
                <button
                  onClick={() => setActiveAppView(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-105"
                >
                  <Globe className="w-3.5 h-3.5" />
                  访问部署应用
                </button>
                {!isChatOpen && (
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-105"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    AI 研发助手
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{selectedOrder.domain} · {selectedOrder.creator} · {selectedOrder.lastUpdate}</p>
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
            <div className="flex items-stretch gap-4 h-full pb-2">
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

        {/* AI R&D Assistant Panel with collapsible layout */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 flex h-full overflow-hidden ${
          isChatOpen ? 'w-96 opacity-100 ml-4' : 'w-0 opacity-0 ml-0 pointer-events-none'
        }`}>
          <AIChatPanel activeOrder={selectedOrder} onAdvanceStages={onAdvanceStages} onClose={() => setIsChatOpen(false)} />
        </div>
      </div>
    </div>
  )
}

export default KanbanBoard