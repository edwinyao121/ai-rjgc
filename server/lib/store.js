import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createPipelineStages, WORK_ORDER_STATUS } from './stages.js'

const WORK_ORDER_ID_PATTERN = /^WO-\d{8}-\d{3}$/

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
      messages: [
        {
          id: randomUUID(),
          sender: 'user',
          text: String(message || '').trim(),
          createdAt: now.toISOString()
        },
        {
          id: randomUUID(),
          sender: 'ai',
          text: '已创建工单，正在进行需求澄清。',
          createdAt: now.toISOString()
        }
      ],
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
      return JSON.parse(raw)
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
    await fs.mkdir(this.getWorkOrderDir(workOrderId), { recursive: true })
    await fs.appendFile(this.getEventsPath(workOrderId), `${JSON.stringify(event)}\n`, 'utf8')
  }

  async readEvents(workOrderId) {
    assertWorkOrderId(workOrderId)
    try {
      const raw = await fs.readFile(this.getEventsPath(workOrderId), 'utf8')
      return raw
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
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
}
