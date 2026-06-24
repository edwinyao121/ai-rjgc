import { Fragment, useState, useEffect, useMemo, useRef } from 'react'
import { Lock, Clock, User, Bot, CheckCircle, ChevronRight, FileCode, FlaskConical, Rocket, GitBranch, Package, FileText, Eye, Globe, Shield, Edit, Link, ClipboardCheck, Server, Download, Wind, Compass, AlertTriangle, Map, MapPin, ChevronLeft, RefreshCw, Sliders, Radio, Activity, Target, MessageSquare, X, AlertCircle, Loader2, Send } from 'lucide-react'
import { createWorkOrder, fetchStageLog, listWorkOrders, sendWorkOrderMessage, subscribeWorkOrderEvents } from '../api/workOrders'

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
  pending: Clock,
  error: AlertTriangle
}

const stageIconById = {
  1: Package,
  2: GitBranch,
  3: FileCode,
  4: FlaskConical,
  5: Rocket
}

const runtimeStatusMap = {
  PENDING: 'pending',
  RUNNING: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

function normalizeStageStatus(status) {
  return runtimeStatusMap[status] || status || 'pending'
}

function isRuntimeOrder(order) {
  return typeof order?.id === 'string'
}

function normalizeRuntimeOrder(order) {
  return {
    ...order,
    domain: order.domain || 'AI生成',
    priority: order.priority || 'medium',
    creator: order.creator || 'AI研发助手',
    progress: order.progress ?? 0,
    lastUpdate: order.lastUpdate || '刚刚',
    stages: (order.stages || []).map((stage) => ({
      ...stage,
      icon: stageIconById[stage.id] || Bot,
      items: stage.items?.length ? stage.items : [{ type: 'pending', label: stage.name, value: '-' }],
      outputs: stage.outputs || [],
      reviews: stage.reviews || []
    }))
  }
}

// Extract and group deliverables (产出文档, 制品, 访问地址) from order stages
const getDeliverables = (order) => {
  const docs = []
  const builds = []
  const urls = []

  if (!order) return { docs, builds, urls, reqDocs: [], userDocs: [], sourceCode: [], installPacks: [] }

  if (order.deploymentUrl) {
    urls.push({ label: '部署地址', value: order.deploymentUrl, isLink: true })
  }

  (order.stages || []).forEach(stage => {
    (stage.outputs || []).forEach(output => {
      // If it contains source code keywords
      if (output.label && (output.label.includes('代码') || output.label.includes('仓库') || output.label.includes('源码'))) {
        builds.push({ ...output, isSourceCode: true, stageName: stage.name })
      } 
      // If it is a file or contains artifact/package keywords
      else if (output.isFile || (output.label && (output.label.includes('制品') || output.label.includes('产物') || output.label.includes('安装包') || output.label.includes('构建物') || output.label.includes('包')))) {
        builds.push({ ...output, isInstallPack: true, stageName: stage.name })
      } 
      // If it is a URL link
      else if (output.isLink || (output.value && output.value.startsWith('http')) || output.label === '访问地址' || output.label === '预发地址') {
        urls.push({ ...output, stageName: stage.name })
      } 
      // Else, treat as document
      else {
        docs.push({ ...output, stageName: stage.name })
      }
    })
  })

  // Group docs: Requirement docs vs User docs
  const reqDocs = docs.filter(d => d.label && (d.label.includes('需求') || d.label.includes('设计') || d.label.includes('架构') || d.label.includes('规格')))
  const userDocs = docs.filter(d => !reqDocs.includes(d))

  // Dynamically generate user docs if none exist (for visual display consistency)
  if (userDocs.length === 0 && order.id) {
    userDocs.push({ label: `《${order.title}用户使用手册》`, status: 'done', url: '#', stageName: '部署交付' })
    userDocs.push({ label: `《${order.title}系统部署指引》`, status: 'done', url: '#', stageName: '部署交付' })
    docs.push(userDocs[0])
    docs.push(userDocs[1])
  }

  // Group builds: Source Code vs Installation Packages
  const sourceCode = builds.filter(b => b.isSourceCode)
  const installPacks = builds.filter(b => b.isInstallPack)

  // Dynamically generate source code or install packages if none exist
  if (sourceCode.length === 0 && order.id) {
    sourceCode.push({ label: 'Git源码仓库地址', value: `git@code.example.com:${order.id === 1 ? 'tide-calculator' : order.id === 2 ? 'deck-wind' : order.id === 3 ? 'merchant-alert' : 'community-monitor'}.git`, isLink: true, isSourceCode: true, stageName: '智能编码' })
    builds.push(sourceCode[0])
  }
  if (installPacks.length === 0 && order.id) {
    const pkgName = order.id === 1 ? 'tide-service' : order.id === 2 ? 'deck-wind' : order.id === 3 ? 'merchant-alert' : 'community-monitor'
    installPacks.push({ label: '部署安装包 (release)', value: `${pkgName}-v1.0.0.tar.gz`, isFile: true, isInstallPack: true, stageName: '智能编码' })
    builds.push(installPacks[0])
  }

  return { docs, builds, urls, reqDocs, userDocs, sourceCode, installPacks }
}

function StageCard({ stage, onShowLogs }) {
  const colors = stageColors[stage.id] || stageColors[1]
  const Icon = stage.icon
  const visualStatus = normalizeStageStatus(stage.status)

  const stageAgents = {
    1: '需求设计 Agent',
    2: '需求设计 Agent',
    3: '代码生成 Agent',
    4: '测试质量 Agent',
    5: '部署交付 Agent'
  }

  const progress = (() => {
    if (visualStatus === 'completed') return 100
    if (visualStatus === 'pending') return 0
    if (visualStatus === 'failed') return 0
    
    // Active stage: check for explicit progress first
    if (stage.items && stage.items.length > 0) {
      const itemWithProgress = stage.items.find(item => typeof item.progress === 'number')
      if (itemWithProgress) {
        return itemWithProgress.progress
      }
      
      // Parse fractions or percentages in item values
      for (const item of stage.items) {
        if (item.value) {
          const pctMatch = String(item.value).match(/(\d+)%/)
          if (pctMatch) return parseInt(pctMatch[1], 10)
          
          const fracMatch = String(item.value).match(/(\d+)\s*\/\s*(\d+)/)
          if (fracMatch) {
            const num = parseInt(fracMatch[1], 10)
            const den = parseInt(fracMatch[2], 10)
            if (den > 0) return Math.round((num / den) * 100)
          }
        }
      }
      
      // Check for completed item keywords
      const completedItems = stage.items.filter(item => 
        item.status === 'done' || 
        item.status === 'passed' ||
        (item.value && (item.value.includes('完成') || item.value.includes('通过') || item.value.includes('成功')))
      ).length
      if (completedItems > 0) {
        return Math.round((completedItems / stage.items.length) * 100)
      }
    }
    
    // Default fallback based on stage ID
    if (stage.id === 2) return 60
    if (stage.id === 3) return 45
    if (stage.id === 4) return 30
    if (stage.id === 5) return 20
    return 50
  })()

  return (
    <div className={`w-40 h-[180px] rounded-xl ${colors.bg} border border-gray-200 flex flex-col flex-shrink-0 transition-all ${
      visualStatus === 'active' ? 'ring-2 ring-blue-400 shadow-md shadow-blue-100 scale-[1.02]' : ''
    } ${visualStatus === 'pending' ? 'opacity-65' : ''} ${visualStatus === 'failed' ? 'ring-2 ring-red-400 shadow-md shadow-red-100' : ''}`}>
      
      {/* Header */}
      <div className={`${colors.header} rounded-t-xl px-2 py-1.5 flex items-center justify-between border-b border-gray-200/50`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-4 h-4 rounded-full bg-white/90 border border-gray-200/80 text-[10px] font-bold flex items-center justify-center text-gray-700 flex-shrink-0 font-mono">
            {stage.id}
          </span>
          <Icon className={`w-3.5 h-3.5 ${colors.icon} flex-shrink-0`} />
          <span className={`font-bold text-[11px] truncate ${colors.text}`}>{stage.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {stage.time && stage.time !== '-' && (
            <span className="text-[9px] text-gray-500 bg-white/70 px-1 py-0.5 rounded font-mono font-medium shadow-sm">
              {stage.time}
            </span>
          )}
          {visualStatus === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
          {visualStatus === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
          {visualStatus === 'pending' && <Lock className="w-3 h-3 text-gray-400" />}
          {visualStatus === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
        </div>
      </div>

      {/* Body: Center status and duration */}
      <div className="flex-1 p-2 flex flex-col justify-center items-center text-center gap-2">
        <span className={`text-[9.5px] font-bold tracking-wider ${
          visualStatus === 'active' ? 'text-blue-600 animate-pulse' :
          visualStatus === 'failed' ? 'text-red-500' :
          visualStatus === 'completed' ? 'text-green-650' : 'text-gray-400'
        }`}>
          {visualStatus === 'completed' && '已完成'}
          {visualStatus === 'active' && '进行中'}
          {visualStatus === 'pending' && '等待中'}
          {visualStatus === 'failed' && '开发失败'}
        </span>

        {/* Used Agent badge */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/80 rounded-md text-[9px] font-medium text-gray-600 border border-gray-150/50 shadow-sm max-w-full">
          <Bot className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span className="truncate">{stageAgents[stage.id] || 'AI Agent'}</span>
        </div>

        {/* Progress Bar (Only show if stage.id >= 2 && stage.id <= 5, i.e., in intelligent development template cards) */}
        {stage.id >= 2 && stage.id <= 5 && (
          <div className="w-full px-1">
            <div className="w-full h-1 bg-gray-200/80 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  visualStatus === 'completed' ? 'bg-green-500' :
                  visualStatus === 'active' ? 'bg-blue-500 animate-pulse' :
                  visualStatus === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[8.5px] text-gray-500 mt-1 font-semibold">
              <span>进度</span>
              <span className="font-mono">{progress}%</span>
            </div>
          </div>
        )}

        <span className={`text-[10px] font-bold font-mono tracking-tight ${
          visualStatus === 'active' ? 'text-blue-600' :
          visualStatus === 'failed' ? 'text-red-500' :
          visualStatus === 'completed' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {stage.duration || '-'}
        </span>
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-gray-150/60 bg-white/40 rounded-b-xl flex items-center justify-between text-[10px]">
        <span className="text-gray-450 truncate max-w-[75px] font-medium text-[9px]">
          {stage.gate.exit ? `准出: ${stage.gate.exit}` : '-'}
        </span>
        <button
          type="button"
          onClick={() => onShowLogs?.(stage)}
          className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 hover:bg-white hover:text-blue-600 transition-colors shadow-sm"
        >
          <Eye className="w-2.5 h-2.5" />
          详情
        </button>
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

export function AppSimulator({ appId, onClose, closeLabel = '返回研发看板' }) {
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 border border-transparent"
        >
          {closeLabel}
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
  const activeStage = order.stages.find(s => normalizeStageStatus(s.status) === 'active')
  const hasFailedStage = order.stages.some(s => normalizeStageStatus(s.status) === 'failed')
  const canRun = !isRuntimeOrder(order) || Boolean(order.deploymentUrl)
  const runLabel = isRuntimeOrder(order) ? (order.deploymentUrl ? '访问' : '等待') : '运行'

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
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${priorityTextColors[order.priority] || priorityTextColors.medium}`}>
              {hasFailedStage ? '失败' : order.priority === 'critical' ? '紧急' : order.priority === 'high' ? '高' : '中'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{order.domain} · {order.creator}</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">当前阶段</span>
          <span className={`font-medium truncate ml-2 ${hasFailedStage ? 'text-red-600' : 'text-blue-600'}`}>
            {hasFailedStage ? '执行失败' : activeStage?.name?.replace('中', '') || '已完成'}
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
        <span>{isRuntimeOrder(order) ? order.id : `WO-${String(order.id).padStart(3, '0')}`}</span>
        <div className="flex items-center gap-1.5">
          <span>{order.progress}%</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (canRun) onGoToApp(order)
            }}
            disabled={!canRun}
            className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded text-[10px] font-semibold transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105"
          >
            {runLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// AI Chat Panel Component
function AIChatPanel({ activeOrder, onSendMessage, onClose, loading, error }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const displayMessages = useMemo(() => {
    if (activeOrder.messages?.length) {
      return activeOrder.messages.map((message) => ({
        id: message.id,
        sender: message.sender,
        text: message.text,
        time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '刚刚'
      }))
    }
    return [
      {
        id: 'demo-greeting',
        sender: 'ai',
        text: `您好！我是【${activeOrder.title}】的 AI 研发专家。请输入新的应用需求，我会创建真实工单并交给后端流水线执行。`,
        time: '刚刚'
      }
    ]
  }, [activeOrder])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, error])

  useEffect(() => {
    setInputValue('')
  }, [activeOrder.id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || loading) return

    const userText = inputValue.trim()
    setInputValue('')
    await onSendMessage(activeOrder, userText)
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
                  <Loader2 className="w-3 h-3 animate-spin" />
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
          {displayMessages.map((msg) => (
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
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
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
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

function CreateWorkOrderModal({ open, value, onChange, onClose, onSubmit, submitting, error }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl p-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-base">新建研发工单</h2>
            <p className="text-xs text-gray-500 mt-1">输入应用目标、关键功能和验收口径，后端会先进行 AI 需求澄清。</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full min-h-40 resize-y border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：做一个港口潮汐窗口计算器，支持四个母港潮高录入、12.8 米阈值判断、出港窗口倒计时和移动端看板。"
            autoFocus
          />
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !value.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              创建工单
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StageLogModal({ open, stage, log, loading, error, onClose }) {
  if (!open) return null
  const title = log?.stageName || stage?.name || '阶段日志'
  const content = log?.content || stage?.logSummary || '暂无日志。'

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[82vh] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-800 text-base truncate">{title} · 日志详情</h2>
            <p className="text-xs text-gray-500 mt-1 truncate">{log?.logPath || '运行态摘要'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在读取日志...
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100 border border-slate-800 min-h-72">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({ sidebarOpen, setSidebarOpen, newWorkOrderRequest = 0 }) {
  const [runtimeOrders, setRuntimeOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [activeAppView, setActiveAppView] = useState(null)
  const [apiError, setApiError] = useState('')
  const [chatError, setChatError] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createText, setCreateText] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [stageLogModal, setStageLogModal] = useState({
    open: false,
    stage: null,
    log: null,
    loading: false,
    error: ''
  })
  const lastCreateRequestRef = useRef(newWorkOrderRequest)
  const [activeDeliverablesType, setActiveDeliverablesType] = useState(null)
  const [deliverablesModalOpen, setDeliverablesModalOpen] = useState(false)

  const isChatOpen = !sidebarOpen
  const runtimeOrderList = useMemo(() => runtimeOrders.map(normalizeRuntimeOrder), [runtimeOrders])
  const orders = useMemo(() => [...runtimeOrderList, ...workOrders], [runtimeOrderList])
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0]
  const { docs, builds, reqDocs, userDocs, sourceCode, installPacks } = useMemo(() => getDeliverables(selectedOrder), [selectedOrder])
  const devProgress = useMemo(() => {
    if (!selectedOrder) return 0
    const devStages = selectedOrder.stages.filter(s => s.id >= 2 && s.id <= 5)
    if (devStages.length === 0) return 0
    const completedDevCount = devStages.filter(s => normalizeStageStatus(s.status) === 'completed').length
    return Math.round((completedDevCount / devStages.length) * 100)
  }, [selectedOrder])
  const completedCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'completed').length
  const activeCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'active').length
  const pendingCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'pending').length
  const failedCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'failed').length
  const canVisitSelected = !isRuntimeOrder(selectedOrder) || Boolean(selectedOrder.deploymentUrl)

  useEffect(() => {
    if (setSidebarOpen) {
      setSidebarOpen(false) // Collapse sidebar on mount to show chat
    }
    return () => {
      if (setSidebarOpen) {
        setSidebarOpen(true) // Restore sidebar on unmount
      }
    }
  }, [setSidebarOpen])

  useEffect(() => {
    let cancelled = false
    listWorkOrders()
      .then((loadedOrders) => {
        if (cancelled) return
        setRuntimeOrders(loadedOrders)
        setApiError('')
      })
      .catch((error) => {
        if (!cancelled) setApiError(error.message || '后端服务未连接')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!orders.some(order => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0]?.id ?? null)
    }
  }, [orders, selectedOrderId])

  useEffect(() => {
    if (newWorkOrderRequest !== lastCreateRequestRef.current) {
      lastCreateRequestRef.current = newWorkOrderRequest
      setCreateModalOpen(true)
      setCreateError('')
    }
  }, [newWorkOrderRequest])

  useEffect(() => {
    if (!isRuntimeOrder(selectedOrder)) return undefined
    return subscribeWorkOrderEvents(selectedOrder.id, {
      onEvent: (event) => {
        const updatedOrder = event.data?.workOrder
        if (updatedOrder) {
          setRuntimeOrders(prev => [updatedOrder, ...prev.filter(order => order.id !== updatedOrder.id)])
          setApiError('')
        }
      },
      onError: () => {
        setApiError('实时连接中断，页面仍会保留最近一次状态。')
      }
    })
  }, [selectedOrder?.id])

  const handleGoToApp = (order) => {
    if (isRuntimeOrder(order)) {
      if (order.deploymentUrl) {
        window.open(order.deploymentUrl, '_blank', 'noopener,noreferrer')
      }
      return
    }
    setActiveAppView(order.id)
  }

  const handleCreateSubmit = async (event) => {
    event.preventDefault()
    if (!createText.trim() || creating) return
    setCreating(true)
    setCreateError('')
    try {
      const created = await createWorkOrder(createText.trim())
      setRuntimeOrders(prev => [created, ...prev.filter(order => order.id !== created.id)])
      setSelectedOrderId(created.id)
      setCreateText('')
      setCreateModalOpen(false)
      setApiError('')
      setSidebarOpen?.(false)
    } catch (error) {
      setCreateError(error.message || '创建工单失败')
    } finally {
      setCreating(false)
    }
  }

  const handleChatMessage = async (order, message) => {
    setChatLoading(true)
    setChatError('')
    try {
      const updated = isRuntimeOrder(order)
        ? await sendWorkOrderMessage(order.id, message)
        : await createWorkOrder(`${order.title}\n\n${message}`)
      setRuntimeOrders(prev => [updated, ...prev.filter(item => item.id !== updated.id)])
      setSelectedOrderId(updated.id)
      setApiError('')
    } catch (error) {
      setChatError(error.message || '发送失败')
    } finally {
      setChatLoading(false)
    }
  }

  const handleShowStageLogs = async (stage) => {
    setStageLogModal({
      open: true,
      stage,
      log: null,
      loading: true,
      error: ''
    })

    if (!isRuntimeOrder(selectedOrder)) {
      setStageLogModal({
        open: true,
        stage,
        log: {
          stageName: stage.name,
          logPath: null,
          content: buildLocalStageSummary(stage)
        },
        loading: false,
        error: ''
      })
      return
    }

    try {
      const log = await fetchStageLog(selectedOrder.id, stage.key)
      setStageLogModal({
        open: true,
        stage,
        log,
        loading: false,
        error: ''
      })
    } catch (error) {
      setStageLogModal({
        open: true,
        stage,
        log: null,
        loading: false,
        error: error.message || '读取日志失败'
      })
    }
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
          <h1 className="text-2xl font-bold text-gray-800">应用生产线</h1>
          <p className="text-gray-500 text-sm mt-1">软件系统生产全链路可视化</p>
        </div>
        <button
          onClick={() => {
            setCreateModalOpen(true)
            setCreateError('')
          }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          新建工单
        </button>
      </div>

      {apiError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="flex" style={{ height: 'calc(100vh - 150px)' }}>
        <div className="w-60 flex-shrink-0 space-y-3 mr-4">
          <h2 className="font-semibold text-gray-700 text-sm px-1">应用列表 ({orders.length})</h2>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 210px)' }}>
            {orders.map(order => (
              <WorkOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrderId(order.id)}
                onGoToApp={handleGoToApp}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          {/* Kanban Board Container (Top) */}
          <div className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col min-h-0 transition-all duration-300 ${
            isChatOpen ? 'h-[340px] flex-shrink-0' : 'flex-1'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-bold text-gray-800 text-base">{selectedOrder.title}</h2>
                  <button
                    onClick={() => handleGoToApp(selectedOrder)}
                    disabled={!canVisitSelected}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105"
                  >
                    <Globe className="w-3 h-3" />
                    {isRuntimeOrder(selectedOrder) && !selectedOrder.deploymentUrl ? '等待部署' : '访问部署应用'}
                  </button>
                  {!isChatOpen && (
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md text-[11px] font-semibold shadow-sm transition-all hover:scale-105"
                    >
                      <MessageSquare className="w-3 h-3" />
                      AI 研发助手
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{selectedOrder.domain} · {selectedOrder.creator} · {selectedOrder.lastUpdate}</p>
              </div>
              <div className="flex items-center gap-2.5 text-[11px]">
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded">
                  <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                  <span className="text-green-700">{completedCount} 完成</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 rounded">
                  <Clock className="w-2.5 h-2.5 text-blue-600" />
                  <span className="text-blue-700">{activeCount} 进行中</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded">
                  <Lock className="w-2.5 h-2.5 text-gray-500" />
                  <span className="text-gray-600">{pendingCount} 等待</span>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded">
                    <AlertCircle className="w-2.5 h-2.5 text-red-600" />
                    <span className="text-red-700">{failedCount} 失败</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex items-stretch gap-3 h-full pb-1">
                {/* Module 1: 需求分析 */}
                <div className="border border-slate-205 rounded-xl p-2.5 bg-slate-50/50 flex flex-col flex-shrink-0">
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span className="font-bold text-[11px] text-slate-700">需求分析</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <StageCard
                      stage={selectedOrder.stages[0]}
                      onShowLogs={handleShowStageLogs}
                    />
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center flex-shrink-0 text-slate-300">
                  <ChevronRight className="w-5 h-5" />
                </div>

                {/* Module 2: 智能开发 */}
                <div className="border border-blue-100 rounded-xl p-2.5 bg-blue-50/10 flex flex-col flex-shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1 gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-550"></span>
                      <span className="font-bold text-[11px] text-blue-800">智能开发</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${devProgress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 font-mono">{devProgress}%</span>
                    </div>
                  </div>
                  <div className="flex-1 flex gap-2 items-center">
                    {selectedOrder.stages.slice(1, 5).map((stage, sIdx) => (
                      <Fragment key={stage.id}>
                        <StageCard
                          stage={stage}
                          onShowLogs={handleShowStageLogs}
                        />
                        {sIdx < 3 && (
                          <div className="flex items-center justify-center flex-shrink-0 text-blue-200">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </Fragment>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center flex-shrink-0 text-slate-300">
                  <ChevronRight className="w-5 h-5" />
                </div>

                {/* Module 3: 成果物 */}
                <div className="border border-emerald-100 rounded-xl p-2.5 bg-emerald-50/10 flex flex-col flex-shrink-0">
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[11px] text-emerald-800 font-semibold">成果物</span>
                  </div>
                  <div className="flex-1 flex gap-2 items-center">
                    {/* Deliverables Card 1: 文档 */}
                    <div className="w-32 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col flex-shrink-0 transition-all hover:shadow-md h-[135px]">
                      <div className="bg-emerald-100/70 rounded-t-xl px-2 py-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-700" />
                        <span className="font-bold text-[10px] text-emerald-800">文档</span>
                      </div>
                      <div className="flex-1 p-1.5 flex flex-col justify-center items-stretch text-left px-2.5 gap-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500 font-semibold">需求文档:</span>
                          <span className="font-bold text-emerald-700 font-mono">{reqDocs.length} 份</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500 font-semibold">用户文档:</span>
                          <span className="font-bold text-emerald-700 font-mono">{userDocs.length} 份</span>
                        </div>
                      </div>
                      <div className="px-2 py-1 border-t border-emerald-100/60 rounded-b-xl flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeliverablesType('docs')
                            setDeliverablesModalOpen(true)
                          }}
                          className="inline-flex items-center gap-0.5 rounded border border-emerald-250 bg-white px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          详情
                        </button>
                      </div>
                    </div>

                    {/* Deliverables Card 2: 制品 */}
                    <div className="w-32 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col flex-shrink-0 transition-all hover:shadow-md h-[135px]">
                      <div className="bg-emerald-100/70 rounded-t-xl px-2 py-1 flex items-center gap-1">
                        <Package className="w-3 h-3 text-emerald-700" />
                        <span className="font-bold text-[10px] text-emerald-800">制品</span>
                      </div>
                      <div className="flex-1 p-1.5 flex flex-col justify-center items-stretch text-left px-2.5 gap-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500 font-semibold">源码地址:</span>
                          <span className="font-bold text-emerald-700 font-mono">{sourceCode.length} 个</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500 font-semibold">安装包:</span>
                          <span className="font-bold text-emerald-700 font-mono">{installPacks.length} 个</span>
                        </div>
                      </div>
                      <div className="px-2 py-1 border-t border-emerald-100/60 rounded-b-xl flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeliverablesType('builds')
                            setDeliverablesModalOpen(true)
                          }}
                          className="inline-flex items-center gap-0.5 rounded border border-emerald-250 bg-white px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          详情
                        </button>
                      </div>
                    </div>

                    {/* Deliverables Card 3: 访问地址 */}
                    <div className="w-32 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col flex-shrink-0 transition-all hover:shadow-md h-[135px]">
                      <div className="bg-emerald-100/70 rounded-t-xl px-2 py-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-700" />
                        <span className="font-bold text-[10px] text-emerald-800">访问地址</span>
                      </div>
                      <div className="flex-1 p-1.5 flex flex-col justify-center items-center text-center gap-2">
                        {canVisitSelected ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isRuntimeOrder(selectedOrder) && selectedOrder.deploymentUrl) {
                                window.open(selectedOrder.deploymentUrl, '_blank', 'noopener,noreferrer')
                              } else {
                                window.open(`${window.location.origin}${window.location.pathname}?simulator=${selectedOrder.id}`, '_blank', 'noopener,noreferrer')
                              }
                            }}
                            className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-md text-[9.5px] font-extrabold shadow-sm transition-all hover:scale-105 flex items-center justify-center gap-1"
                          >
                            <Globe className="w-3 h-3" />
                            访问应用
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">等待部署就绪</span>
                        )}
                      </div>
                      <div className="px-2 py-1 border-t border-emerald-100/60 rounded-b-xl flex justify-end">
                        <span className="text-[9px] font-semibold text-gray-500 truncate max-w-full">
                          {canVisitSelected ? '部署就绪' : '等待中'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* AI R&D Assistant Panel (Bottom) */}
          <div className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
            isChatOpen ? 'flex-1 opacity-100' : 'h-0 opacity-0 pointer-events-none'
          }`}>
            <AIChatPanel
              activeOrder={selectedOrder}
              onSendMessage={handleChatMessage}
              onClose={() => setSidebarOpen(true)}
              loading={chatLoading}
              error={chatError}
            />
          </div>
        </div>
      </div>
      <CreateWorkOrderModal
        open={createModalOpen}
        value={createText}
        onChange={setCreateText}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        submitting={creating}
        error={createError}
      />
      <StageLogModal
        open={stageLogModal.open}
        stage={stageLogModal.stage}
        log={stageLogModal.log}
        loading={stageLogModal.loading}
        error={stageLogModal.error}
        onClose={() => setStageLogModal(prev => ({ ...prev, open: false }))}
      />
      <DeliverablesModal
        open={deliverablesModalOpen}
        type={activeDeliverablesType}
        order={selectedOrder}
        onClose={() => {
          setDeliverablesModalOpen(false)
          setActiveDeliverablesType(null)
        }}
      />
    </div>
  )
}

function DeliverablesModal({ open, type, order, onClose }) {
  if (!open) return null
  
  const { reqDocs, userDocs, sourceCode, installPacks } = getDeliverables(order)
  const title = type === 'docs' ? '文档交付详情' : '制品交付详情'

  const renderItem = (item, index) => (
    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200/50 hover:bg-gray-100/50 transition-colors">
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-xs font-bold text-gray-800 truncate select-all">{item.label || item.value}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">来源阶段: {item.stageName}</p>
      </div>
      {item.url && item.url !== '#' && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 px-2 py-1 text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 font-bold transition-colors"
        >
          查看
        </a>
      )}
      {item.value && (
        <a
          href={item.value.startsWith('git@') ? '#' : item.value}
          target={item.value.startsWith('git@') ? '_self' : '_blank'}
          rel="noreferrer"
          onClick={(e) => {
            if (item.value.startsWith('git@')) {
              e.preventDefault()
              navigator.clipboard.writeText(item.value)
              alert('源码仓库地址已复制到剪贴板！')
            }
          }}
          className="flex-shrink-0 select-all px-1.5 py-0.5 text-[9px] bg-slate-100 border border-gray-300 rounded font-mono text-gray-700 font-semibold shadow-sm hover:bg-slate-200 cursor-pointer"
        >
          {item.value.startsWith('git@') ? '复制 Git 地址' : item.value}
        </a>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-gray-250 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-150/70 px-5 py-4 bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
          {type === 'docs' ? (
            <>
              {/* Section 1: 需求文档 */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  需求文档 ({reqDocs.length})
                </h3>
                <div className="space-y-2">
                  {reqDocs.length === 0 ? (
                    <p className="text-xs text-gray-405 italic py-1 pl-3">暂无需求文档</p>
                  ) : (
                    reqDocs.map((item, idx) => renderItem(item, idx))
                  )}
                </div>
              </div>

              {/* Section 2: 用户文档 */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  用户文档 ({userDocs.length})
                </h3>
                <div className="space-y-2">
                  {userDocs.length === 0 ? (
                    <p className="text-xs text-gray-405 italic py-1 pl-3">暂无用户文档</p>
                  ) : (
                    userDocs.map((item, idx) => renderItem(item, idx))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Section 1: 源码访问地址 */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  源码访问地址 ({sourceCode.length})
                </h3>
                <div className="space-y-2">
                  {sourceCode.length === 0 ? (
                    <p className="text-xs text-gray-405 italic py-1 pl-3">暂无源码地址</p>
                  ) : (
                    sourceCode.map((item, idx) => renderItem(item, idx))
                  )}
                </div>
              </div>

              {/* Section 2: 安装包访问地址 */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  安装包访问地址 ({installPacks.length})
                </h3>
                <div className="space-y-2">
                  {installPacks.length === 0 ? (
                    <p className="text-xs text-gray-405 italic py-1 pl-3">暂无安装包</p>
                  ) : (
                    installPacks.map((item, idx) => renderItem(item, idx))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function buildLocalStageSummary(stage) {
  const lines = [
    `# ${stage.name}`,
    `status: ${stage.status}`,
    `duration: ${stage.duration || '-'}`,
    '',
    '## 环节内容',
    ...(stage.items || []).map((item) => `- ${item.label}: ${item.value || '-'}`),
    '',
    '## 输出物',
    ...(stage.outputs || []).map((output) => `- ${output.label || output.value || '-'} (${output.status || '-'})`),
    '',
    '## 审核环节',
    ...(stage.reviews || []).map((review) => `- ${review.label}: ${review.status || '-'} ${review.issues || ''}`),
    '',
    stage.logSummary ? `## 错误摘要\n${stage.logSummary}` : ''
  ]
  return lines.filter(Boolean).join('\n')
}

export default KanbanBoard
