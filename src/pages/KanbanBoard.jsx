import { useState, useEffect, useMemo, useRef } from 'react'
import { Lock, Clock, User, Bot, CheckCircle, FileCode, FlaskConical, Rocket, GitBranch, Package, FileText, Eye, Globe, Shield, Edit, Link, ClipboardCheck, Server, Download, Wind, Compass, AlertTriangle, Map, MapPin, ChevronLeft, RefreshCw, Sliders, Radio, Activity, Target, MessageSquare, X, AlertCircle, Loader2, Send, PlayCircle, Maximize2, Minimize2, Ban, Settings } from 'lucide-react'
import { createWorkOrder, fetchStageLog, fetchWorkOrder, listApps, listOpencodeAgents, listOpencodeModels, listWorkOrders, sendWorkOrderMessage, skipWorkOrderStage, startDevelopmentRun, subscribeWorkOrderEvents, updateWorkOrderAgentSelections, updateWorkOrderModelSelections } from '../api/workOrders'

const workOrders = [
  {
    id: 1,
    title: '航母母港潮汐窗口计算器',
    description: '接入四大母港潮汐数据，根据吃水阈值计算可出港时间窗和倒计时。',
    domain: '海洋域',
    priority: 'high',
    creator: '张三',
    progress: 80,
    lastUpdate: '5分钟前',
    currentStage: 4,
    requirementsItems: {
      businessNecessity: [
        '航母出港窗口依赖人工查阅潮汐表，决策延迟且易错，急需自动化计算工具。',
        '现有流程缺乏统一潮汐数据接入，多港口协同效率低，影响编队出港节奏。'
      ],
      expectedOutcome: [
        '四大母港潮汐窗口自动计算，决策时间从小时级压缩到分钟级。',
        '12.8 米吃水阈值实时校验，误判率降至 0，出港窗口倒计时可视化展示。'
      ],
      targetUsers: '航母编队航行调度员、港口作训参谋',
      coreFeatures: [
        '四大航母母港潮汐数据接入（诺福克、圣迭戈、布雷默顿、横须贺）',
        '12.8 米吃水阈值实时校验与窗口开放/关闭判定',
        '出港窗口倒计时计算与展示',
        '10 分钟自动刷新机制'
      ],
      inputData: '公开潮汐预报 API（NOAA、JODC 等），无需密钥',
      mainPages: '四宫格仪表盘式总览页 + 港口详情抽屉',
      acceptanceCriteria: [
        '应用可在本机一键安装、构建、测试并启动',
        '四港口潮汐数据正确接入并 10 分钟刷新',
        '12.8 米阈值判断准确，窗口倒计时显示无误',
        '交付产物包含 factory.manifest.json'
      ]
    },
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
          { label: '需求澄清结果', status: 'done', url: '#' }
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
    description: '基于甲板风速、风向和舰载机参数，辅助判断起降安全窗口。',
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
          { label: '需求澄清结果', status: 'done', url: '#' }
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
    description: '按海域网格监控商船密度变化，识别异常聚集并输出告警。',
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
          { label: '需求澄清结果', status: 'done', url: '#' }
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
    description: '监测开源社区活跃度、议题波动和异常行为趋势。',
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
          { label: '需求澄清结果', status: 'pending', url: '#' }
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

const stageKeyById = {
  1: 'requirements',
  2: 'design',
  3: 'coding',
  4: 'testing',
  5: 'deployment'
}

function ensureStageKey(stage) {
  return stage.key || stageKeyById[stage.id] || `stage-${stage.id}`
}

const runtimeStatusMap = {
  PENDING: 'pending',
  RUNNING: 'active',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  FAILED: 'failed'
}

const stageEstimateMsById = {
  1: 5 * 60 * 1000,
  2: 25 * 60 * 1000,
  3: 45 * 60 * 1000,
  4: 30 * 60 * 1000,
  5: 15 * 60 * 1000
}

const MODEL_STAGE_KEYS = ['requirements', 'design', 'coding', 'testing', 'deployment']
const AGENT_STAGE_KEYS = ['requirements', 'design', 'coding', 'testing', 'deployment']
const DEFAULT_OPENCODE_AGENT = 'build'

function normalizeStageStatus(status) {
  return runtimeStatusMap[status] || status || 'pending'
}

function normalizeModelOptions(models) {
  return (Array.isArray(models) ? models : [])
    .map((model) => {
      const id = String(model?.id || model || '').trim()
      if (!id) return null
      return {
        id,
        label: String(model?.label || id),
        provider: model?.provider || id.split('/')[0],
        name: model?.name || id.split('/').slice(1).join('/')
      }
    })
    .filter(Boolean)
}

function normalizeModelSelections(selections = {}) {
  const result = {}
  for (const key of MODEL_STAGE_KEYS) {
    const value = String(selections?.[key] || '').trim()
    result[key] = value || null
  }
  return result
}

function normalizeAgentOptions(agents) {
  return (Array.isArray(agents) ? agents : [])
    .map((agent) => {
      const id = String(agent?.id || agent || '').trim()
      if (!id) return null
      return {
        id,
        label: String(agent?.label || id),
        isPrimary: Boolean(agent?.isPrimary)
      }
    })
    .filter(Boolean)
}

function normalizeAgentSelections(selections = {}) {
  const result = {}
  for (const key of AGENT_STAGE_KEYS) {
    const value = String(selections?.[key] || '').trim()
    result[key] = value || DEFAULT_OPENCODE_AGENT
  }
  return result
}

function getDefaultAgentSelections() {
  return AGENT_STAGE_KEYS.reduce((acc, key) => {
    acc[key] = DEFAULT_OPENCODE_AGENT
    return acc
  }, {})
}

function modelSelectionsFromDefault(modelId) {
  const value = String(modelId || '').trim() || null
  return MODEL_STAGE_KEYS.reduce((acc, key) => {
    acc[key] = value
    return acc
  }, {})
}

function fillMissingAgentSelections(selections) {
  return {
    ...getDefaultAgentSelections(),
    ...normalizeAgentSelections(selections)
  }
}

function getDefaultModelSelections(modelOptions) {
  const first = modelOptions[0]?.id || null
  return modelSelectionsFromDefault(first)
}

function fillMissingModelSelections(selections, modelOptions) {
  const normalized = normalizeModelSelections(selections)
  const defaults = getDefaultModelSelections(modelOptions)
  return MODEL_STAGE_KEYS.reduce((acc, key) => {
    acc[key] = normalized[key] || defaults[key] || null
    return acc
  }, {})
}

function formatDurationForUi(ms) {
  const safeMs = Math.max(0, Number(ms) || 0)
  const totalSeconds = Math.ceil(safeMs / 1000)
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const totalMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (totalMinutes < 60) return seconds > 0 ? `${totalMinutes}分${seconds}秒` : `${totalMinutes}分钟`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
}

function getStageEstimateMs(stage) {
  return Number(stage?.estimatedDurationMs || stageEstimateMsById[stage?.id] || 0)
}

function getStageTimingDisplay(stage, visualStatus, progress, nowMs = Date.now()) {
  if (visualStatus === 'active') {
    const estimateMs = getStageEstimateMs(stage)
    if (stage?.startedAt && estimateMs > 0) {
      const startedAtMs = new Date(stage.startedAt).getTime()
      if (Number.isFinite(startedAtMs)) {
        return {
          label: '预计剩余',
          value: formatDurationForUi(Math.max(0, startedAtMs + estimateMs - nowMs))
        }
      }
    }
    if (stage?.estimatedRemaining && stage.estimatedRemaining !== '-') {
      return { label: '预计剩余', value: stage.estimatedRemaining }
    }
    if (estimateMs > 0 && progress > 0) {
      return {
        label: '预计剩余',
        value: formatDurationForUi(Math.max(0, estimateMs * (100 - progress) / 100))
      }
    }
    return { label: '预计剩余', value: '计算中' }
  }

  if (visualStatus === 'completed') {
    return { label: '实际耗时', value: stage?.actualDuration || stage?.duration || '-' }
  }

  if (visualStatus === 'skipped') {
    return { label: '计划耗时', value: stage?.estimatedDuration || (getStageEstimateMs(stage) ? formatDurationForUi(getStageEstimateMs(stage)) : '-') }
  }

  if (visualStatus === 'failed') {
    return { label: '已耗时', value: stage?.actualDuration || stage?.duration || '-' }
  }

  return { label: '计划耗时', value: stage?.estimatedDuration || (getStageEstimateMs(stage) ? formatDurationForUi(getStageEstimateMs(stage)) : '-') }
}

function isRuntimeOrder(order) {
  return typeof order?.id === 'string' && /^WO-\d{8}-\d{3}$/.test(order.id)
}

function normalizeRuntimeOrder(order) {
  return {
    ...order,
    domain: order.domain || 'AI生成',
    priority: order.priority || 'medium',
    creator: order.creator || 'AI研发助手',
    progress: order.progress ?? 0,
    lastUpdate: order.lastUpdate || '刚刚',
    modelSelections: normalizeModelSelections(order.modelSelections),
    agentSelections: normalizeAgentSelections(order.agentSelections),
    stages: (order.stages || []).map((stage) => ({
      ...stage,
      key: ensureStageKey(stage),
      icon: stageIconById[stage.id] || Bot,
      items: stage.items?.length ? stage.items : [{ type: 'pending', label: stage.name, value: '-' }],
      outputs: stage.outputs || [],
      reviews: stage.reviews || []
    }))
  }
}

function normalizeMockOrder(order) {
  return {
    ...order,
    modelSelections: normalizeModelSelections(order.modelSelections),
    agentSelections: normalizeAgentSelections(order.agentSelections),
    stages: (order.stages || []).map((stage) => ({
      ...stage,
      key: ensureStageKey(stage),
      icon: stage.icon || stageIconById[stage.id] || Bot
    }))
  }
}

function mergeRegisteredApps(registeredApps) {
  if (!Array.isArray(registeredApps) || registeredApps.length === 0) return workOrders
  return workOrders.map((order) => {
    const registered = registeredApps.find((app) => app.title === order.title)
    if (!registered) return order
    return {
      ...order,
      appId: registered.id,
      title: registered.title || order.title,
      description: registered.description || order.description,
      domain: registered.domain || order.domain,
      workspaceDir: registered.workspaceDir,
      workspaceReady: registered.workspaceReady
    }
  })
}

export function normalizeChatMessage(message = {}) {
  const role = message.role || (message.sender === 'ai' ? 'assistant' : message.sender)
  const sender = message.sender || (role === 'assistant' ? 'ai' : role) || 'ai'
  const text = String(message.content ?? message.text ?? '')
  return {
    id: message.id || `${sender}-${message.createdAt || Date.now()}`,
    sender,
    text,
    kind: message.kind || null,
    metadata: message.metadata || null,
    status: message.status || 'COMPLETED',
    stageId: message.stageId || message.metadata?.stageKey || null,
    phase: message.phase || null,
    time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '刚刚'
  }
}

function upsertRuntimeOrder(orders, nextOrder) {
  if (!nextOrder?.id) return orders
  return [nextOrder, ...orders.filter(order => order.id !== nextOrder.id)]
}

export function applyGranularEventToOrder(order, event) {
  if (!order || order.id !== event.workOrderId) return order

  if (event.type === 'stage.status.changed') {
    const stageId = event.stageId
    return {
      ...order,
      progress: event.progress ?? order.progress,
      lastUpdate: '刚刚',
      stages: (order.stages || []).map(stage => {
        if (stage.key !== stageId && String(stage.id) !== String(stageId)) return stage
        return {
          ...stage,
          ...(event.stage || {}),
          status: event.status || event.stage?.status || stage.status
        }
      })
    }
  }

  if (event.type === 'assistant.message.append' && event.message) {
    const existing = order.messages || []
    const exists = existing.some(message => message.id === event.message.id)
    const incoming = { ...event.message, kind: event.message.kind || null, metadata: event.message.metadata || null }
    return {
      ...order,
      messages: exists ? existing.map(message => message.id === event.message.id ? { ...message, ...incoming } : message) : [...existing, incoming],
      lastUpdate: '刚刚'
    }
  }

  if (event.type === 'assistant.message.delta' && event.messageId) {
    const existingMessages = order.messages || []
    const hasTargetMessage = existingMessages.some(message => message.id === event.messageId)
    if (!hasTargetMessage) {
      const metadata = event.metadata && typeof event.metadata === 'object' ? event.metadata : null
      const content = event.delta || ''
      return {
        ...order,
        messages: [
          ...existingMessages,
          {
            id: event.messageId,
            role: 'assistant',
            content,
            text: content,
            phase: 'execution',
            stageId: event.stageId || metadata?.stageKey || null,
            kind: 'opencode-stream',
            metadata,
            status: event.status || 'STREAMING',
            createdAt: event.timestamp || new Date().toISOString()
          }
        ],
        lastUpdate: '刚刚'
      }
    }
    return {
      ...order,
      messages: existingMessages.map(message => {
        if (message.id !== event.messageId) return message
        const content = `${message.content ?? message.text ?? ''}${event.delta || ''}`
        const incomingMetadata = event.metadata && typeof event.metadata === 'object'
          ? { ...(message.metadata || {}), ...event.metadata }
          : message.metadata || null
        return {
          ...message,
          content,
          text: content,
          kind: message.kind || null,
          metadata: incomingMetadata,
          status: event.status || message.status || 'STREAMING'
        }
      }),
      lastUpdate: '刚刚'
    }
  }

  if (event.type === 'work-order.status.changed' || event.type === 'development.run.started') {
    const next = event.workOrder || null
    return {
      ...order,
      ...(next ? next : {}),
      status: next?.status || event.status || order.status,
      progress: next?.progress ?? event.progress ?? order.progress,
      lastUpdate: '刚刚'
    }
  }

  if (event.type === 'work-order.model-selections.updated') {
    return {
      ...order,
      modelSelections: normalizeModelSelections(event.modelSelections || event.workOrder?.modelSelections || order.modelSelections),
      lastUpdate: '刚刚'
    }
  }

  if (event.type === 'work-order.agent-selections.updated') {
    return {
      ...order,
      agentSelections: normalizeAgentSelections(event.agentSelections || event.workOrder?.agentSelections || order.agentSelections),
      lastUpdate: '刚刚'
    }
  }

  if (event.type === 'deployment.updated') {
    return {
      ...order,
      status: event.status || order.status,
      deploymentUrl: event.deploymentUrl ?? order.deploymentUrl,
      deploymentHealthUrl: event.deploymentHealthUrl ?? order.deploymentHealthUrl,
      progress: event.status === 'DEPLOYED' ? 100 : order.progress,
      lastUpdate: '刚刚'
    }
  }

  return order
}

export function toAppAccessUrl(url) {
  const trimmed = String(url || '').trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed)
    return /^\/api(?:\/|$)/.test(parsed.pathname) ? parsed.origin : trimmed
  } catch {
    return trimmed
  }
}

// Extract and group deliverables (产出文档, 制品, 访问地址) from order stages
const getDeliverables = (order) => {
  const docs = []
  const builds = []
  const urls = []

  if (!order) return { docs, builds, urls, reqDocs: [], userDocs: [], sourceCode: [], installPacks: [] }

  if (order.deploymentUrl) {
    urls.push({ label: '部署地址', value: toAppAccessUrl(order.deploymentUrl), isLink: true })
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
        const value = output.label === '访问地址' || output.label === '部署地址'
          ? toAppAccessUrl(output.value)
          : output.value
        urls.push({ ...output, value, stageName: stage.name })
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

export function StageCard({
  stage,
  onShowLogs,
  isSelected = false,
  onSelect = null,
  onSkipStage = null,
  skipLoading = false,
  modelOptions = [],
  modelSelections = {},
  modelLocked = true,
  onModelChange = null,
  agentOptions = [],
  agentSelections = {},
  agentLocked = true,
  onAgentChange = null
}) {
  const colors = stageColors[stage.id] || stageColors[1]
  const Icon = stage.icon
  const visualStatus = normalizeStageStatus(stage.status)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [modelConfigOpen, setModelConfigOpen] = useState(false)
  const stageModelKey = ['design', 'coding', 'testing', 'deployment'].includes(stage.key) ? stage.key : null
  const selectedModel = stageModelKey ? normalizeModelSelections(modelSelections)[stageModelKey] : null
  const canEditModel = Boolean(stageModelKey && onModelChange && modelOptions.length > 0 && !modelLocked && visualStatus === 'pending')
  const stageAgentKey = AGENT_STAGE_KEYS.includes(stage.key) ? stage.key : null
  const selectedAgent = stageAgentKey ? normalizeAgentSelections(agentSelections)[stageAgentKey] : DEFAULT_OPENCODE_AGENT
  const canEditAgent = Boolean(stageAgentKey && onAgentChange && agentOptions.length > 0 && !agentLocked && (stage.key === 'requirements' || visualStatus === 'pending'))
  const canOpenConfig = canEditModel || canEditAgent
  const configButtonLabel = canEditModel && canEditAgent
    ? '配置阶段模型与 Agent'
    : canEditAgent
      ? '配置阶段 Agent'
      : '配置阶段模型'

  const stageAgents = {
    1: '需求设计 Agent',
    2: '需求设计 Agent',
    3: '代码生成 Agent',
    4: '测试质量 Agent',
    5: '部署交付 Agent'
  }

  const progress = (() => {
    if (visualStatus === 'completed' || visualStatus === 'skipped') return 100
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

  useEffect(() => {
    if (visualStatus !== 'active') return undefined
    const timer = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [visualStatus, stage.startedAt, stage.estimatedDurationMs])

  useEffect(() => {
    if (!canOpenConfig) {
      setModelConfigOpen(false)
    }
  }, [canOpenConfig])

  const timing = getStageTimingDisplay(stage, visualStatus, progress, nowMs)
  const repairStatusText = (() => {
    const repairItem = (stage.items || []).find((item) =>
      String(item.label || '').includes('返修') || String(item.value || '').includes('返修')
    )
    if (repairItem?.value) return String(repairItem.value)
    const current = Number(stage.repairAttempts?.current || 0)
    const max = Number(stage.repairAttempts?.max || 0)
    if (current > 0 && max > 0) return `第 ${current}/${max} 次返修中`
    return ''
  })()

  const handleCardClick = () => {
    if (onSelect) onSelect(stage)
  }

  const handleDetailsClick = (event) => {
    event.stopPropagation()
    onShowLogs?.(stage)
  }

  const canSkipStage = Boolean(onSkipStage) && stage.id >= 2 && stage.id <= 5 && visualStatus === 'pending'

  const handleSkipClick = (event) => {
    event.stopPropagation()
    onSkipStage?.(stage)
  }

  const handleModelChange = (event) => {
    event.stopPropagation()
    onModelChange?.(stageModelKey, event.target.value || null)
  }

  const handleAgentChange = (event) => {
    event.stopPropagation()
    onAgentChange?.(stageAgentKey, event.target.value || DEFAULT_OPENCODE_AGENT)
  }

  const handleModelConfigClick = (event) => {
    event.stopPropagation()
    setModelConfigOpen((open) => !open)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`relative w-full min-w-0 h-[220px] rounded-lg ${colors.bg} border border-gray-200 flex flex-col transition-all ${
        onSelect ? 'cursor-pointer hover:shadow-lg' : ''
      } ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md shadow-blue-200' :
        visualStatus === 'active' ? 'ring-2 ring-blue-400 shadow-md shadow-blue-100' : ''
      } ${visualStatus === 'pending' ? 'opacity-65' : ''} ${visualStatus === 'failed' ? 'ring-2 ring-red-400 shadow-md shadow-red-100' : ''} ${visualStatus === 'skipped' ? 'ring-2 ring-slate-300 shadow-md shadow-slate-100' : ''}`}
      title={onSelect ? `点击查看「${stage.name}」阶段思考过程` : undefined}
    >

      {/* Header */}
      <div className={`${colors.header} rounded-t-lg px-3 py-2 border-b border-gray-200/50`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-white/90 border border-gray-200/80 text-[18px] font-bold flex items-center justify-center text-gray-700 flex-shrink-0 font-mono">
              {stage.id}
            </span>
            <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {stage.time && stage.time !== '-' && (
              <span className="text-[18px] text-gray-500 bg-white/70 px-2 py-0.5 rounded font-mono font-medium shadow-sm">
                {stage.time}
              </span>
            )}
            {visualStatus === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {visualStatus === 'active' && <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>}
            {visualStatus === 'pending' && <Lock className="w-5 h-5 text-gray-400" />}
            {visualStatus === 'skipped' && <Ban className="w-5 h-5 text-slate-500" />}
            {visualStatus === 'failed' && <AlertCircle className="w-5 h-5 text-red-500" />}
          </div>
        </div>
        <span className={`mt-1 block font-bold text-[20px] truncate ${colors.text}`} title={stage.name}>{stage.name}</span>
      </div>

      {/* Body: Center status and duration */}
      <div className="flex-1 p-2.5 flex flex-col justify-center items-center text-center gap-2 min-h-0">
        {visualStatus === 'active' && repairStatusText && (
          <div className="max-w-full rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[18px] font-bold text-amber-700 truncate">
            {repairStatusText}
          </div>
        )}

        {/* Used Agent badge */}
        <div className="flex items-center gap-2 px-2 py-1 bg-white/80 rounded-md text-[18px] font-medium text-gray-600 border border-gray-150/50 shadow-sm max-w-full">
          <Bot className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="truncate">{stageAgents[stage.id] || 'AI Agent'}</span>
        </div>

        {/* Progress Bar (Only show if stage.id >= 2 && stage.id <= 5, i.e., in intelligent development template cards) */}
        {stage.id >= 2 && stage.id <= 5 && (
          <div className="w-full px-1">
            <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  visualStatus === 'completed' ? 'bg-green-500' :
                  visualStatus === 'active' ? 'bg-blue-500 animate-pulse' :
                  visualStatus === 'skipped' ? 'bg-slate-400' :
                  visualStatus === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[17px] text-gray-500 mt-1 font-semibold">
              <span>进度</span>
              <span className="font-mono">{progress}%</span>
            </div>
          </div>
        )}

        <div className="w-full rounded-md border border-white/70 bg-white/70 px-2.5 py-1.5 flex items-center justify-between shadow-sm">
          <span className="text-[17px] font-semibold text-gray-500">{timing.label}</span>
          <span className={`text-[20px] font-bold font-mono tracking-tight ${
          visualStatus === 'active' ? 'text-blue-600' :
          visualStatus === 'failed' ? 'text-red-500' :
          visualStatus === 'completed' ? 'text-gray-500' :
          visualStatus === 'skipped' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            {timing.value}
          </span>
        </div>
      </div>

      {modelConfigOpen && canOpenConfig && (
        <div
          className="absolute left-3 right-3 bottom-12 z-20 rounded-lg border border-blue-200 bg-white p-3 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {canEditAgent && (
            <label className="block">
              <span className="mb-2 block text-[17px] font-bold text-gray-600">阶段 Agent</span>
              <select
                value={selectedAgent || DEFAULT_OPENCODE_AGENT}
                onChange={handleAgentChange}
                className="w-full min-w-0 rounded-md border border-blue-200 bg-white px-2 py-1.5 text-[17px] font-semibold text-gray-700"
                title="选择该阶段调用 opencode 的 Agent"
              >
                {agentOptions.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.label}</option>
                ))}
              </select>
            </label>
          )}
          {canEditModel && (
            <label className={`block ${canEditAgent ? 'mt-3' : ''}`}>
              <span className="mb-2 block text-[17px] font-bold text-gray-600">阶段模型</span>
              <select
                id={`stage-model-${stage.key}`}
                value={selectedModel || modelOptions[0]?.id || ''}
                onChange={handleModelChange}
                className="w-full min-w-0 rounded-md border border-blue-200 bg-white px-2 py-1.5 text-[17px] font-semibold text-gray-700"
                title="选择该阶段调用 opencode 的模型"
              >
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>{model.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-150/60 bg-white/40 rounded-b-lg flex items-center justify-between text-[18px] gap-2">
        <span className="text-gray-450 truncate max-w-[72px] font-medium text-[18px]">
          {stage.gate.exit ? `准出: ${stage.gate.exit}` : '-'}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {canOpenConfig && (
            <button
              type="button"
              onClick={handleModelConfigClick}
              className={`inline-flex h-8 w-8 items-center justify-center rounded border text-gray-600 transition-colors shadow-sm ${
                modelConfigOpen
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white/90 hover:bg-white hover:text-blue-600'
              }`}
              title={configButtonLabel}
              aria-label={configButtonLabel}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {canSkipStage && (
            <button
              type="button"
              onClick={handleSkipClick}
              disabled={skipLoading}
              className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[18px] font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-60"
            >
              {skipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              跳过
            </button>
          )}
          <button
            type="button"
            onClick={handleDetailsClick}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white/90 px-2 py-1 text-[18px] font-bold text-gray-600 hover:bg-white hover:text-blue-600 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" />
            日志
          </button>
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
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Radio className="w-8 h-8 text-green-500 animate-pulse" />
          <span className="text-[28px] font-semibold text-slate-300">潮汐数据源已接入 (每10分钟自动刷新)</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-3 px-6 py-3 bg-[#243340] border border-blue-500/30 hover:border-blue-500/80 text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50 rounded text-[24px] transition-all"
        >
          <RefreshCw className={`w-7 h-7 ${refreshing ? 'animate-spin' : ''}`} />
          手动拉取最新数据
        </button>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {tides.map((port, idx) => (
          <div key={idx} className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-10 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[32px] font-bold text-white">{port.name}</span>
              <span className={`px-5 py-1 rounded text-[24px] font-semibold ${
                port.status === 'open' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                {port.status === 'open' ? '窗口开放' : '窗口关闭'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-[#1B2732] rounded-lg p-6 border border-slate-700/30">
                <span className="text-[24px] text-slate-300 block mb-1">当前潮高</span>
                <span className={`text-[48px] font-black ${port.tide >= 12.8 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {port.tide} 米
                </span>
                <span className="text-[20px] text-slate-400 block mt-1">吃水阈值: 12.8 米</span>
              </div>

              <div className="bg-[#1B2732] rounded-lg p-6 border border-slate-700/30 flex flex-col justify-center">
                {port.status === 'open' ? (
                  <>
                    <span className="text-[24px] text-slate-300 block mb-1">当前窗口截止</span>
                    <span className="text-[28px] font-semibold text-slate-200">{port.time}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[24px] text-slate-300 block mb-1">距离下一个窗口</span>
                    <span className="text-[32px] font-bold text-red-400 animate-pulse">{port.countdown}</span>
                  </>
                )}
              </div>
            </div>

            <div className="h-16 relative bg-[#1B2732]/45 rounded-lg border border-slate-700/40 overflow-hidden flex items-end">
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 60">
                <line x1="0" y1="26" x2="300" y2="26" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                <text x="230" y="20" fill="#ef4444" className="text-[16px]">12.8米吃水线</text>
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
    <div className="grid grid-cols-3 gap-12">
      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-10 space-y-10 col-span-1">
        <h3 className="font-bold text-white text-[28px] border-b border-slate-700 pb-4 flex items-center gap-4">
          <Sliders className="w-8 h-8 text-blue-400" />
          输入计算参数
        </h3>

        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between text-[24px]">
              <span className="text-slate-300">真风风速 (knots)</span>
              <span className="font-bold text-blue-400">{windSpeed} 节</span>
            </div>
            <input
              type="range" min="0" max="50" value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[24px]">
              <span className="text-slate-300">真风风向 (角度)</span>
              <span className="font-bold text-blue-400">{windAngle}°</span>
            </div>
            <input
              type="range" min="0" max="360" value={windAngle}
              onChange={(e) => setWindAngle(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[24px]">
              <span className="text-slate-300">航母航速 (knots)</span>
              <span className="font-bold text-emerald-400">{carrierSpeed} 节</span>
            </div>
            <input
              type="range" min="0" max="30" value={carrierSpeed}
              onChange={(e) => setCarrierSpeed(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[24px]">
              <span className="text-slate-300">航母航向 (角度)</span>
              <span className="font-bold text-emerald-400">{carrierHeading}°</span>
            </div>
            <input
              type="range" min="0" max="360" value={carrierHeading}
              onChange={(e) => setCarrierHeading(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-10 flex flex-col items-center justify-center col-span-1">
        <h3 className="font-bold text-white text-[28px] border-b border-slate-700 pb-4 w-full text-center mb-4 flex items-center justify-center gap-4">
          <Compass className="w-8 h-8 text-purple-400" />
          甲板合成风矢量解算
        </h3>

        <div className="relative w-48 h-48 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center">
          <div className="absolute w-full h-px bg-slate-800"></div>
          <div className="absolute h-full w-px bg-slate-800"></div>
          <div className="absolute inset-4 rounded-full border border-slate-800 border-dashed"></div>
          <span className="absolute top-1 text-[20px] text-slate-500 font-bold">N 0°</span>
          <span className="absolute bottom-1 text-[20px] text-slate-500 font-bold">S 180°</span>
          <span className="absolute right-1 text-[20px] text-slate-500 font-bold">E 90°</span>
          <span className="absolute left-1 text-[20px] text-slate-500 font-bold">W 270°</span>

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

        <div className="flex gap-8 mt-3 text-[20px]">
          <span className="flex items-center gap-2"><span className="w-5 h-1 bg-blue-500"></span> 真风</span>
          <span className="flex items-center gap-2"><span className="w-5 h-1 bg-emerald-500"></span> 航速</span>
          <span className="flex items-center gap-2"><span className="w-5 h-1 bg-red-500"></span> 合成甲板风</span>
        </div>
      </div>

      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-10 space-y-8 col-span-1 flex flex-col justify-between">
        <h3 className="font-bold text-white text-[28px] border-b border-slate-700 pb-4 flex items-center gap-4">
          <Wind className="w-8 h-8 text-emerald-400" />
          解算状态输出
        </h3>

        <div className="space-y-6 flex-1 justify-center flex flex-col">
          <div className="bg-[#1B2732] rounded-lg p-6 border border-slate-700/30 flex justify-between items-center">
            <div>
              <span className="text-[24px] text-slate-300 block">合成甲板风速</span>
              <span className="text-[48px] font-black text-white">{relativeSpeed} 节</span>
            </div>
            <span className={`px-4 py-1 rounded text-[20px] font-semibold ${isSpeedOk ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              {isSpeedOk ? '风速达标' : '风速偏低'}
            </span>
          </div>

          <div className="bg-[#1B2732] rounded-lg p-6 border border-slate-700/30 flex justify-between items-center">
            <div>
              <span className="text-[24px] text-slate-300 block">合成甲板风角</span>
              <span className="text-[48px] font-black text-white">{relativeAngle}°</span>
            </div>
            <span className={`px-4 py-1 rounded text-[20px] font-semibold ${isAngleOk ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              {isAngleOk ? '偏角合规' : '偏角超限'}
            </span>
          </div>
        </div>

        <div className={`rounded-xl p-8 text-center border transition-all ${
          isSafe
            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-red-950/60 border-red-500 text-red-400'
        }`}>
          <span className="text-[24px] text-slate-300 block mb-1">舰载机安全起降状态</span>
          <span className="text-[32px] font-bold flex items-center justify-center gap-3">
            {isSafe ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                满足安全着舰条件
              </>
            ) : (
              <>
                <AlertTriangle className="w-10 h-10 text-red-400" />
                禁止着舰 / 需弹射辅助
              </>
            )}
          </span>
          <span className="text-[20px] text-slate-305/70 block mt-1">（最小甲板风速需20节，偏角±15°内）</span>
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
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8 text-[28px]">
          <div className="flex items-center gap-3 text-slate-300">
            <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span>AIS 位置数据流活跃 (3分钟轮询)</span>
          </div>
          <button
            onClick={triggerRefresh}
            className="text-[24px] px-5 py-2 bg-[#243340] border border-blue-500/30 hover:border-blue-500/80 text-blue-400 hover:text-blue-300 font-semibold rounded flex items-center gap-3"
          >
            <RefreshCw className="w-7 h-7" />
            模拟AIS刷新
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-[24px] text-slate-300">只看异常告警网格</label>
          <input
            type="checkbox"
            checked={filterAlerts}
            onChange={(e) => setFilterAlerts(e.target.checked)}
            className="w-8 h-8 rounded bg-[#243340] border-slate-700 text-blue-500 accent-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12">
        {displayedGrids.map((grid) => {
          const status = grid.pct < 50 ? 'red' : grid.pct < 70 ? 'yellow' : 'green'
          const points = grid.sparkline.map((val, idx) => {
            const x = (idx * 16).toFixed(0)
            const maxVal = grid.baseline * 1.3
            const y = (35 - (val / maxVal) * 30).toFixed(0)
            return `${x},${y}`
          }).join(' ')

          return (
            <div key={grid.id} className={`bg-[#243340]/80 border rounded-xl p-8 space-y-6 transition-all ${
              status === 'red' ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
              status === 'yellow' ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              'border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[20px] text-slate-400 font-mono block">GRID {grid.id}</span>
                  <span className="text-[28px] font-bold text-white">{grid.name}</span>
                </div>
                <span className={`w-6 h-6 rounded-full ${
                  status === 'red' ? 'bg-red-500 animate-ping' :
                  status === 'yellow' ? 'bg-amber-500 animate-pulse' :
                  'bg-emerald-500'
                }`}></span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#1B2732] rounded-lg p-5 border border-slate-700/30">
                <div>
                  <span className="text-[20px] text-slate-400 block">当前商船</span>
                  <span className={`text-[32px] font-black ${
                    status === 'red' ? 'text-red-400' :
                    status === 'yellow' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>{grid.count} 艘</span>
                </div>
                <div>
                  <span className="text-[20px] text-slate-400 block">30天均值</span>
                  <span className="text-[32px] font-bold text-slate-300">{grid.baseline} 艘</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/30 pt-4 text-[20px]">
                <span className="text-slate-300">密度比例: </span>
                <span className={`font-bold ${
                  status === 'red' ? 'text-red-400' :
                  status === 'yellow' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>{grid.pct}%</span>
              </div>

              <div className="h-10 w-full relative pt-4 bg-[#1B2732]/30 rounded border border-slate-700/30">
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
    <div className="grid grid-cols-3 gap-12">
      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-8 col-span-1 space-y-8 flex flex-col">
        <h3 className="font-bold text-white text-[28px] border-b border-slate-700 pb-4 flex items-center gap-3">
          <Activity className="w-8 h-8 text-sky-400" />
          最新社交媒体抓取流
        </h3>

        <div className="space-y-4 overflow-y-auto max-h-80 flex-1">
          {posts.map((post) => (
            <div key={post.id} className="bg-[#1B2732] rounded border border-slate-700/30 p-5 text-[24px] space-y-3">
              <div className="flex justify-between text-[20px]">
                <span className={post.source === 'Twitter' ? 'text-sky-400 font-semibold' : 'text-pink-400 font-semibold'}>
                  @{post.source}
                </span>
                <span className="text-slate-400">{post.time}</span>
              </div>
              <p className="text-slate-300 leading-normal">{post.text}</p>
              <div className="flex items-center gap-2 text-[20px] text-slate-400">
                <MapPin className="w-6 h-6" />
                <span>GPS: {post.coords}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#243340]/80 border border-slate-700/50 rounded-xl p-8 col-span-2 space-y-8 flex flex-col">
        <h3 className="font-bold text-white text-[28px] border-b border-slate-700 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-indigo-400" />
            地理空间坐标落点散点图
          </div>
          <span className="text-[20px] px-4 py-1 bg-sky-950 text-sky-400 border border-sky-800 rounded">每15分钟抓取</span>
        </h3>

        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative min-h-64 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-20">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border-r border-b border-slate-700"></div>
            ))}
          </div>

          <div className="absolute top-2 left-2 text-[20px] text-slate-600 font-mono">监控网格: 横须贺沿海防区</div>

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
                <text x="6" y="16" fill="#ef4444" className="text-[18px] font-bold">发现目击潮聚合</text>
                <text x="6" y="28" fill="#cbd5e1" className="text-[16px]">Yokosuka (4点重合)</text>
                <text x="6" y="36" fill="#10b981" className="text-[14px]">置信度: 92%</text>
              </g>
            </g>
          )}

          <div className="absolute bottom-4 right-4 flex gap-4">
            {!hasCluster ? (
              <button
                onClick={runClusterAnalysis}
                disabled={analysing}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-[24px] font-semibold shadow-md flex items-center gap-2 transition-all"
              >
                <Target className="w-7 h-7" />
                {analysing ? '正在运行聚类分析...' : '运行目击潮空间聚类'}
              </button>
            ) : (
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 bg-[#243340] border border-blue-500/30 hover:border-blue-500/80 text-blue-400 hover:text-blue-300 font-semibold rounded text-[24px] flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-7 h-7" />
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
    <div className="bg-[#1B2732] text-slate-100 rounded-xl border border-slate-700/50 p-12 flex flex-col h-full space-y-12 shadow-2xl overflow-y-auto" style={{ minHeight: 'calc(100vh - 180px)' }}>
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-8">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="p-4 hover:bg-[#243340] rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <div>
            <div className="flex items-center gap-4">
              <span className="w-5 h-5 rounded-full bg-green-500 animate-pulse"></span>
              <h1 className="text-[40px] font-bold text-white">{order?.title}</h1>
              <span className="text-[24px] px-4 py-1 bg-blue-900/50 text-blue-400 border border-blue-800 rounded">已部署运行中</span>
            </div>
            <p className="text-[24px] text-slate-400 mt-1">{order?.domain} · 生产环境交付界面</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[24px] font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 border border-transparent"
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

export function WorkOrderCard({ order, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 cursor-pointer transition-all min-h-[112px] ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
          <span className="text-white font-bold text-[24px]">{order.title[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-[26px] leading-tight break-words">{order.title}</h3>
        </div>
      </div>
    </div>
  )
}

function requirementFieldToText(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).join('；')
  return String(value || '').trim()
}

// Requirements Items Card - 条目化需求内容展示（业务必要性/预期成效等）
export function RequirementsItemsCard({ items, title }) {
  if (!items) {
    return (
      <div className="w-full rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
        <FileText className="w-8 h-8 text-blue-400 mx-auto mb-1" />
        <span className="text-[20px] text-gray-500 font-medium">条目化需求尚未生成</span>
        <p className="text-[18px] text-gray-400 mt-0.5">完成需求澄清后将自动展示条目化需求内容</p>
      </div>
    )
  }

  const sections = [
    { key: 'businessNecessity', label: '业务必要性', icon: Target, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
    { key: 'expectedOutcome', label: '预期成效', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    { key: 'targetUsers', label: '目标用户', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', scalar: true },
    { key: 'coreFeatures', label: '核心功能', icon: Bot, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
    { key: 'inputData', label: '输入数据', icon: Server, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', scalar: true },
    { key: 'mainPages', label: '主要页面/交互', icon: FileCode, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', scalar: true },
    { key: 'acceptanceCriteria', label: '验收标准', icon: ClipboardCheck, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', dot: 'bg-teal-500' }
  ]
  const detailedRequirements = Array.isArray(items.detailedRequirements)
    ? items.detailedRequirements
      .map((item) => ({
        requirement: requirementFieldToText(item?.requirement || item?.title || item?.name || item?.description),
        businessNecessity: requirementFieldToText(item?.businessNecessity || item?.necessity || item?.businessValue),
        expectedOutcome: requirementFieldToText(item?.expectedOutcome || item?.outcome || item?.effect)
      }))
      .filter((item) => item.requirement || item.businessNecessity || item.expectedOutcome)
    : []

  return (
    <div className="w-full rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-2 pb-4 border-b border-blue-200/60">
        <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[22px] text-gray-800 truncate">{title || '需求澄清结果'}</h4>
          <p className="text-[18px] text-gray-500">条目化需求摘要 · 含业务必要性与预期成效</p>
        </div>
        <span className="text-[18px] px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold border border-emerald-200 flex-shrink-0">
          已生成
        </span>
      </div>

      {detailedRequirements.length > 0 && (
        <div className="mb-4 rounded-md border border-slate-200 bg-white/80 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-6 h-6 text-slate-600 flex-shrink-0" />
            <span className="font-bold text-[20px] text-slate-700">细化需求</span>
            <span className="ml-auto text-[18px] font-mono text-slate-500">{detailedRequirements.length} 条</span>
          </div>
          <div className="space-y-3">
            {detailedRequirements.map((item, idx) => (
              <div key={idx} className="border-l-4 border-blue-400 pl-4 text-[19px] leading-relaxed text-gray-700">
                {item.requirement && (
                  <p className="font-semibold text-gray-800 whitespace-pre-wrap break-words">{idx + 1}. 需求内容：{item.requirement}</p>
                )}
                {item.businessNecessity && (
                  <p className="mt-1 whitespace-pre-wrap break-words">业务需求必要性：{item.businessNecessity}</p>
                )}
                {item.expectedOutcome && (
                  <p className="mt-1 whitespace-pre-wrap break-words">预期成效：{item.expectedOutcome}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {sections.map((section) => {
          const SectionIcon = section.icon
          const value = items[section.key]
          const list = section.scalar ? (value ? [value] : []) : (Array.isArray(value) ? value : [])
          if (list.length === 0) return null
          return (
            <div key={section.key} className={`rounded-md border ${section.border} ${section.bg} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <SectionIcon className={`w-6 h-6 ${section.color} flex-shrink-0`} />
                <span className={`font-bold text-[20px] ${section.color}`}>{section.label}</span>
                {!section.scalar && (
                  <span className={`ml-auto text-[18px] font-mono ${section.color} opacity-70`}>{list.length} 条</span>
                )}
              </div>
              <ul className="space-y-1">
                {list.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[19px] text-gray-700 leading-relaxed">
                    <span className={`w-2 h-2 rounded-full ${section.dot} mt-1.5 flex-shrink-0`}></span>
                    <span className="break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// AI Chat Panel Component
export function AIChatPanel({
  activeOrder,
  onSendMessage,
  onStartDevelopment,
  onClose,
  loading,
  error,
  startingDevelopment,
  selectedStageKey = 'all',
  onSelectStage = null,
  stages = [],
  requirementsItems = null,
  modelOptions = [],
  modelSelections = {},
  onModelChange = null
}) {
  const [inputValue, setInputValue] = useState('')
  const [isZoomed, setIsZoomed] = useState(false)
  const messagesEndRef = useRef(null)

  const stageTabs = useMemo(() => [
    { key: 'all', name: '全部', icon: MessageSquare },
    ...(stages.length > 0 ? stages.map((stage) => ({
      key: stage.key,
      name: stage.name,
      icon: stage.icon || Bot,
      status: normalizeStageStatus(stage.status)
    })) : [
      { key: 'requirements', name: '需求待入厂', icon: Package, status: 'pending' },
      { key: 'design', name: '系统设计', icon: GitBranch, status: 'pending' },
      { key: 'coding', name: '智能编码', icon: FileCode, status: 'pending' },
      { key: 'testing', name: '测试质检', icon: FlaskConical, status: 'pending' },
      { key: 'deployment', name: '部署交付', icon: Rocket, status: 'pending' }
    ])
  ], [stages])

  const normalizedAllMessages = useMemo(() => {
    if (activeOrder.messages?.length) {
      return activeOrder.messages.map(normalizeChatMessage)
    }
    return [
      {
        id: 'demo-greeting',
        sender: 'ai',
        text: activeOrder.awaitingOriginalRequirement
          ? `应用已创建：【${activeOrder.title}】。请输入原始需求，我会结合应用标题完成需求澄清。`
          : `您好！我是【${activeOrder.title}】的 AI 研发专家。请输入新的应用需求，我会创建真实工单并交给后端流水线执行。`,
        time: '刚刚',
        stageId: null,
        kind: null,
        phase: 'clarification'
      }
    ]
  }, [activeOrder])

  const stageMessageCounts = useMemo(() => {
    const counts = { all: normalizedAllMessages.length }
    for (const tab of stageTabs) {
      if (tab.key === 'all') continue
      counts[tab.key] = normalizedAllMessages.filter((msg) => messageBelongsToStage(msg, tab.key)).length
    }
    return counts
  }, [normalizedAllMessages, stageTabs])

  const displayMessages = useMemo(() => {
    if (selectedStageKey === 'all') return normalizedAllMessages
    return normalizedAllMessages.filter((msg) => messageBelongsToStage(msg, selectedStageKey))
  }, [normalizedAllMessages, selectedStageKey])

  const effectiveRequirementsItems = useMemo(() => {
    if (requirementsItems) return requirementsItems
    const itemsMsg = normalizedAllMessages.find((msg) => msg.kind === 'requirements-items' && msg.metadata?.requirementsItems)
    return itemsMsg?.metadata?.requirementsItems || activeOrder.requirementsItems || null
  }, [requirementsItems, normalizedAllMessages, activeOrder])

  const showRequirementsCard = selectedStageKey === 'requirements'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, error, showRequirementsCard])

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

  const isRuntime = isRuntimeOrder(activeOrder)
  const canStartDevelopment = isRuntime && activeOrder.status === 'READY_FOR_DEVELOPMENT' && !startingDevelopment
  const canConfigureRequirementsModel = modelOptions.length > 0 && Boolean(onModelChange) && (!isRuntime || activeOrder.awaitingOriginalRequirement)
  const effectiveModelSelections = normalizeModelSelections(modelSelections)

  return (
    <>
      {isZoomed && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity cursor-pointer" 
          onClick={() => setIsZoomed(false)}
        />
      )}
      <div className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col shadow-sm transition-all duration-300 ${
        isZoomed 
          ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] z-50 shadow-2xl' 
          : 'h-full w-full'
      }`}>
        <div className="w-full flex flex-col h-full min-h-0">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="font-bold text-gray-800 text-[24px] flex-shrink-0">AI 研发助手</h3>
              <span className="text-[20px] text-gray-400">|</span>
              <p className="text-[20px] text-gray-500 truncate" title={activeOrder.title}>当前应用: {activeOrder.title}</p>
            </div>
            <div className="flex items-center gap-3">
              {canStartDevelopment && (
                <button
                  onClick={() => onStartDevelopment?.(activeOrder)}
                  disabled={startingDevelopment}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-md text-[20px] font-bold shadow-sm transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 flex-shrink-0"
                  title="需求澄清已完成，点击启动智能开发流水线"
                >
                  <PlayCircle className="w-6 h-6" />
                  开始智能开发
                </button>
              )}
              {startingDevelopment && (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[18px] flex-shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>启动中...</span>
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-blue-600 font-semibold text-[18px] flex-shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>推进中...</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-650 transition-colors flex-shrink-0"
                title={isZoomed ? "恢复大小" : "放大"}
              >
                {isZoomed ? <Minimize2 className="w-8 h-8" /> : <Maximize2 className="w-8 h-8" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-650 transition-colors flex-shrink-0"
                title="收起助手"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>

        {canConfigureRequirementsModel && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-[20px] flex-shrink-0">
            <span className="font-bold text-blue-700 flex-shrink-0">项目默认模型</span>
            <select
              value={effectiveModelSelections.requirements || ''}
              onChange={(event) => onModelChange('projectDefault', event.target.value || null)}
              className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-[19px] font-semibold text-gray-700"
            >
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>{model.label}</option>
              ))}
            </select>
          </div>
        )}

        {onSelectStage && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 pb-4 mb-2 flex-shrink-0">
            <span className="text-[18px] text-gray-400 font-semibold flex-shrink-0 mr-1">阶段思考:</span>
            {stageTabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = selectedStageKey === tab.key
              const count = stageMessageCounts[tab.key] || 0
              const stageStatus = tab.status
              return (
                <button
                  key={tab.key}
                  onClick={() => onSelectStage(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-[20px] font-semibold transition-all flex-shrink-0 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                  }`}
                  title={`查看「${tab.name}」阶段思考过程`}
                >
                  <TabIcon className={`w-6 h-6 ${isActive ? 'text-white' : stageStatusColor(stageStatus)}`} />
                  <span className="truncate max-w-[64px]">{tab.name}</span>
                  {count > 0 && (
                    <span className={`ml-0.5 px-2 rounded-full text-[17px] font-mono ${
                      isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-[20px] mb-2">
          {showRequirementsCard && (
            <RequirementsItemsCard items={effectiveRequirementsItems} title={activeOrder.title} />
          )}
          {displayMessages.length === 0 && !showRequirementsCard && (
            <div className="flex flex-col items-center justify-center text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-1 text-gray-300" />
              <span className="text-[20px] font-medium">该阶段暂无思考过程内容</span>
              <p className="text-[18px] mt-0.5">阶段开始后会自动同步 AI 思考与执行日志</p>
            </div>
          )}
          {displayMessages.map((msg) => {
            if (msg.kind === 'requirements-items') return null
            const isStream = msg.kind === 'opencode-stream'
            const isStreaming = isStream && msg.status === 'STREAMING'
            const isFailed = isStream && msg.status === 'FAILED'
            const activity = msg.metadata?.activity
            const isToolActivity = isStreaming && activity === 'tool'
            const isThinkingActivity = isStreaming && (activity === 'thinking' || !activity)
            const bubbleClass = isStream
              ? isFailed
                ? 'bg-red-50 text-red-800 rounded-tl-none border border-red-200'
                : isStreaming
                  ? 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-300'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/50'
              : msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                : msg.status === 'FAILED'
                  ? 'bg-red-50 text-red-750 rounded-tl-none border border-red-200'
                  : 'bg-gray-100 text-gray-850 rounded-tl-none border border-gray-200/50'
            return (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-lg p-3 leading-relaxed ${bubbleClass}`}>
                  {!isStream && msg.text && (
                    <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                  )}
                  {isStream && msg.text && (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '180px', overflowY: 'auto' }}>
                      {msg.text}
                    </div>
                  )}
                  {isStream && !msg.text && isStreaming && (
                    <span className="text-slate-500 italic">等待 AI 输出...</span>
                  )}
                  {isStream && isFailed && (
                    <div className="flex items-center gap-2 mt-1 pt-2 border-t border-red-200 text-[20px] text-red-600 font-semibold">
                      <AlertCircle className="w-5 h-5" />
                      <span>执行失败</span>
                    </div>
                  )}
                  {isStream && isThinkingActivity && (
                    <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-200 text-[20px] text-blue-600 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>正在思考</span>
                      <span className="inline-flex">
                        <span className="animate-pulse">·</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>·</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>·</span>
                      </span>
                    </div>
                  )}
                  {isStream && isToolActivity && (
                    <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-200 text-[20px] text-indigo-600 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{`正在执行 ${msg.metadata?.tool || '工具'}`}</span>
                      {msg.metadata?.toolDescription && (
                        <span className="text-slate-500 font-normal truncate max-w-[160px]">
                          {msg.metadata.toolDescription}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[18px] text-gray-400 mt-0.5 px-2">{msg.time}</span>
              </div>
            )
          })}
          {error && (
            <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
              <AlertCircle className="w-7 h-7 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-3 border-t border-gray-100 pt-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={activeOrder.awaitingOriginalRequirement ? '输入原始需求...' : `给【${activeOrder.title}】提需求...`}
            disabled={loading}
            className="flex-1 min-w-0 text-[20px] px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[20px] font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
    </>
  )
}

function messageBelongsToStage(msg, stageKey) {
  if (!msg) return false
  if (msg.kind === 'requirements-items') {
    return stageKey === 'requirements'
  }
  const msgStageId = msg.stageId || (msg.metadata?.stageKey)
  if (msgStageId) return msgStageId === stageKey
  if (stageKey === 'requirements') {
    return msg.phase === 'clarification' || !msg.phase || msg.sender === 'user' || msg.sender === 'ai'
  }
  return false
}

function stageStatusColor(status) {
  if (status === 'completed') return 'text-green-500'
  if (status === 'active') return 'text-blue-500'
  if (status === 'failed') return 'text-red-500'
  if (status === 'skipped') return 'text-slate-500'
  return 'text-gray-400'
}

export function CreateWorkOrderModal({ open, form, onChange, onClose, onSubmit, submitting, error, modelOptions = [] }) {
  if (!open) return null
  const current = form || { title: '', modelSelections: {} }
  const handleFieldChange = (field, value) => {
    onChange?.({ ...current, [field]: value })
  }
  const handleModelChange = (stageKey, value) => {
    const nextSelections = stageKey === 'projectDefault'
      ? modelSelectionsFromDefault(value)
      : {
          ...(current.modelSelections || {}),
          [stageKey]: value || null
        }
    onChange?.({
      ...current,
      modelSelections: nextSelections
    })
  }
  const canSubmit = !!current.title?.trim()
  const currentModels = normalizeModelSelections(current.modelSelections)
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl p-10">
        <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-[32px]">新建应用</h2>
            <p className="text-[24px] text-gray-500 mt-1">先登记应用标题，随后在 AI 研发助手中输入原始需求。</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-8 h-8" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-8">
          <label className="block">
            <span className="block text-[24px] font-bold text-gray-700 mb-2">应用标题</span>
            <input
              type="text"
              value={current.title || ''}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-6 py-4 text-[28px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：港口潮汐窗口计算器"
              autoFocus
            />
          </label>
          {modelOptions.length > 0 && (
            <label className="block">
              <span className="block text-[24px] font-bold text-gray-700 mb-2">项目默认模型</span>
              <select
                value={currentModels.requirements || ''}
                onChange={(event) => handleModelChange('projectDefault', event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-6 py-4 text-[24px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              >
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>{model.label}</option>
                ))}
              </select>
            </label>
          )}
          {error && (
            <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-[28px] text-red-700">
              <AlertCircle className="w-8 h-8 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-6">
            <button type="button" onClick={onClose} className="px-8 py-4 border border-gray-300 text-gray-600 rounded-lg text-[28px] hover:bg-gray-50">
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[28px] font-semibold flex items-center gap-4"
            >
              {submitting && <Loader2 className="w-8 h-8 animate-spin" />}
              创建应用
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function StageLogModal({ open, stage, log, loading, error, onClose }) {
  const [autoScroll, setAutoScroll] = useState(true)
  const logListRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setAutoScroll(true)
  }, [open, stage?.key, stage?.name])

  useEffect(() => {
    if (!autoScroll || !logListRef.current) return
    logListRef.current.scrollTop = logListRef.current.scrollHeight
  }, [autoScroll, log?.entries, log?.content, loading])

  if (!open) return null
  const title = log?.stageName || stage?.name || '阶段日志'
  const entries = Array.isArray(log?.entries) ? log.entries : []
  const content = log?.content || stage?.logSummary || ''
  const status = log?.status || stage?.status || '-'

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl max-h-[82vh] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-10 py-8 gap-8">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-800 text-[32px] truncate">{title} · 日志详情</h2>
            <p className="text-[24px] text-gray-500 mt-1 truncate">{log?.logPath || '运行态摘要'} · {status}</p>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <label className="flex items-center gap-3 text-[24px] font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(event) => setAutoScroll(event.target.checked)}
                className="h-7 w-7 rounded border-gray-300 text-blue-600 accent-blue-600"
              />
              自动滚动
            </label>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700">
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        <div className="p-10 overflow-hidden min-h-0">
          {loading ? (
            <div className="flex items-center gap-4 text-[28px] text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              正在读取日志...
            </div>
          ) : error ? (
            <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-[28px] text-red-700">
              <AlertCircle className="w-8 h-8 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : entries.length > 0 ? (
            <div
              ref={logListRef}
              onScroll={(event) => {
                const target = event.currentTarget
                const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight
                if (distanceFromBottom > 80) setAutoScroll(false)
              }}
              className="max-h-[58vh] min-h-72 overflow-auto rounded-lg bg-slate-950 border border-slate-800 p-6 space-y-3"
            >
              {entries.map((entry) => (
                <div
                  key={entry.id || `${entry.timestamp}-${entry.text}`}
                  className={`grid grid-cols-[88px_64px_76px_minmax(0,1fr)] gap-4 rounded px-4 py-3 text-[24px] leading-relaxed ${
                    entry.level === 'ERROR'
                      ? 'bg-red-950/80 text-red-100 border border-red-800/70'
                      : entry.level === 'WARN'
                        ? 'bg-amber-950/40 text-amber-100 border border-amber-900/40'
                        : 'text-slate-200'
                  }`}
                >
                  <span className="font-mono text-white">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</span>
                  <span className={`font-bold ${entry.level === 'ERROR' ? 'text-red-300' : entry.level === 'WARN' ? 'text-amber-300' : 'text-emerald-300'}`}>{entry.level || 'INFO'}</span>
                  <span className="font-mono text-white truncate">{entry.source || 'system'}</span>
                  <span className="whitespace-pre-wrap break-words">{entry.text}</span>
                </div>
              ))}
            </div>
          ) : content ? (
            <pre className="max-h-[58vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-8 text-[24px] leading-relaxed text-slate-100 border border-slate-800 min-h-72">
              {content}
            </pre>
          ) : (
            <div className="min-h-72 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center text-[28px] text-gray-500">
              <FileText className="w-12 h-12 text-gray-350 mb-2" />
              <span className="font-semibold text-gray-600">暂无实时日志</span>
              <span className="text-[24px] mt-1">阶段开始后会自动追加日志条目。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({ sidebarOpen, setSidebarOpen, newWorkOrderRequest = 0 }) {
  const [runtimeOrders, setRuntimeOrders] = useState([])
  const [registeredApps, setRegisteredApps] = useState([])
  const [modelOptions, setModelOptions] = useState([])
  const [agentOptions, setAgentOptions] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [activeAppView, setActiveAppView] = useState(null)
  const [apiError, setApiError] = useState('')
  const [chatError, setChatError] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [developmentStarting, setDevelopmentStarting] = useState(false)
  const [developmentError, setDevelopmentError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [draftModelSelections, setDraftModelSelections] = useState({})
  const [draftAgentSelections, setDraftAgentSelections] = useState(getDefaultAgentSelections())
  const [createForm, setCreateForm] = useState({ title: '', description: '', modelSelections: {}, agentSelections: getDefaultAgentSelections() })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [stageSkipInFlight, setStageSkipInFlight] = useState(null)
  const [stageLogModal, setStageLogModal] = useState({
    open: false,
    stage: null,
    log: null,
    loading: false,
    error: ''
  })
  const lastCreateRequestRef = useRef(newWorkOrderRequest)
  const seenEventSequencesRef = useRef(new globalThis.Map())
  const [deliverablesModalOpen, setDeliverablesModalOpen] = useState(false)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedStageKey, setSelectedStageKey] = useState('all')
  const runtimeOrderList = useMemo(() => runtimeOrders.map(normalizeRuntimeOrder), [runtimeOrders])
  const builtinOrderList = useMemo(() => mergeRegisteredApps(registeredApps).map(normalizeMockOrder), [registeredApps])
  const orders = useMemo(() => [...runtimeOrderList, ...builtinOrderList], [runtimeOrderList, builtinOrderList])
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0]
  const effectiveModelSelections = useMemo(() => {
    if (!selectedOrder) return fillMissingModelSelections(draftModelSelections, modelOptions)
    return fillMissingModelSelections(selectedOrder.modelSelections || draftModelSelections, modelOptions)
  }, [selectedOrder, draftModelSelections, modelOptions])
  const effectiveAgentSelections = useMemo(() => {
    if (!selectedOrder) return fillMissingAgentSelections(draftAgentSelections)
    return fillMissingAgentSelections(selectedOrder.agentSelections || draftAgentSelections)
  }, [selectedOrder, draftAgentSelections])
  const deliverables = useMemo(() => getDeliverables(selectedOrder), [selectedOrder])
  const { reqDocs, userDocs, sourceCode, installPacks, urls } = deliverables
  const devProgress = useMemo(() => {
    if (!selectedOrder) return 0
    const devStages = selectedOrder.stages.filter(s => s.id >= 2 && s.id <= 5)
    if (devStages.length === 0) return 0
    const completedDevCount = devStages.filter(s => {
      const status = normalizeStageStatus(s.status)
      return status === 'completed' || status === 'skipped'
    }).length
    return Math.round((completedDevCount / devStages.length) * 100)
  }, [selectedOrder])
  const completedCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'completed').length
  const skippedCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'skipped').length
  const activeCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'active').length
  const pendingCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'pending').length
  const failedCount = selectedOrder.stages.filter(s => normalizeStageStatus(s.status) === 'failed').length
  const canVisitSelected = !isRuntimeOrder(selectedOrder) || Boolean(selectedOrder.deploymentUrl)
  const deliverableDocCount = reqDocs.length + userDocs.length
  const deliverableBuildCount = sourceCode.length + installPacks.length
  const deliverableUrlCount = urls.length

  useEffect(() => {
    return () => {
      if (setSidebarOpen) {
        setSidebarOpen(true)
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
    let cancelled = false
    listApps()
      .then((apps) => {
        if (!cancelled) setRegisteredApps(apps)
      })
      .catch((error) => {
        if (!cancelled) setApiError(error.message || '应用注册表加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listOpencodeModels()
      .then((models) => {
        if (cancelled) return
        const options = normalizeModelOptions(models)
        setModelOptions(options)
        setDraftModelSelections(prev => fillMissingModelSelections(prev, options))
        setCreateForm(prev => ({
          ...prev,
          modelSelections: fillMissingModelSelections(prev.modelSelections, options)
        }))
      })
      .catch((error) => {
        if (!cancelled) setApiError(error.message || 'opencode 模型列表加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listOpencodeAgents()
      .then((agents) => {
        if (cancelled) return
        const options = normalizeAgentOptions(agents)
        setAgentOptions(options)
        setDraftAgentSelections(prev => fillMissingAgentSelections(prev))
        setCreateForm(prev => ({
          ...prev,
          agentSelections: fillMissingAgentSelections(prev.agentSelections)
        }))
      })
      .catch((error) => {
        if (!cancelled) setApiError(error.message || 'opencode Agent 列表加载失败')
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
    setSelectedStageKey('all')
  }, [selectedOrderId])

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
        const sequence = Number(event.sequence)
        if (Number.isFinite(sequence)) {
          const seenForOrder = seenEventSequencesRef.current.get(event.workOrderId) || new Set()
          if (seenForOrder.has(sequence)) return
          seenForOrder.add(sequence)
          seenEventSequencesRef.current.set(event.workOrderId, seenForOrder)
        }

        const updatedOrder = event.workOrder || event.data?.workOrder
        if (updatedOrder) {
          setRuntimeOrders(prev => upsertRuntimeOrder(prev, updatedOrder))
          setApiError('')
        } else if (event.workOrderId) {
          setRuntimeOrders(prev => prev.map(order => applyGranularEventToOrder(order, event)))
        }

        if (event.type === 'stage.log.append' && event.entry) {
          setStageLogModal(prev => {
            if (!prev.open || prev.stage?.key !== event.stageId) return prev
            const currentLog = prev.log || {
              workOrderId: event.workOrderId,
              stageKey: event.stageId,
              stageName: prev.stage?.name || event.stageId,
              status: prev.stage?.status || '-',
              entries: [],
              content: ''
            }
            const entries = Array.isArray(currentLog.entries) ? currentLog.entries : []
            if (entries.some(entry => entry.id === event.entry.id)) return prev
            return {
              ...prev,
              log: {
                ...currentLog,
                entries: [...entries, event.entry]
              },
              loading: false,
              error: ''
            }
          })
        }

        if (event.type === 'stage.status.changed') {
          setStageLogModal(prev => {
            if (!prev.open || prev.stage?.key !== event.stageId) return prev
            return {
              ...prev,
              stage: event.stage || prev.stage,
              log: prev.log ? { ...prev.log, status: event.status || prev.log.status } : prev.log
            }
          })
        }
      },
      onError: () => {
        setApiError('实时连接中断，页面仍会保留最近一次状态。')
      }
    })
  }, [selectedOrder?.id])

  const handleGoToApp = (order) => {
    if (isRuntimeOrder(order)) {
      const appAccessUrl = toAppAccessUrl(order.deploymentUrl)
      if (appAccessUrl) {
        window.open(appAccessUrl, '_blank', 'noopener,noreferrer')
      }
      return
    }
    setActiveAppView(order.id)
  }

  const handleCreateSubmit = async (event) => {
    event.preventDefault()
    const title = createForm.title.trim()
    if (!title || creating) return
    setCreating(true)
    setCreateError('')
    try {
      const created = await createWorkOrder({
        title,
        description: '',
        deferClarification: true,
        modelSelections: normalizeModelSelections(createForm.modelSelections),
        agentSelections: normalizeAgentSelections(createForm.agentSelections)
      })
      setRuntimeOrders(prev => [created, ...prev.filter(order => order.id !== created.id)])
      setSelectedOrderId(created.id)
      setCreateForm({
        title: '',
        description: '',
        modelSelections: fillMissingModelSelections({}, modelOptions),
        agentSelections: getDefaultAgentSelections()
      })
      setCreateModalOpen(false)
      setApiError('')
      setSidebarOpen?.(false)
      setIsChatOpen(true)
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
        : await createWorkOrder({
          appId: order.appId || null,
          title: order.title,
          message: `${order.title}\n\n${message}`,
          modelSelections: normalizeModelSelections(draftModelSelections),
          agentSelections: normalizeAgentSelections(draftAgentSelections)
        })
      setRuntimeOrders(prev => [updated, ...prev.filter(item => item.id !== updated.id)])
      setSelectedOrderId(updated.id)
      setApiError('')
      setDevelopmentError('')
      try {
        const snapshot = await fetchWorkOrder(updated.id)
        setRuntimeOrders(prev => [snapshot, ...prev.filter(item => item.id !== snapshot.id)])
      } catch (snapshotError) {
        setApiError(snapshotError.message || '工单快照刷新失败，实时事件会继续同步。')
      }
    } catch (error) {
      setChatError(error.message || '发送失败')
    } finally {
      setChatLoading(false)
    }
  }

  const handleStartDevelopment = async (order) => {
    if (!isRuntimeOrder(order)) return
    setDevelopmentStarting(true)
    setDevelopmentError('')
    try {
      const updated = await startDevelopmentRun(order.id, normalizeModelSelections(effectiveModelSelections), normalizeAgentSelections(effectiveAgentSelections))
      setRuntimeOrders(prev => [updated, ...prev.filter(item => item.id !== updated.id)])
      setSelectedOrderId(updated.id)
      setApiError('')
    } catch (error) {
      setDevelopmentError(error.message || '启动智能开发失败')
    } finally {
      setDevelopmentStarting(false)
    }
  }

  const handleModelSelectionChange = async (stageKey, modelId) => {
    const nextSelections = stageKey === 'projectDefault'
      ? modelSelectionsFromDefault(modelId)
      : {
          ...effectiveModelSelections,
          [stageKey]: modelId || null
        }
    if (isRuntimeOrder(selectedOrder) && ['CLARIFYING', 'READY_FOR_DEVELOPMENT'].includes(selectedOrder.status)) {
      try {
        const updated = await updateWorkOrderModelSelections(selectedOrder.id, nextSelections)
        setRuntimeOrders(prev => [updated, ...prev.filter(item => item.id !== updated.id)])
        setApiError('')
      } catch (error) {
        setApiError(error.message || '保存模型配置失败')
      }
      return
    }
    setDraftModelSelections(nextSelections)
    setCreateForm(prev => ({
      ...prev,
      modelSelections: nextSelections
    }))
  }

  const handleAgentSelectionChange = async (stageKey, agentId) => {
    const nextSelections = {
      ...effectiveAgentSelections,
      [stageKey]: agentId || DEFAULT_OPENCODE_AGENT
    }
    if (isRuntimeOrder(selectedOrder) && ['CLARIFYING', 'READY_FOR_DEVELOPMENT'].includes(selectedOrder.status)) {
      try {
        const updated = await updateWorkOrderAgentSelections(selectedOrder.id, nextSelections)
        setRuntimeOrders(prev => [updated, ...prev.filter(item => item.id !== updated.id)])
        setApiError('')
      } catch (error) {
        setApiError(error.message || '保存 Agent 配置失败')
      }
      return
    }
    setDraftAgentSelections(nextSelections)
    setCreateForm(prev => ({
      ...prev,
      agentSelections: nextSelections
    }))
  }

  const handleSkipStage = async (stage) => {
    if (!isRuntimeOrder(selectedOrder) || !stage?.key) return
    const requestKey = `${selectedOrder.id}:${stage.key}`
    setStageSkipInFlight(requestKey)
    setApiError('')
    try {
      const updated = await skipWorkOrderStage(selectedOrder.id, stage.key)
      setRuntimeOrders(prev => [updated, ...prev.filter(item => item.id !== updated.id)])
      setSelectedOrderId(updated.id)
    } catch (error) {
      setApiError(error.message || '跳过阶段失败')
    } finally {
      setStageSkipInFlight(null)
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

  const canConfigureAgentForStage = (stage) => {
    if (!stage?.key) return false
    if (!isRuntimeOrder(selectedOrder)) return true
    if (stage.key === 'requirements') {
      return selectedOrder.status === 'CLARIFYING' && selectedOrder.awaitingOriginalRequirement === true
    }
    return selectedOrder.status === 'READY_FOR_DEVELOPMENT' && normalizeStageStatus(stage.status) === 'pending'
  }

  if (activeAppView !== null) {
    return (
      <AppSimulator appId={activeAppView} onClose={() => setActiveAppView(null)} />
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-start justify-center text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-[48px] font-bold text-gray-800 title-gradient">智能软件工厂</h1>
            <span className="flex items-center text-[20px] px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-semibold tracking-wider uppercase">
              Live
            </span>
          </div>
          <p className="text-gray-400 text-[24px] mt-0.5 flex items-center justify-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>软件系统生产全链路可视化</span>
          </p>
        </div>
        <button
          onClick={() => {
            setCreateModalOpen(true)
            setCreateError('')
          }}
          className="absolute right-0 top-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[24px] font-semibold flex items-center gap-3"
        >
          <Package className="w-5 h-5" />
          新建项目
        </button>
      </div>

      {apiError && (
        <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-[28px] text-amber-800">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="flex min-h-0" style={{ height: 'calc(100vh - 112px)' }}>
        <div className="w-56 flex-shrink-0 space-y-3 mr-4 min-h-0">
          <h2 className="font-semibold text-gray-700 text-[24px] px-2">应用列表 ({orders.length})</h2>
          <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 156px)' }}>
            {orders.map(order => (
              <WorkOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          {/* Kanban Board Container (Top) */}
          <div className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col min-h-0 transition-all duration-300 ${
            isChatOpen ? 'basis-[48%] min-h-[300px] flex-shrink-0' : 'flex-1'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-6 flex-wrap">
                  <h2 className="font-bold text-gray-800 text-[32px]">{selectedOrder.title}</h2>
                  <button
                    onClick={() => handleGoToApp(selectedOrder)}
                    disabled={!canVisitSelected}
                    className="flex items-center gap-2 px-5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md text-[22px] font-semibold shadow-sm transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105"
                  >
                    <Globe className="w-6 h-6" />
                    {isRuntimeOrder(selectedOrder) && !selectedOrder.deploymentUrl ? '等待部署' : '访问部署应用'}
                  </button>
                  {!isChatOpen && (
                    <button
                      onClick={() => {
                        setIsChatOpen(true)
                        setSidebarOpen?.(false)
                      }}
                      className="flex items-center gap-3 px-5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md text-[22px] font-semibold shadow-sm transition-all hover:scale-105"
                    >
                      <MessageSquare className="w-6 h-6" />
                      AI 研发助手
                    </button>
                  )}
                </div>
                <p className="text-[22px] text-gray-500 mt-0.5">{selectedOrder.domain} · {selectedOrder.creator} · {selectedOrder.lastUpdate}</p>
              </div>
              <div className="flex items-center gap-2 text-[22px] flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">{completedCount} 完成</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded">
                  <Ban className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-600">{skippedCount} 跳过</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">{activeCount} 进行中</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                  <Lock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">{pendingCount} 等待</span>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{failedCount} 失败</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_280px] gap-4 min-h-full">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-col min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></span>
                      <span className="font-bold text-[22px] text-slate-700 truncate">阶段流转</span>
                    </div>
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className="flex-1 h-2.5 bg-blue-100 rounded-full overflow-hidden relative shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${devProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[20px] font-bold text-blue-600 font-mono flex-shrink-0">
                        {devProgress}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3 flex-1 items-stretch min-h-[224px]">
                    {selectedOrder.stages.slice(0, 5).map((stage) => (
                      <StageCard
                        key={stage.id}
                        stage={stage}
                        onShowLogs={handleShowStageLogs}
                        isSelected={selectedStageKey === stage.key}
                        onSelect={(s) => setSelectedStageKey(s.key)}
                        onSkipStage={isRuntimeOrder(selectedOrder) ? handleSkipStage : null}
                        skipLoading={stageSkipInFlight === `${selectedOrder.id}:${stage.key}`}
                        modelOptions={modelOptions}
                        modelSelections={effectiveModelSelections}
                        modelLocked={isRuntimeOrder(selectedOrder) ? selectedOrder.status !== 'READY_FOR_DEVELOPMENT' : false}
                        onModelChange={handleModelSelectionChange}
                        agentOptions={agentOptions}
                        agentSelections={effectiveAgentSelections}
                        agentLocked={!canConfigureAgentForStage(stage)}
                        onAgentChange={handleAgentSelectionChange}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/20 p-3 flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[22px] text-emerald-800">成果物</span>
                  </div>

                  <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 flex flex-col min-h-[224px] overflow-hidden">
                    <div className="bg-emerald-100/70 px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                        <span className="font-bold text-[20px] text-emerald-800 truncate">交付汇总</span>
                      </div>
                      <span className={`text-[18px] font-bold px-2 py-0.5 rounded ${canVisitSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                        {canVisitSelected ? '部署就绪' : '等待中'}
                      </span>
                    </div>
                    <div className="flex-1 p-3 space-y-3">
                      <div className="flex items-center justify-between rounded-md bg-white/70 border border-emerald-100 px-3 py-2 text-[20px]">
                        <span className="text-gray-600 font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" />文档</span>
                        <span className="font-bold text-emerald-700 font-mono">{deliverableDocCount}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-white/70 border border-emerald-100 px-3 py-2 text-[20px]">
                        <span className="text-gray-600 font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-emerald-600" />制品</span>
                        <span className="font-bold text-emerald-700 font-mono">{deliverableBuildCount}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-white/70 border border-emerald-100 px-3 py-2 text-[20px]">
                        <span className="text-gray-600 font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-600" />访问地址</span>
                        <span className="font-bold text-emerald-700 font-mono">{deliverableUrlCount}</span>
                      </div>
                    </div>
                    <div className="px-3 py-2 border-t border-emerald-100/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeliverablesModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-[18px] font-bold text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </button>
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
              onStartDevelopment={handleStartDevelopment}
              onClose={() => {
                setIsChatOpen(false)
                setSidebarOpen?.(true)
              }}
              loading={chatLoading}
              error={developmentError || chatError}
              startingDevelopment={developmentStarting}
              selectedStageKey={selectedStageKey}
              onSelectStage={setSelectedStageKey}
              stages={selectedOrder.stages}
              requirementsItems={selectedOrder.requirementsItems || null}
              modelOptions={modelOptions}
              modelSelections={effectiveModelSelections}
              onModelChange={handleModelSelectionChange}
            />
          </div>
        </div>
      </div>
      <CreateWorkOrderModal
        open={createModalOpen}
        form={createForm}
        onChange={setCreateForm}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        submitting={creating}
        error={createError}
        modelOptions={modelOptions}
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
        order={selectedOrder}
        onClose={() => {
          setDeliverablesModalOpen(false)
        }}
      />
    </div>
  )
}

export function DeliverablesModal({ open, order, onClose }) {
  const [selectedItem, setSelectedItem] = useState(null)
  useEffect(() => {
    if (!open) setSelectedItem(null)
  }, [open, order?.id])
  if (!open) return null
  const { reqDocs, userDocs, sourceCode, installPacks, urls } = getDeliverables(order)
  const sections = [
    {
      key: 'docs',
      title: '文档',
      icon: FileText,
      accent: 'bg-blue-500',
      items: [
        ...reqDocs.map((item) => ({ ...item, category: '需求/设计文档', detailType: 'document' })),
        ...userDocs.map((item) => ({ ...item, category: '用户文档', detailType: 'document' }))
      ]
    },
    {
      key: 'builds',
      title: '制品',
      icon: Package,
      accent: 'bg-amber-500',
      items: [
        ...sourceCode.map((item) => ({ ...item, category: '源码地址', detailType: 'build' })),
        ...installPacks.map((item) => ({ ...item, category: '安装包', detailType: 'build' }))
      ]
    },
    {
      key: 'urls',
      title: '访问地址',
      icon: Globe,
      accent: 'bg-emerald-500',
      items: urls.map((item) => ({ ...item, category: '访问地址', detailType: 'url' }))
    }
  ]

  const renderSummaryItem = (item, index) => (
    <div key={`${item.detailType}-${index}`} className="flex items-center justify-between gap-5 rounded-lg border border-slate-700/60 bg-[#243340]/90 p-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[22px] font-bold text-white">{item.label || item.value}</p>
        <p className="mt-1 truncate text-[18px] text-slate-400">{item.category} · 来源阶段: {item.stageName || '工单状态'}</p>
      </div>
      <button
        type="button"
        onClick={() => setSelectedItem(item)}
        className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-[20px] font-bold text-white hover:bg-blue-500"
      >
        <Eye className="w-5 h-5" />
        查看详情
      </button>
    </div>
  )

  const renderDetailPanel = () => {
    if (!selectedItem) return null
    const value = selectedItem.value || selectedItem.url || selectedItem.label || '-'
    const isUrl = selectedItem.detailType === 'url'
    const isGit = String(value).startsWith('git@')
    const isPack = selectedItem.isInstallPack || selectedItem.isFile
    return (
      <div className="rounded-xl border border-blue-500/30 bg-slate-950/35 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[20px] font-bold text-blue-300">详细内容</p>
            <h3 className="mt-1 break-words text-[26px] font-bold text-white">{selectedItem.label || value}</h3>
            <p className="mt-2 text-[20px] text-slate-300">类型：{selectedItem.category}</p>
            <p className="mt-1 text-[20px] text-slate-300">来源阶段：{selectedItem.stageName || '工单状态'}</p>
            <p className="mt-3 break-all rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-[19px] text-slate-100">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="rounded-lg border border-slate-600 px-4 py-2 text-[18px] font-bold text-slate-300 hover:bg-slate-800"
          >
            返回列表
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {isUrl && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-[20px] font-bold text-white hover:bg-emerald-500"
            >
              <Globe className="w-5 h-5" />
              访问应用
            </a>
          )}
          {(isUrl || isGit) && (
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(value)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-[20px] font-bold text-white hover:bg-indigo-500"
            >
              <ClipboardCheck className="w-5 h-5" />
              复制地址
            </button>
          )}
          {isPack && (
            <a
              href={value}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-[20px] font-bold text-white hover:bg-amber-500"
            >
              <Download className="w-5 h-5" />
              下载
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#1B2732] border border-slate-700/50 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-700/50 px-10 py-8 bg-slate-800/40">
          <h2 className="font-bold text-[#ffffff] text-[28px]">成果物详情</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-700/50 rounded-lg text-gray-400 hover:text-[#ffffff] transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>
        
        <div className="p-10 max-h-[68vh] overflow-y-auto space-y-8">
          {sections.map((section) => {
            const SectionIcon = section.icon
            return (
              <section key={section.key}>
                <h3 className="text-[24px] font-bold text-slate-300 mb-3 flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${section.accent}`}></span>
                  <SectionIcon className="w-6 h-6 text-slate-300" />
                  {section.title} ({section.items.length})
                </h3>
                <div className="space-y-4">
                  {section.items.length === 0 ? (
                    <p className="text-[22px] text-slate-400 italic py-2 pl-6">暂无{section.title}</p>
                  ) : (
                    section.items.map((item, idx) => renderSummaryItem(item, idx))
                  )}
                </div>
              </section>
            )
          })}
          {renderDetailPanel()}
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
