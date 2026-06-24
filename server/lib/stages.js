export const STAGE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
})

export const WORK_ORDER_STATUS = Object.freeze({
  CLARIFYING: 'CLARIFYING',
  READY_FOR_DEVELOPMENT: 'READY_FOR_DEVELOPMENT',
  RUNNING: 'RUNNING',
  DEPLOYED: 'DEPLOYED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
})

export const PIPELINE_STAGES = Object.freeze([
  {
    id: 1,
    key: 'requirements',
    name: '需求待入厂',
    estimatedDurationMs: 5 * 60 * 1000,
    gate: { entry: null, exit: '需求校验' },
    pendingLabel: '等待需求澄清'
  },
  {
    id: 2,
    key: 'design',
    name: '系统设计',
    estimatedDurationMs: 25 * 60 * 1000,
    gate: { entry: '需求通过', exit: '设计完备' },
    pendingLabel: '等待需求文档'
  },
  {
    id: 3,
    key: 'coding',
    name: '智能编码',
    estimatedDurationMs: 45 * 60 * 1000,
    gate: { entry: '设计完备', exit: '编译通过' },
    pendingLabel: '等待设计完成'
  },
  {
    id: 4,
    key: 'testing',
    name: '测试质检',
    estimatedDurationMs: 30 * 60 * 1000,
    gate: { entry: '编译通过', exit: '质检通过' },
    pendingLabel: '等待代码生成'
  },
  {
    id: 5,
    key: 'deployment',
    name: '部署交付',
    estimatedDurationMs: 15 * 60 * 1000,
    gate: { entry: '质检通过', exit: '部署成功' },
    pendingLabel: '等待测试通过'
  }
])

const STAGE_ESTIMATE_BY_KEY = PIPELINE_STAGES.reduce((acc, stage) => {
  acc[stage.key] = stage.estimatedDurationMs
  return acc
}, {})

export function createPipelineStages(now = new Date()) {
  return PIPELINE_STAGES.map((stage, index) => ({
    id: stage.id,
    key: stage.key,
    name: stage.name,
    status: index === 0 ? STAGE_STATUS.RUNNING : STAGE_STATUS.PENDING,
    startedAt: index === 0 ? now.toISOString() : null,
    completedAt: null,
    failedAt: null,
    duration: index === 0 ? '进行中' : '-',
    estimatedDurationMs: stage.estimatedDurationMs,
    estimatedDuration: formatDurationMs(stage.estimatedDurationMs),
    estimatedRemainingMs: index === 0 ? stage.estimatedDurationMs : null,
    estimatedRemaining: index === 0 ? formatDurationMs(stage.estimatedDurationMs) : '-',
    estimatedCompletedAt: index === 0 ? new Date(now.getTime() + stage.estimatedDurationMs).toISOString() : null,
    actualDurationMs: null,
    actualDuration: null,
    gate: stage.gate,
    items: [
      {
        type: index === 0 ? 'ai' : 'pending',
        label: index === 0 ? '需求澄清' : stage.pendingLabel,
        value: index === 0 ? '等待 AI 澄清结果' : '-'
      }
    ],
    outputs: [],
    reviews: [],
    logSummary: '',
    logPath: null
  }))
}

export function getStageByKey(stages, key) {
  return stages.find((stage) => stage.key === key)
}

export function getStageProgress(stages) {
  if (!Array.isArray(stages) || stages.length === 0) return 0
  const completed = stages.filter((stage) => stage.status === STAGE_STATUS.COMPLETED).length
  const running = stages.some((stage) => stage.status === STAGE_STATUS.RUNNING) ? 0.5 : 0
  return Math.min(100, Math.round(((completed + running) / stages.length) * 100))
}

export function markStageRunning(stage, now = new Date(), item) {
  stage.status = STAGE_STATUS.RUNNING
  stage.startedAt = stage.startedAt || now.toISOString()
  stage.completedAt = null
  stage.failedAt = null
  stage.duration = '进行中'
  applyRunningTiming(stage, now)
  stage.logSummary = ''
  stage.logPath = null
  stage.reviews = []
  if (item) {
    stage.items = [item]
  }
}

export function markStageCompleted(stage, now = new Date(), item, outputs = []) {
  stage.status = STAGE_STATUS.COMPLETED
  stage.completedAt = now.toISOString()
  stage.failedAt = null
  applyFinishedTiming(stage, now)
  if (item) {
    stage.items = [item]
  }
  if (outputs.length > 0) {
    stage.outputs = outputs
  }
}

export function markStageFailed(stage, errorMessage, logSummary, now = new Date(), logPath = null) {
  stage.status = STAGE_STATUS.FAILED
  stage.failedAt = now.toISOString()
  applyFinishedTiming(stage, now)
  stage.logSummary = logSummary || errorMessage
  if (logPath) {
    stage.logPath = logPath
  }
  stage.items = [
    {
      type: 'error',
      label: '执行失败',
      value: errorMessage
    }
  ]
  stage.reviews = [
    {
      type: '系统',
      label: '失败诊断',
      status: 'failed',
      issues: logSummary || errorMessage
    }
  ]
}

export function refreshStageTiming(stage, now = new Date()) {
  if (!stage) return stage
  ensureStageEstimate(stage)
  if (stage.status === STAGE_STATUS.RUNNING) {
    applyRunningTiming(stage, now)
  } else if ((stage.status === STAGE_STATUS.COMPLETED || stage.status === STAGE_STATUS.FAILED) && !stage.actualDuration && stage.startedAt) {
    const finishedAt = stage.completedAt || stage.failedAt || now.toISOString()
    applyFinishedTiming(stage, new Date(finishedAt))
  }
  return stage
}

export function formatDurationMs(ms) {
  const safeMs = Math.max(0, Number(ms) || 0)
  const totalSeconds = Math.ceil(safeMs / 1000)
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const totalMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (totalMinutes < 60) {
    return seconds > 0 ? `${totalMinutes}分${seconds}秒` : `${totalMinutes}分钟`
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
}

function ensureStageEstimate(stage) {
  const estimateMs = Number(stage.estimatedDurationMs || STAGE_ESTIMATE_BY_KEY[stage.key] || 0)
  if (!stage.estimatedDurationMs && estimateMs > 0) {
    stage.estimatedDurationMs = estimateMs
  }
  if (!stage.estimatedDuration && estimateMs > 0) {
    stage.estimatedDuration = formatDurationMs(estimateMs)
  }
  return estimateMs
}

function applyRunningTiming(stage, now) {
  const estimateMs = ensureStageEstimate(stage)
  if (!stage.startedAt || estimateMs <= 0) {
    stage.estimatedRemainingMs = null
    stage.estimatedRemaining = '-'
    stage.estimatedCompletedAt = null
    return
  }
  const startedAtMs = new Date(stage.startedAt).getTime()
  const nowMs = now.getTime()
  const remainingMs = Math.max(0, startedAtMs + estimateMs - nowMs)
  stage.estimatedRemainingMs = remainingMs
  stage.estimatedRemaining = formatDurationMs(remainingMs)
  stage.estimatedCompletedAt = new Date(startedAtMs + estimateMs).toISOString()
}

function applyFinishedTiming(stage, now) {
  ensureStageEstimate(stage)
  const startedAtMs = stage.startedAt ? new Date(stage.startedAt).getTime() : Number.NaN
  const finishedAtMs = now.getTime()
  const actualMs = Number.isFinite(startedAtMs) ? Math.max(0, finishedAtMs - startedAtMs) : 0
  stage.actualDurationMs = actualMs
  stage.actualDuration = formatDurationMs(actualMs)
  stage.duration = stage.actualDuration
  stage.estimatedRemainingMs = 0
  stage.estimatedRemaining = '0秒'
}
