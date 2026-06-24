import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  STAGE_STATUS,
  WORK_ORDER_STATUS,
  getStageByKey,
  getStageProgress,
  markStageCompleted,
  markStageFailed,
  markStageRunning
} from './stages.js'
import { fallbackRequirementsMarkdown, buildOpencodeCommand, createClarificationPrompt, createStagePrompt, parseClarificationResponse } from './opencode.js'
import { MANIFEST_FILE, readManifest, substitutePortInCommand, substitutePortInUrl } from './manifest.js'
import { CommandRunner, findAvailablePort, summarizeCommandResult, waitForHealth } from './runner.js'

export class WorkOrderService {
  constructor({
    store,
    eventBus,
    runner = new CommandRunner(),
    autoStart = true,
    allocatePort = findAvailablePort,
    healthCheck = waitForHealth,
    logger = console
  }) {
    this.store = store
    this.eventBus = eventBus
    this.runner = runner
    this.autoStart = autoStart
    this.allocatePort = allocatePort
    this.healthCheck = healthCheck
    this.logger = logger
    this.runningApps = new Map()
    this.activeClarifications = new Set()
    this.activePipelines = new Set()
  }

  async init() {
    await this.store.init()
  }

  async listWorkOrders() {
    return this.store.listWorkOrders()
  }

  async getWorkOrder(id) {
    return this.store.readWorkOrder(id)
  }

  async getEvents(id) {
    return this.store.readEvents(id)
  }

  async getStageLog(id, stageKey) {
    const state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, stageKey)
    if (!stage) {
      const error = new Error('Stage not found')
      error.code = 'NOT_FOUND'
      throw error
    }

    let content = stage.logSummary || ''
    if (stage.logPath) {
      try {
        content = await fs.readFile(stage.logPath, 'utf8')
      } catch (error) {
        content = `${stage.logSummary || ''}\n\n[日志文件读取失败] ${error.message}`.trim()
      }
    }

    return {
      workOrderId: id,
      stageKey,
      stageName: stage.name,
      status: stage.status,
      logPath: stage.logPath || null,
      content
    }
  }

  async createWorkOrder({ message }, { startClarification = this.autoStart } = {}) {
    const trimmed = validateMessage(message)
    const state = await this.store.createWorkOrder({ message: trimmed })
    await this.emit(state.id, 'work-order.created', { workOrder: state })
    if (startClarification) {
      queueMicrotask(() => {
        this.processClarification(state.id).catch((error) => this.failFromUnexpectedError(state.id, 'requirements', error))
      })
    }
    return state
  }

  async appendUserMessage(id, { message }, { startClarification = this.autoStart } = {}) {
    const trimmed = validateMessage(message)
    const state = await this.requireWorkOrder(id)
    const now = new Date().toISOString()
    state.messages.push({
      id: randomUUID(),
      sender: 'user',
      text: trimmed,
      createdAt: now
    })
    state.status = WORK_ORDER_STATUS.CLARIFYING
    state.progress = Math.max(state.progress, 10)
    const requirementsStage = getStageByKey(state.stages, 'requirements')
    if (requirementsStage?.status !== STAGE_STATUS.COMPLETED) {
      markStageRunning(requirementsStage, new Date(), {
        type: 'ai',
        label: '需求澄清',
        value: '等待 AI 澄清结果'
      })
    }
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'message.created', { message: state.messages.at(-1), workOrder: state })
    if (startClarification) {
      queueMicrotask(() => {
        this.processClarification(id).catch((error) => this.failFromUnexpectedError(id, 'requirements', error))
      })
    }
    return state
  }

  async processClarification(id, { startPipeline = this.autoStart } = {}) {
    if (this.activeClarifications.has(id)) return this.requireWorkOrder(id)
    this.activeClarifications.add(id)
    try {
      let state = await this.requireWorkOrder(id)
      const requirementsStage = getStageByKey(state.stages, 'requirements')
      markStageRunning(requirementsStage, new Date(), {
        type: 'ai',
        label: '需求澄清',
        value: 'AI 正在分析需求完整性'
      })
      state.status = WORK_ORDER_STATUS.CLARIFYING
      state.progress = getStageProgress(state.stages)
      await this.store.saveWorkOrder(state)
      await this.emit(id, 'clarification.started', { workOrder: state })

      const prompt = createClarificationPrompt(state.messages)
      const result = await this.runner.run(buildOpencodeCommand(prompt, state.appDir), {
        cwd: state.appDir,
        timeoutMs: 5 * 60 * 1000
      })

      if (result.exitCode !== 0) {
        throw new Error(`需求澄清执行失败：${summarizeCommandResult(result) || `exit ${result.exitCode}`}`)
      }

      const rawOutput = `${result.stdout}\n${result.stderr}`
      await this.writeDebugOutput(id, 'clarification-output.jsonl', rawOutput)
      const clarification = parseClarificationResponse(rawOutput)
      state = await this.requireWorkOrder(id)
      const now = new Date().toISOString()
      state.messages.push({
        id: randomUUID(),
        sender: 'ai',
        text: clarification.reply || (clarification.complete ? '需求已澄清，开始进入自动研发流水线。' : '请补充更多需求信息。'),
        createdAt: now
      })

      if (clarification.title) {
        state.title = clarification.title
      }

      if (!clarification.complete) {
        markStageRunning(getStageByKey(state.stages, 'requirements'), new Date(), {
          type: 'ai',
          label: '需求澄清',
          value: clarification.reply || '等待用户补充需求'
        })
        state.progress = getStageProgress(state.stages)
        state.status = WORK_ORDER_STATUS.CLARIFYING
        await this.store.saveWorkOrder(state)
        await this.emit(id, 'clarification.completed', { complete: false, workOrder: state })
        return state
      }

      const requirementsMarkdown = clarification.requirementsMarkdown || fallbackRequirementsMarkdown({
        title: state.title,
        messages: state.messages
      })
      const requirementsPath = await this.store.writeRequirements(id, requirementsMarkdown)
      await this.store.writeAppFile(id, 'requirements.md', requirementsMarkdown)

      const stage = getStageByKey(state.stages, 'requirements')
      markStageCompleted(stage, new Date(), {
        type: 'ai',
        label: '需求规格说明书',
        value: '需求澄清完成，已生成可追溯需求文档'
      }, [
        {
          label: '《需求规格说明书》',
          status: 'done',
          path: requirementsPath
        }
      ])
      state.requirementsPath = requirementsPath
      state.requirementsMarkdown = requirementsMarkdown
      state.status = WORK_ORDER_STATUS.RUNNING
      state.currentStage = 2
      state.progress = getStageProgress(state.stages)
      await this.store.saveWorkOrder(state)
      await this.emit(id, 'clarification.completed', { complete: true, workOrder: state })

      if (startPipeline) {
        queueMicrotask(() => {
          this.runPipeline(id).catch((error) => this.failFromUnexpectedError(id, 'design', error))
        })
      }
      return state
    } finally {
      this.activeClarifications.delete(id)
    }
  }

  async runPipeline(id) {
    if (this.activePipelines.has(id)) return this.requireWorkOrder(id)
    this.activePipelines.add(id)
    try {
      await this.runOpencodePipelineStage(id, 'design')
      await this.runOpencodePipelineStage(id, 'coding')
      await this.ensureManifest(id)
      await this.runTestingStage(id)
      await this.runDeploymentStage(id)
      const state = await this.requireWorkOrder(id)
      state.status = WORK_ORDER_STATUS.COMPLETED
      state.progress = 100
      state.currentStage = 5
      await this.store.saveWorkOrder(state)
      await this.emit(id, 'pipeline.completed', { workOrder: state })
      return state
    } finally {
      this.activePipelines.delete(id)
    }
  }

  async runOpencodePipelineStage(id, stageKey) {
    let state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, stageKey)
    state.currentStage = stage.id
    markStageRunning(stage, new Date(), {
      type: 'ai',
      label: stage.name,
      value: 'opencode 正在执行该阶段'
    })
    state.status = WORK_ORDER_STATUS.RUNNING
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'stage.updated', { stage, workOrder: state })

    const prompt = createStagePrompt({
      stageKey,
      title: state.title,
      requirementsMarkdown: await this.getRequirementsMarkdown(state)
    })
    const command = buildOpencodeCommand(prompt, state.appDir)
    const result = await this.runner.run(command, {
      cwd: state.appDir,
      timeoutMs: 20 * 60 * 1000
    })
    const logPath = await this.writeStageLog(id, stageKey, formatCommandLog({
      label: stage.name,
      command,
      result
    }))
    if (result.exitCode !== 0) {
      await this.failStage(id, stageKey, `${stage.name}执行失败`, summarizeCommandResult(result), logPath)
      throw new Error(`${stage.name} failed`)
    }

    state = await this.requireWorkOrder(id)
    const completedStage = getStageByKey(state.stages, stageKey)
    markStageCompleted(completedStage, new Date(), {
      type: 'ai',
      label: completedStage.name,
      value: summarizeCommandResult(result) || '阶段执行完成'
    }, [
      {
        label: stageKey === 'design' ? '《系统设计说明书》' : '阶段产物',
        status: 'done'
      }
    ])
    completedStage.logPath = logPath
    completedStage.logSummary = summarizeCommandResult(result) || '阶段执行完成'
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'stage.updated', { stage: completedStage, workOrder: state })
    return state
  }

  async runTestingStage(id) {
    let state = await this.runOpencodePipelineStage(id, 'testing')
    const stage = getStageByKey(state.stages, 'testing')
    const manifest = await this.ensureManifest(id)
    const commands = [
      ['install', '安装依赖', manifest.install],
      ['build', '构建应用', manifest.build],
      ['test', '运行测试', manifest.test]
    ]

    for (const [, label, command] of commands) {
      state = await this.requireWorkOrder(id)
      const currentStage = getStageByKey(state.stages, 'testing')
      currentStage.status = STAGE_STATUS.RUNNING
      currentStage.items = [
        {
          type: 'ai',
          label,
          value: '执行中'
        }
      ]
      await this.store.saveWorkOrder(state)
      await this.emit(id, 'stage.updated', { stage: currentStage, workOrder: state })

      const result = await this.runner.run(command, {
        cwd: state.appDir,
        timeoutMs: 15 * 60 * 1000
      })
      const logPath = await this.appendStageLog(id, 'testing', formatCommandLog({
        label,
        command,
        result
      }))
      if (result.exitCode !== 0) {
        await this.failStage(id, 'testing', `${label}失败`, summarizeCommandResult(result), logPath)
        throw new Error(`${label} failed`)
      }
    }

    state = await this.requireWorkOrder(id)
    const testingStage = stageFromState(state, 'testing')
    markStageCompleted(testingStage, new Date(), {
      type: 'ai',
      label: '构建与测试',
      value: '安装、构建、测试全部通过'
    }, [
      {
        label: '《测试报告》',
        status: 'done'
      }
    ])
    testingStage.logPath = await this.getStageLogPath(id, 'testing')
    testingStage.logSummary = '安装、构建、测试全部通过'
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'stage.updated', { stage: getStageByKey(state.stages, 'testing'), workOrder: state })
    return state
  }

  async runDeploymentStage(id) {
    await this.runOpencodePipelineStage(id, 'deployment')
    let state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, 'deployment')
    const manifest = await this.ensureManifest(id)
    const port = await this.allocatePort(4101)
    const startCommand = substitutePortInCommand(manifest.start, port)
    const healthUrl = substitutePortInUrl(manifest.healthUrl, port)

    markStageRunning(stage, new Date(), {
      type: 'ai',
      label: '本机部署',
      value: `正在启动 ${healthUrl}`
    })
    state.currentStage = 5
    state.deploymentPort = port
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'stage.updated', { stage, workOrder: state })

    const child = this.runner.start(startCommand, {
      cwd: state.appDir,
      env: { PORT: String(port) }
    })
    this.runningApps.set(id, child)
    const logPath = await this.writeStageLog(id, 'deployment', [
      `# 本机部署`,
      `command: ${formatCommand(startCommand)}`,
      `cwd: ${state.appDir}`,
      `healthUrl: ${healthUrl}`,
      ''
    ].join('\n'))

    const healthy = await this.healthCheck(healthUrl, { timeoutMs: 60 * 1000 })
    if (!healthy) {
      const failedLogPath = await this.appendStageLog(id, 'deployment', `\n[health-check]\n未能访问 ${healthUrl}\n`)
      await this.failStage(id, 'deployment', '健康检查失败', `未能访问 ${healthUrl}`, failedLogPath)
      throw new Error('Deployment health check failed')
    }

    state = await this.requireWorkOrder(id)
    markStageCompleted(getStageByKey(state.stages, 'deployment'), new Date(), {
      type: 'ai',
      label: '本机部署',
      value: `部署成功：${healthUrl}`
    }, [
      {
        label: '访问地址',
        value: healthUrl,
        isLink: true
      }
    ])
    getStageByKey(state.stages, 'deployment').logPath = logPath
    getStageByKey(state.stages, 'deployment').logSummary = `部署成功：${healthUrl}`
    state.deploymentUrl = healthUrl
    state.progress = 100
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'stage.updated', { stage: getStageByKey(state.stages, 'deployment'), workOrder: state })
    return state
  }

  async ensureManifest(id) {
    const state = await this.requireWorkOrder(id)
    try {
      return await readManifest(state.appDir)
    } catch (error) {
      const manifestPath = path.join(state.appDir, MANIFEST_FILE)
      const appFiles = await listRelativeFiles(state.appDir)
      const logPath = await this.appendStageLog(id, 'coding', [
        '',
        '# 交付清单校验失败',
        `expected: ${manifestPath}`,
        `error: ${error.message}`,
        '',
        '## 当前 app 目录文件',
        appFiles.length ? appFiles.map((file) => `- ${file}`).join('\n') : '- <empty>',
        ''
      ].join('\n'))
      await this.failStage(id, 'coding', '缺少或无法解析 factory.manifest.json', error.message, logPath)
      throw error
    }
  }

  async failStage(id, stageKey, message, logSummary = '', logPath = null) {
    const state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, stageKey)
    markStageFailed(stage, message, logSummary, new Date(), logPath)
    state.status = WORK_ORDER_STATUS.FAILED
    state.currentStage = stage.id
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'stage.updated', { stage, workOrder: state })
    await this.emit(id, 'pipeline.failed', { stage, error: { message, logSummary }, workOrder: state })
    return state
  }

  async failFromUnexpectedError(id, stageKey, error) {
    this.logger.error?.(error)
    try {
      const state = await this.store.readWorkOrder(id)
      if (state?.status === WORK_ORDER_STATUS.FAILED && state.stages?.some((stage) => stage.status === STAGE_STATUS.FAILED)) {
        return
      }
      await this.failStage(id, stageKey, error.message || '流水线执行失败', error.stack || '')
    } catch (saveError) {
      this.logger.error?.(saveError)
    }
  }

  async emit(workOrderId, type, data) {
    const event = {
      id: randomUUID(),
      type,
      workOrderId,
      timestamp: new Date().toISOString(),
      data
    }
    await this.store.appendEvent(workOrderId, event)
    this.eventBus.publish(workOrderId, event)
    return event
  }

  async writeDebugOutput(id, fileName, content) {
    try {
      await fs.writeFile(path.join(this.store.getWorkOrderDir(id), fileName), content, 'utf8')
    } catch (error) {
      this.logger.warn?.(`Unable to write ${fileName}: ${error.message}`)
    }
  }

  async getStageLogPath(id, stageKey) {
    return path.join(this.store.getWorkOrderDir(id), 'logs', `${stageKey}.log`)
  }

  async writeStageLog(id, stageKey, content) {
    const logPath = await this.getStageLogPath(id, stageKey)
    await fs.mkdir(path.dirname(logPath), { recursive: true })
    await fs.writeFile(logPath, `${String(content || '').trim()}\n`, 'utf8')
    return logPath
  }

  async appendStageLog(id, stageKey, content) {
    const logPath = await this.getStageLogPath(id, stageKey)
    await fs.mkdir(path.dirname(logPath), { recursive: true })
    await fs.appendFile(logPath, `${String(content || '').trim()}\n`, 'utf8')
    return logPath
  }

  async requireWorkOrder(id) {
    const state = await this.store.readWorkOrder(id)
    if (!state) {
      const error = new Error('Work order not found')
      error.code = 'NOT_FOUND'
      throw error
    }
    return state
  }

  async getRequirementsMarkdown(state) {
    if (state.requirementsMarkdown) return state.requirementsMarkdown
    if (state.requirementsPath) {
      return fs.readFile(state.requirementsPath, 'utf8')
    }
    const appRequirements = path.join(state.appDir, 'requirements.md')
    return fs.readFile(appRequirements, 'utf8')
  }
}

function validateMessage(message) {
  const trimmed = String(message || '').trim()
  if (!trimmed) {
    const error = new Error('Message is required')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  if (trimmed.length > 8000) {
    const error = new Error('Message is too long')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  return trimmed
}

function stageFromState(state, key) {
  return getStageByKey(state.stages, key)
}

function formatCommandLog({ label, command, result }) {
  return [
    `# ${label}`,
    `command: ${formatCommand(command)}`,
    `exitCode: ${result.exitCode}`,
    result.timedOut ? 'timedOut: true' : '',
    '',
    '## stdout',
    result.stdout || '<empty>',
    '',
    '## stderr',
    result.stderr || '<empty>',
    ''
  ].filter(Boolean).join('\n')
}

function formatCommand(command) {
  if (!Array.isArray(command)) return String(command || '')
  const printable = command.slice()
  if (printable[0] === 'opencode' && printable.length > 0) {
    printable[printable.length - 1] = '[prompt omitted]'
  }
  return printable.map((part) => JSON.stringify(part)).join(' ')
}

async function listRelativeFiles(rootDir) {
  const results = []

  async function walk(currentDir, prefix = '') {
    let entries
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue
      const relativePath = path.join(prefix, entry.name)
      if (entry.isDirectory()) {
        await walk(path.join(currentDir, entry.name), relativePath)
      } else {
        results.push(relativePath)
      }
    }
  }

  await walk(rootDir)
  return results.sort()
}
