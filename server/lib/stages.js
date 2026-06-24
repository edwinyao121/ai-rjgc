export const STAGE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
})

export const WORK_ORDER_STATUS = Object.freeze({
  CLARIFYING: 'CLARIFYING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
})

export const PIPELINE_STAGES = Object.freeze([
  {
    id: 1,
    key: 'requirements',
    name: '需求待入厂',
    gate: { entry: null, exit: '需求校验' },
    pendingLabel: '等待需求澄清'
  },
  {
    id: 2,
    key: 'design',
    name: '系统设计',
    gate: { entry: '需求通过', exit: '设计完备' },
    pendingLabel: '等待需求文档'
  },
  {
    id: 3,
    key: 'coding',
    name: '智能编码',
    gate: { entry: '设计完备', exit: '编译通过' },
    pendingLabel: '等待设计完成'
  },
  {
    id: 4,
    key: 'testing',
    name: '测试质检',
    gate: { entry: '编译通过', exit: '质检通过' },
    pendingLabel: '等待代码生成'
  },
  {
    id: 5,
    key: 'deployment',
    name: '部署交付',
    gate: { entry: '质检通过', exit: '部署成功' },
    pendingLabel: '等待测试通过'
  }
])

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
  stage.duration = '已完成'
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
  stage.duration = '失败'
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
