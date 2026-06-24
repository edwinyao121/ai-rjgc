import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createPipelineStages, WORK_ORDER_STATUS } from './stages.js'

const WORK_ORDER_ID_PATTERN = /^WO-\d{8}-\d{3}$/
const STAGE_KEY_PATTERN = /^[a-z]+$/

export function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function assertWorkOrderId(id) {
  if (!WORK_ORDER_ID_PATTERN.test(id)) {
    const error = new Error('Invalid work order id')
    error.code = 'INVALID_WORK_ORDER_ID'
    throw error
  }
}

export function assertStageKey(stageKey) {
  if (!STAGE_KEY_PATTERN.test(stageKey)) {
    const error = new Error('Invalid stage key')
    error.code = 'INVALID_STAGE_KEY'
    throw error
  }
}

export function inferTitle(message) {
  const trimmed = String(message || '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return '未命名应用'
  return trimmed.length > 24 ? `${trimmed.slice(0, 24)}...` : trimmed
}

export class WorkOrderStore {
  constructor({
    rootDir = path.resolve(process.cwd(), '.runtime/work-orders'),
    requirementsDir = path.resolve(process.cwd(), 'docs/requirements')
  } = {}) {
    this.rootDir = rootDir
    this.requirementsDir = requirementsDir
    this.eventQueues = new Map()
    this.eventSequences = new Map()
    this.stageLogQueues = new Map()
    this.stageLogSequences = new Map()
  }

  async init() {
    await fs.mkdir(this.rootDir, { recursive: true })
    await fs.mkdir(this.requirementsDir, { recursive: true })
  }

  getWorkOrderDir(id) {
    assertWorkOrderId(id)
    return path.join(this.rootDir, id)
  }

  getStatePath(id) {
    return path.join(this.getWorkOrderDir(id), 'state.json')
  }

  getEventsPath(id) {
    return path.join(this.getWorkOrderDir(id), 'events.jsonl')
  }

  getMessagesPath(id) {
    return path.join(this.getWorkOrderDir(id), 'messages.json')
  }

  getStageLogsDir(id) {
    return path.join(this.getWorkOrderDir(id), 'logs')
  }

  getStageLogPath(id, stageKey) {
    assertStageKey(stageKey)
    return path.join(this.getStageLogsDir(id), `${stageKey}.jsonl`)
  }

  getAppDir(id) {
    return path.join(this.getWorkOrderDir(id), 'app')
  }

  async allocateId(date = new Date()) {
    await this.init()
    const prefix = `WO-${toDateKey(date)}-`
    const entries = await fs.readdir(this.rootDir, { withFileTypes: true }).catch(() => [])
    const maxSequence = entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
      .map((entry) => Number(entry.name.slice(prefix.length)))
      .filter((value) => Number.isInteger(value))
      .reduce((max, value) => Math.max(max, value), 0)
    return `${prefix}${String(maxSequence + 1).padStart(3, '0')}`
  }

  async createWorkOrder({ message, now = new Date() }) {
    const id = await this.allocateId(now)
    const workOrderDir = this.getWorkOrderDir(id)
    const appDir = this.getAppDir(id)
    await fs.mkdir(appDir, { recursive: true })

    const messages = [
      createMessage({
        role: 'user',
        content: String(message || '').trim(),
        createdAt: now.toISOString(),
        phase: 'clarification'
      }),
      createMessage({
        role: 'assistant',
        content: '已创建工单，正在进行需求澄清。',
        createdAt: now.toISOString(),
        phase: 'clarification'
      })
    ]

    const state = {
      id,
      title: inferTitle(message),
      domain: 'AI生成',
      priority: 'medium',
      creator: 'AI研发助手',
      status: WORK_ORDER_STATUS.CLARIFYING,
      progress: 10,
      currentStage: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastUpdate: '刚刚',
      appDir,
      deploymentUrl: null,
      deploymentPort: null,
      requirementsPath: null,
      messages,
      stages: createPipelineStages(now)
    }

    await this.saveWorkOrder(state)
    return state
  }

  async saveWorkOrder(state) {
    const now = new Date()
    state.updatedAt = now.toISOString()
    state.lastUpdate = '刚刚'
    await fs.mkdir(this.getWorkOrderDir(state.id), { recursive: true })
    if (Array.isArray(state.messages)) {
      state.messages = state.messages.map((message) => normalizeMessage(message))
      await this.writeMessages(state.id, state.messages)
    }
    const statePath = this.getStatePath(state.id)
    const tempPath = `${statePath}.tmp`
    await fs.writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    await fs.rename(tempPath, statePath)
    return state
  }

  async readWorkOrder(id) {
    assertWorkOrderId(id)
    try {
      const raw = await fs.readFile(this.getStatePath(id), 'utf8')
      const state = JSON.parse(raw)
      const persistedMessages = await this.readMessages(id)
      if (persistedMessages) {
        state.messages = persistedMessages
      } else if (Array.isArray(state.messages)) {
        state.messages = state.messages.map((message) => normalizeMessage(message))
        await this.writeMessages(id, state.messages)
      } else {
        state.messages = []
        await this.writeMessages(id, state.messages)
      }
      return state
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
  }

  async listWorkOrders() {
    await this.init()
    const entries = await fs.readdir(this.rootDir, { withFileTypes: true }).catch(() => [])
    const states = []
    for (const entry of entries) {
      if (!entry.isDirectory() || !WORK_ORDER_ID_PATTERN.test(entry.name)) continue
      const state = await this.readWorkOrder(entry.name)
      if (state) states.push(state)
    }
    return states.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  async appendEvent(workOrderId, event) {
    assertWorkOrderId(workOrderId)
    return this.enqueueEvent(workOrderId, async () => {
      await fs.mkdir(this.getWorkOrderDir(workOrderId), { recursive: true })
      const currentSequence = await this.getLastEventSequence(workOrderId)
      const sequence = Number.isInteger(event.sequence) ? event.sequence : currentSequence + 1
      const savedEvent = {
        id: event.id || randomUUID(),
        sequence,
        workOrderId,
        timestamp: event.timestamp || new Date().toISOString(),
        ...event
      }
      this.eventSequences.set(workOrderId, Math.max(currentSequence, sequence))
      await fs.appendFile(this.getEventsPath(workOrderId), `${JSON.stringify(savedEvent)}\n`, 'utf8')
      return savedEvent
    })
  }

  async readEvents(workOrderId, { afterSequence = null } = {}) {
    assertWorkOrderId(workOrderId)
    try {
      const raw = await fs.readFile(this.getEventsPath(workOrderId), 'utf8')
      return raw
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((event) => afterSequence == null || Number(event.sequence || 0) > Number(afterSequence))
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
  }

  async writeRequirements(workOrderId, markdown) {
    assertWorkOrderId(workOrderId)
    await fs.mkdir(this.requirementsDir, { recursive: true })
    const requirementsPath = path.join(this.requirementsDir, `${workOrderId}-requirements.md`)
    await fs.writeFile(requirementsPath, `${markdown.trim()}\n`, 'utf8')
    return requirementsPath
  }

  async writeAppFile(workOrderId, fileName, content) {
    const appDir = this.getAppDir(workOrderId)
    await fs.mkdir(appDir, { recursive: true })
    const filePath = path.join(appDir, fileName)
    await fs.writeFile(filePath, content, 'utf8')
    return filePath
  }

  async readMessages(workOrderId) {
    assertWorkOrderId(workOrderId)
    try {
      const raw = await fs.readFile(this.getMessagesPath(workOrderId), 'utf8')
      return JSON.parse(raw).map((message) => normalizeMessage(message))
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
  }

  async writeMessages(workOrderId, messages) {
    assertWorkOrderId(workOrderId)
    await fs.mkdir(this.getWorkOrderDir(workOrderId), { recursive: true })
    const normalized = messages.map((message) => normalizeMessage(message))
    const messagesPath = this.getMessagesPath(workOrderId)
    const tempPath = `${messagesPath}.tmp`
    await fs.writeFile(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
    await fs.rename(tempPath, messagesPath)
    return normalized
  }

  async appendMessage(workOrderId, message) {
    const messages = (await this.readMessages(workOrderId)) || []
    const next = normalizeMessage(message)
    messages.push(next)
    await this.writeMessages(workOrderId, messages)
    return next
  }

  async appendMessageDelta(workOrderId, messageId, delta, status = null, metadataPatch = null) {
    assertWorkOrderId(workOrderId)
    const messages = (await this.readMessages(workOrderId)) || []
    const index = messages.findIndex((message) => message.id === messageId)
    if (index === -1) return null
    const current = normalizeMessage(messages[index])
    const nextContent = `${current.content ?? ''}${delta || ''}`
    const nextStatus = status || current.status || 'STREAMING'
    const nextMetadata = mergeMetadata(current.metadata, metadataPatch)
    const updated = {
      ...current,
      content: nextContent,
      text: nextContent,
      status: nextStatus,
      metadata: nextMetadata,
      updatedAt: new Date().toISOString()
    }
    messages[index] = updated
    await this.writeMessages(workOrderId, messages)
    return updated
  }

  async appendStageLogEntry(workOrderId, stageKey, entry) {
    assertWorkOrderId(workOrderId)
    assertStageKey(stageKey)
    const queueKey = `${workOrderId}:${stageKey}`
    return this.enqueueStageLog(queueKey, async () => {
      await fs.mkdir(this.getStageLogsDir(workOrderId), { recursive: true })
      const currentSequence = await this.getLastStageLogSequence(workOrderId, stageKey)
      const sequence = Number.isInteger(entry.sequence) ? entry.sequence : currentSequence + 1
      const savedEntry = {
        id: entry.id || randomUUID(),
        sequence,
        workOrderId,
        stageId: entry.stageId || stageKey,
        timestamp: entry.timestamp || new Date().toISOString(),
        level: entry.level || 'INFO',
        source: entry.source || 'system',
        text: String(entry.text || '')
      }
      this.stageLogSequences.set(queueKey, Math.max(currentSequence, sequence))
      await fs.appendFile(this.getStageLogPath(workOrderId, stageKey), `${JSON.stringify(savedEntry)}\n`, 'utf8')
      return savedEntry
    })
  }

  async readStageLogEntries(workOrderId, stageKey) {
    assertWorkOrderId(workOrderId)
    assertStageKey(stageKey)
    try {
      const raw = await fs.readFile(this.getStageLogPath(workOrderId, stageKey), 'utf8')
      return raw
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
  }

  async getLastEventSequence(workOrderId) {
    if (this.eventSequences.has(workOrderId)) {
      return this.eventSequences.get(workOrderId)
    }
    const events = await this.readEvents(workOrderId)
    const sequence = events.reduce((max, event) => Math.max(max, Number(event.sequence || 0)), 0)
    this.eventSequences.set(workOrderId, sequence)
    return sequence
  }

  async getLastStageLogSequence(workOrderId, stageKey) {
    const queueKey = `${workOrderId}:${stageKey}`
    if (this.stageLogSequences.has(queueKey)) {
      return this.stageLogSequences.get(queueKey)
    }
    const entries = await this.readStageLogEntries(workOrderId, stageKey)
    const sequence = entries.reduce((max, entry) => Math.max(max, Number(entry.sequence || 0)), 0)
    this.stageLogSequences.set(queueKey, sequence)
    return sequence
  }

  enqueueEvent(workOrderId, task) {
    const previous = this.eventQueues.get(workOrderId) || Promise.resolve()
    const next = previous.then(task, task)
    this.eventQueues.set(workOrderId, next.catch(() => {}))
    return next
  }

  enqueueStageLog(queueKey, task) {
    const previous = this.stageLogQueues.get(queueKey) || Promise.resolve()
    const next = previous.then(task, task)
    this.stageLogQueues.set(queueKey, next.catch(() => {}))
    return next
  }
}

export function createMessage({
  id = randomUUID(),
  role = 'assistant',
  sender = null,
  content = '',
  text = null,
  phase = 'execution',
  stageId = null,
  status = 'COMPLETED',
  kind = null,
  metadata = null,
  createdAt = new Date().toISOString(),
  updatedAt = createdAt
} = {}) {
  return normalizeMessage({
    id,
    role,
    sender,
    content,
    text,
    phase,
    stageId,
    status,
    kind,
    metadata,
    createdAt,
    updatedAt
  })
}

export function normalizeMessage(message = {}) {
  const role = message.role || senderToRole(message.sender)
  const content = String(message.content ?? message.text ?? '')
  const createdAt = message.createdAt || new Date().toISOString()
  const normalizedRole = ['user', 'assistant', 'system', 'tool'].includes(role) ? role : 'assistant'
  const kind = message.kind || null
  return {
    id: message.id || randomUUID(),
    role: normalizedRole,
    sender: roleToSender(normalizedRole),
    phase: message.phase || (message.stageId ? 'execution' : 'clarification'),
    stageId: message.stageId ?? null,
    content,
    text: content,
    status: message.status || 'COMPLETED',
    kind,
    metadata: kind === 'opencode-stream' ? normalizeMetadata(message.metadata) : null,
    createdAt,
    updatedAt: message.updatedAt || createdAt
  }
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const result = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'undefined') continue
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value
    } else {
      try {
        result[key] = JSON.parse(JSON.stringify(value))
      } catch {
        // Ignore non-serializable values.
      }
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

function mergeMetadata(current, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return current || null
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {}
  const merged = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === 'undefined') continue
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      merged[key] = value
    } else {
      try {
        merged[key] = JSON.parse(JSON.stringify(value))
      } catch {
        // Ignore non-serializable values.
      }
    }
  }
  return Object.keys(merged).length > 0 ? merged : null
}

function senderToRole(sender) {
  if (sender === 'ai') return 'assistant'
  if (sender === 'user') return 'user'
  if (sender === 'system') return 'system'
  if (sender === 'tool') return 'tool'
  return 'assistant'
}

function roleToSender(role) {
  if (role === 'assistant') return 'ai'
  return role
}
