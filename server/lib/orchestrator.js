import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createMessage } from './store.js'
import { ensureBuiltinAppWorkspaces, getBuiltinApp, getBuiltinAppWorkspace, listBuiltinApps } from './apps.js'
import {
  STAGE_STATUS,
  WORK_ORDER_STATUS,
  getStageByKey,
  getStageProgress,
  markStageCompleted,
  markStageFailed,
  markStageRunning,
  markStageSkipped,
  refreshStageTiming
} from './stages.js'
import { fallbackRequirementsMarkdown, fallbackRequirementsItems, buildOpencodeCommand, createClarificationPrompt, createStagePrompt, createTestingRepairPrompt, parseClarificationResponse } from './opencode.js'
import { MANIFEST_FILE, inferAppUrlFromHealthUrl, readManifest, substitutePortInCommand, substitutePortInUrl } from './manifest.js'
import { CommandRunner, findAvailablePort, summarizeCommandResult, waitForHealth } from './runner.js'

const HANDOFF_FILE = 'handoff.md'
const TESTING_MAX_REPAIR_RETRIES = 3
const SKIPPABLE_STAGE_KEYS = new Set(['design', 'coding', 'testing', 'deployment'])
const MODEL_STAGE_KEYS = new Set(['requirements', 'design', 'coding', 'testing', 'deployment'])
const AGENT_STAGE_KEYS = new Set(['requirements', 'design', 'coding', 'testing', 'deployment'])
const DEFAULT_OPENCODE_AGENT = 'build'

function parseOpencodeModels(output) {
  return String(output || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[^/\s]+\/[^/\s]+$/.test(line))
    .map((id) => {
      const [provider, ...nameParts] = id.split('/')
      const name = nameParts.join('/')
      return { id, provider, name, label: id }
    })
}

function parseOpencodeAgents(output) {
  const agents = []
  const seen = new Set()
  for (const line of String(output || '').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s+\(([^)]+)\)\s*$/)
    if (!match) continue
    const id = match[1]
    if (seen.has(id)) continue
    seen.add(id)
    const marker = match[2].toLowerCase()
    agents.push({
      id,
      label: id,
      isPrimary: marker.includes('primary')
    })
  }
  return agents
}

function getSelectedModelForStage(state, stageKey) {
  const selections = state?.modelSelections || {}
  if (MODEL_STAGE_KEYS.has(stageKey)) {
    return selections[stageKey] || (stageKey === 'testing' || stageKey === 'deployment' ? selections.coding || null : null)
  }
  return null
}

function getSelectedAgentForStage(state, stageKey) {
  const selections = state?.agentSelections || {}
  if (!AGENT_STAGE_KEYS.has(stageKey)) return DEFAULT_OPENCODE_AGENT
  return String(selections[stageKey] || '').trim() || DEFAULT_OPENCODE_AGENT
}

export class WorkOrderService {
  constructor({
    store,
    eventBus,
    runner = new CommandRunner(),
    autoStart = true,
    allocatePort = findAvailablePort,
    healthCheck = waitForHealth,
    logger = console,
    appWorkspaceRoot = path.resolve(process.cwd(), '.runtime/app-workspaces'),
    modelCacheTtlMs = 60 * 1000,
    agentCacheTtlMs = 60 * 1000
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
    this.appWorkspaceRoot = appWorkspaceRoot
    this.modelCacheTtlMs = modelCacheTtlMs
    this.modelCache = null
    this.agentCacheTtlMs = agentCacheTtlMs
    this.agentCache = null
  }

  async init() {
    await this.store.init()
    await ensureBuiltinAppWorkspaces(this.appWorkspaceRoot)
  }

  async listWorkOrders() {
    return this.store.listWorkOrders()
  }

  async listApps() {
    return listBuiltinApps(this.appWorkspaceRoot)
  }

  async listOpencodeModels({ force = false } = {}) {
    const now = Date.now()
    if (!force && this.modelCache && now - this.modelCache.loadedAt < this.modelCacheTtlMs) {
      return this.modelCache.models
    }
    const result = await this.runner.run(['opencode', 'models'], {
      cwd: process.cwd(),
      timeoutMs: 15 * 1000
    })
    if (result.exitCode !== 0) {
      const error = new Error(`Unable to list opencode models: ${summarizeCommandResult(result) || `exit ${result.exitCode}`}`)
      error.code = 'OPENCODE_MODELS_ERROR'
      throw error
    }
    const models = parseOpencodeModels(result.stdout)
    this.modelCache = { loadedAt: now, models }
    return models
  }

  async listOpencodeAgents({ force = false } = {}) {
    const now = Date.now()
    if (!force && this.agentCache && now - this.agentCache.loadedAt < this.agentCacheTtlMs) {
      return this.agentCache.agents
    }
    const result = await this.runner.run(['opencode', 'agent', 'list'], {
      cwd: process.cwd(),
      timeoutMs: 15 * 1000
    })
    if (result.exitCode !== 0) {
      const error = new Error(`Unable to list opencode agents: ${summarizeCommandResult(result) || `exit ${result.exitCode}`}`)
      error.code = 'OPENCODE_AGENTS_ERROR'
      throw error
    }
    const agents = parseOpencodeAgents(result.stdout)
    this.agentCache = { loadedAt: now, agents }
    return agents
  }

  async getWorkOrder(id) {
    return this.store.readWorkOrder(id)
  }

  async getEvents(id, options = {}) {
    return this.store.readEvents(id, options)
  }

  async getStageLog(id, stageKey) {
    const state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, stageKey)
    if (!stage) {
      const error = new Error('Stage not found')
      error.code = 'NOT_FOUND'
      throw error
    }

    const entries = await this.store.readStageLogEntries(id, stageKey)
    let content = formatStageLogEntries(entries)
    if (stage.logPath) {
      try {
        const legacyContent = await fs.readFile(stage.logPath, 'utf8')
        content = [content, legacyContent].filter(Boolean).join('\n')
      } catch (error) {
        content = `${content || stage.logSummary || ''}\n\n[日志文件读取失败] ${error.message}`.trim()
      }
    }
    content = content || stage.logSummary || ''

    return {
      workOrderId: id,
      stageKey,
      stageName: stage.name,
      status: stage.status,
      logPath: stage.logPath || (entries.length > 0 ? await this.getStageLogPath(id, stageKey) : null),
      entries,
      content
    }
  }

  async createWorkOrder({ message, title, description, deferClarification = false, appId = null, modelSelections = null, agentSelections = null }, { startClarification = this.autoStart } = {}) {
    const shouldDeferClarification = Boolean(deferClarification)
    const trimmed = shouldDeferClarification ? '' : validateMessage(message)
    const appContext = await this.resolveAppContext(appId)
    const effectiveTitle = title ?? appContext?.title ?? null
    const trimmedTitle = shouldDeferClarification ? validateTitle(effectiveTitle) : (effectiveTitle == null ? null : validateTitle(effectiveTitle))
    const trimmedDescription = description == null ? '' : validateDescription(description)
    const normalizedModelSelections = await this.normalizeAndValidateModelSelections(modelSelections)
    const normalizedAgentSelections = await this.normalizeAndValidateAgentSelections(agentSelections)
    const state = await this.store.createWorkOrder({
      message: trimmed,
      title: trimmedTitle,
      description: trimmedDescription,
      deferClarification: shouldDeferClarification,
      appId: appContext?.id || null,
      workspaceDir: appContext?.workspaceDir || null,
      appDir: appContext?.appDir || null,
      modelSelections: normalizedModelSelections,
      agentSelections: normalizedAgentSelections
    })
    await this.emit(state.id, 'work-order.created', { workOrder: state })
    if (startClarification && !shouldDeferClarification) {
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
    const userMessage = createMessage({
      id: randomUUID(),
      role: 'user',
      content: trimmed,
      phase: 'clarification',
      createdAt: now
    })
    state.messages.push(userMessage)
    state.status = WORK_ORDER_STATUS.CLARIFYING
    state.awaitingOriginalRequirement = false
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
    await this.emit(id, 'assistant.message.append', { message: userMessage, workOrder: state })
    if (startClarification) {
      queueMicrotask(() => {
        this.processClarification(id).catch((error) => this.failFromUnexpectedError(id, 'requirements', error))
      })
    }
    return state
  }

  async processClarification(id, { startPipeline = false } = {}) {
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
      await this.emitStageStatus(id, state, requirementsStage, 'AI 正在分析需求完整性')

      const prompt = createClarificationPrompt(state.messages, {
        title: state.title,
        description: state.description
      })
      const command = buildOpencodeCommand(prompt, state.appDir, {
        thinking: false,
        diagnostics: true,
        model: getSelectedModelForStage(state, 'requirements'),
        agent: getSelectedAgentForStage(state, 'requirements')
      })
      const result = await this.runCommandWithStageLogging(id, 'requirements', {
        label: '需求澄清',
        command,
        cwd: state.appDir,
        timeoutMs: 15 * 60 * 1000,
        source: 'opencode'
      })

      if (result.exitCode !== 0) {
        throw new Error(`需求澄清执行失败：${summarizeCommandResult(result) || `exit ${result.exitCode}`}`)
      }

      const rawOutput = `${result.stdout}\n${result.stderr}`
      await this.writeDebugOutput(id, 'clarification-output.jsonl', rawOutput)
      let clarification
      try {
        clarification = parseClarificationResponse(rawOutput)
      } catch (error) {
        if (error.code !== 'OPENCODE_OUTPUT_ERROR') throw error
        state = await this.requireWorkOrder(id)
        const fallbackMarkdown = fallbackRequirementsMarkdown({
          title: state.title,
          messages: state.messages
        })
        clarification = {
          complete: true,
          reply: '需求分析服务返回异常，已基于原始需求生成保底需求摘要，准备进入智能开发。',
          requirementsMarkdown: fallbackMarkdown,
          requirementsItems: fallbackRequirementsItems({
            title: state.title,
            messages: state.messages
          }),
          title: state.title
        }
        await this.appendStageLogEntry(id, 'requirements', {
          level: 'WARN',
          source: 'system',
          text: `需求分析服务返回错误，已启用保底需求摘要：${error.opencodeErrorMessage || error.message}`
        })
      }
      state = await this.requireWorkOrder(id)
      const now = new Date().toISOString()
      const assistantMessage = createMessage({
        id: randomUUID(),
        role: 'assistant',
        content: clarification.reply || (clarification.complete ? '需求已澄清，开始进入自动研发流水线。' : '请补充更多需求信息。'),
        phase: 'clarification',
        createdAt: now
      })
      state.messages.push(assistantMessage)

      if (clarification.title) {
        state.title = clarification.title
      }

      if (clarification.outputSpec) {
        state.outputSpec = clarification.outputSpec
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
        await this.emit(id, 'assistant.message.append', { message: assistantMessage, workOrder: state })
        await this.emitStageStatus(id, state, getStageByKey(state.stages, 'requirements'), '等待用户补充需求')
        return state
      }

      const requirementsMarkdown = clarification.requirementsMarkdown || fallbackRequirementsMarkdown({
        title: state.title,
        messages: state.messages
      })
      const requirementsItems = clarification.requirementsItems && (clarification.requirementsItems.detailedRequirements?.length || clarification.requirementsItems.businessNecessity?.length || clarification.requirementsItems.expectedOutcome?.length)
        ? clarification.requirementsItems
        : fallbackRequirementsItems({ title: state.title, messages: state.messages })

      const stage = getStageByKey(state.stages, 'requirements')
      markStageCompleted(stage, new Date(), {
        type: 'ai',
        label: '需求澄清结果',
        value: '需求澄清完成，已生成条目化需求摘要'
      }, [])
      stage.outputs = []
      stage.requirementsItems = requirementsItems
      state.requirementsMarkdown = requirementsMarkdown
      state.requirementsItems = requirementsItems
      state.status = WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT
      state.currentStage = 2
      state.progress = getStageProgress(state.stages)
      await this.writeHandoffDocument(state, '需求澄清完成，后续阶段优先阅读本交接文档。')
      await this.store.saveWorkOrder(state)
      await this.emit(id, 'assistant.message.append', { message: assistantMessage, workOrder: state })
      await this.emitStageStatus(id, state, stage, '需求澄清完成，已生成需求摘要')
      await this.emit(id, 'work-order.status.changed', {
        status: state.status,
        progress: state.progress,
        workOrder: state
      })

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
      if (!await this.isStageSkipped(id, 'coding')) {
        await this.ensureManifest(id, 'coding')
      }
      await this.runTestingStage(id)
      await this.runDeploymentStage(id)
      const state = await this.requireWorkOrder(id)
      const deploymentStage = getStageByKey(state.stages, 'deployment')
      state.status = deploymentStage?.status === STAGE_STATUS.SKIPPED
        ? WORK_ORDER_STATUS.COMPLETED
        : WORK_ORDER_STATUS.DEPLOYED
      state.progress = 100
      state.currentStage = 5
      await this.store.saveWorkOrder(state)
      return state
    } finally {
      this.activePipelines.delete(id)
    }
  }

  async startDevelopmentRun(id, modelSelections = null, agentSelections = null) {
    if (modelSelections) {
      await this.updateModelSelections(id, modelSelections)
    }
    if (agentSelections) {
      await this.updateAgentSelections(id, agentSelections)
    }
    const state = await this.requireWorkOrder(id)
    if (this.activePipelines.has(id) || this.activeClarifications.has(id)) {
      const error = new Error('开发流水线正在运行，无法重复启动')
      error.code = 'CONFLICT'
      throw error
    }
    if (![WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT, WORK_ORDER_STATUS.CLARIFYING].includes(state.status)) {
      const error = new Error(`当前工单状态为 ${state.status}，无法启动智能开发`)
      error.code = 'CONFLICT'
      throw error
    }
    if (state.status === WORK_ORDER_STATUS.CLARIFYING) {
      if (!state.outputSpec?.sentence) {
        const error = new Error('需求澄清尚未生成可确认的输出规格，无法强制启动；请先在对话中补充需求信息')
        error.code = 'CONFLICT'
        throw error
      }
      const requirementsStage = getStageByKey(state.stages, 'requirements')
      if (requirementsStage && requirementsStage.status !== STAGE_STATUS.COMPLETED) {
        markStageCompleted(requirementsStage, new Date(), {
          type: 'ai',
          label: '需求澄清结果',
          value: '用户强制确认启动，需求阶段标记完成'
        }, [])
        requirementsStage.outputs = []
      }
      if (!state.requirementsItems) {
        state.requirementsItems = fallbackRequirementsItems({ title: state.title, messages: state.messages })
      }
      if (!state.requirementsMarkdown) {
        state.requirementsMarkdown = fallbackRequirementsMarkdown({ title: state.title, messages: state.messages })
      }
      if (!state.handoffPath) {
        await this.writeHandoffDocument(state, '用户强制确认启动，后续阶段优先阅读本交接文档。')
      }
      state.currentStage = 2
    }
    state.status = WORK_ORDER_STATUS.RUNNING
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'development.run.started', { workOrder: state })
    await this.appendVisibleMessage(state, {
      content: `已启动自动研发流水线；测试失败会自动返修，超过 ${TESTING_MAX_REPAIR_RETRIES} 次才中断。opencode 原始输出将实时同步到本面板。`,
      phase: 'execution',
      stageId: 'design',
      status: 'COMPLETED'
    })
    queueMicrotask(() => {
      this.runPipeline(id).catch((error) => this.failFromUnexpectedError(id, 'design', error))
    })
    return state
  }

  async updateModelSelections(id, modelSelections) {
    const state = await this.requireWorkOrder(id)
    if (![WORK_ORDER_STATUS.CLARIFYING, WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT].includes(state.status)) {
      const error = new Error(`当前工单状态为 ${state.status}，无法修改模型配置`)
      error.code = 'CONFLICT'
      throw error
    }
    state.modelSelections = await this.normalizeAndValidateModelSelections(modelSelections, state.modelSelections)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'work-order.model-selections.updated', {
      modelSelections: state.modelSelections,
      workOrder: state
    })
    return state
  }

  async updateAgentSelections(id, agentSelections) {
    const state = await this.requireWorkOrder(id)
    if (![WORK_ORDER_STATUS.CLARIFYING, WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT].includes(state.status)) {
      const error = new Error(`当前工单状态为 ${state.status}，无法修改 Agent 配置`)
      error.code = 'CONFLICT'
      throw error
    }
    state.agentSelections = await this.normalizeAndValidateAgentSelections(agentSelections, state.agentSelections)
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'work-order.agent-selections.updated', {
      agentSelections: state.agentSelections,
      workOrder: state
    })
    return state
  }

  async skipStage(id, stageKey) {
    const targetStageKey = validateSkippableStageKey(stageKey)
    const state = await this.requireWorkOrder(id)
    if (![WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT, WORK_ORDER_STATUS.RUNNING].includes(state.status)) {
      const error = new Error(`当前工单状态为 ${state.status}，无法跳过阶段`)
      error.code = 'CONFLICT'
      throw error
    }

    const stage = getStageByKey(state.stages, targetStageKey)
    if (!stage) {
      const error = new Error('Stage not found')
      error.code = 'NOT_FOUND'
      throw error
    }
    if (stage.status !== STAGE_STATUS.PENDING) {
      const error = new Error(`当前阶段状态为 ${stage.status}，只能跳过待执行阶段`)
      error.code = 'CONFLICT'
      throw error
    }

    markStageSkipped(stage, new Date(), {
      type: 'skipped',
      label: '阶段跳过',
      value: '已跳过'
    })
    if (state.status === WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT) {
      const nextPendingStage = state.stages.find((item) => item.status === STAGE_STATUS.PENDING)
      state.currentStage = nextPendingStage?.id || stage.id
    }
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.appendStageLogEntry(id, targetStageKey, {
      level: 'INFO',
      source: 'system',
      text: `${stage.name}已跳过`
    })
    await this.emitStageStatus(id, state, stage, `${stage.name}已跳过`)
    return state
  }

  async runOpencodePipelineStage(id, stageKey) {
    let state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, stageKey)
    if (stage.status === STAGE_STATUS.SKIPPED) {
      return state
    }
    state.currentStage = stage.id
    markStageRunning(stage, new Date(), {
      type: 'ai',
      label: stage.name,
      value: 'opencode 正在执行该阶段'
    })
    state.status = WORK_ORDER_STATUS.RUNNING
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emitStageStatus(id, state, stage, `${stage.name}阶段开始`)
    await this.appendVisibleMessage(state, {
      content: `${stage.name}阶段已开始，我会执行该阶段任务并同步日志。`,
      phase: 'execution',
      stageId: stageKey
    })

    const prompt = createStagePrompt({
      stageKey,
      title: state.title,
      userInput: buildUserInput(state)
    })
    const command = buildOpencodeCommand(prompt, state.appDir, {
      thinking: true,
      model: getSelectedModelForStage(state, stageKey),
      agent: getSelectedAgentForStage(state, stageKey)
    })
    const result = await this.runCommandWithStageLogging(id, stageKey, {
      label: stage.name,
      command,
      cwd: state.appDir,
      timeoutMs: 40 * 60 * 1000,
      source: 'opencode'
    })
    const logPath = await this.getStageLogPath(id, stageKey)
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
    if (stageKey !== 'testing') {
      await this.writeHandoffDocument(state, `${completedStage.name}阶段已完成：${completedStage.logSummary}`)
    }
    await this.store.saveWorkOrder(state)
    await this.emitStageStatus(id, state, completedStage, `${completedStage.name}阶段完成`)
    await this.appendVisibleMessage(state, {
      content: `${completedStage.name}阶段已完成：${completedStage.logSummary}`,
      phase: 'execution',
      stageId: stageKey
    })
    return state
  }

  async runTestingStage(id) {
    const preparedState = await this.runOpencodePipelineStage(id, 'testing')
    if (getStageByKey(preparedState.stages, 'testing')?.status === STAGE_STATUS.SKIPPED) {
      return preparedState
    }
    let repairAttempts = 0

    while (true) {
      const commandResult = await this.runTestingCommandChain(id)
      if (commandResult.ok) break

      if (repairAttempts >= TESTING_MAX_REPAIR_RETRIES) {
        const message = `测试质检超过最大重试次数 ${TESTING_MAX_REPAIR_RETRIES}`
        const summary = [commandResult.summary, `最后失败步骤：${commandResult.label}`].filter(Boolean).join('\n')
        await this.failStage(id, 'testing', message, summary, commandResult.logPath)
        throw new Error(message)
      }

      repairAttempts += 1
      const repairContextPath = await this.writeTestingRepairContext(id, {
        ...commandResult,
        attempt: repairAttempts,
        maxAttempts: TESTING_MAX_REPAIR_RETRIES
      })
      await this.runTestingRepairAttempt(id, {
        ...commandResult,
        attempt: repairAttempts,
        maxAttempts: TESTING_MAX_REPAIR_RETRIES,
        repairContextPath
      })
    }

    let state = await this.requireWorkOrder(id)
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
    await this.writeHandoffDocument(state, '测试质检已完成：安装、构建、测试全部通过。')
    await this.store.saveWorkOrder(state)
    await this.emitStageStatus(id, state, getStageByKey(state.stages, 'testing'), '安装、构建、测试全部通过')
    await this.appendVisibleMessage(state, {
      content: '测试质检已完成：安装、构建、测试全部通过。',
      phase: 'execution',
      stageId: 'testing'
    })
    return state
  }

  async runTestingCommandChain(id) {
    const state = await this.requireWorkOrder(id)
    const manifest = await this.ensureManifest(id, 'testing')
    const commands = [
      ['install', '安装依赖', manifest.install],
      ['build', '构建应用', manifest.build],
      ['test', '运行测试', manifest.test]
    ]

    for (const [, label, command] of commands) {
      const latestState = await this.requireWorkOrder(id)
      const currentStage = getStageByKey(latestState.stages, 'testing')
      markStageRunning(currentStage, new Date(), {
        type: 'ai',
        label,
        value: '执行中'
      })
      latestState.status = WORK_ORDER_STATUS.RUNNING
      latestState.currentStage = currentStage.id
      latestState.progress = getStageProgress(latestState.stages)
      await this.store.saveWorkOrder(latestState)
      await this.emitStageStatus(id, latestState, currentStage, `${label}开始`)

      const result = await this.runCommandWithStageLogging(id, 'testing', {
        label,
        command,
        cwd: state.appDir,
        timeoutMs: 15 * 60 * 1000,
        source: label === '运行测试' ? 'test' : 'command'
      })
      const logPath = await this.getStageLogPath(id, 'testing')
      if (result.exitCode !== 0) {
        return {
          ok: false,
          label,
          command,
          result,
          summary: summarizeCommandResult(result),
          logPath
        }
      }
    }

    return { ok: true }
  }

  async writeTestingRepairContext(id, {
    attempt,
    maxAttempts,
    label,
    command,
    result,
    summary,
    logPath
  }) {
    const state = await this.requireWorkOrder(id)
    const relativePath = `repair-context/testing-failure-attempt-${attempt}.md`
    await fs.mkdir(path.join(state.appDir, 'repair-context'), { recursive: true })
    const content = [
      `# ${label}失败`,
      '',
      `- 返修次数：第 ${attempt}/${maxAttempts} 次`,
      `- 失败步骤：${label}`,
      `- 失败命令：${formatCommand(command)}`,
      `- 退出码：${result?.exitCode ?? '-'}`,
      `- 日志路径：${logPath || '-'}`,
      '',
      '## 失败日志摘要',
      '',
      summary || '<empty>',
      '',
      '## stdout',
      '',
      result?.stdout || '<empty>',
      '',
      '## stderr',
      '',
      result?.stderr || '<empty>',
      ''
    ].join('\n')
    await this.store.writeAppFile(id, relativePath, content)
    return relativePath
  }

  async runTestingRepairAttempt(id, {
    attempt,
    maxAttempts,
    label,
    command: failedCommand,
    summary,
    repairContextPath
  }) {
    let state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, 'testing')
    const repairMessage = `第 ${attempt}/${maxAttempts} 次返修中`
    markStageRunning(stage, new Date(), {
      type: 'ai',
      label: '自动返修',
      value: repairMessage,
      progress: Math.min(85, 35 + attempt * 15)
    })
    stage.repairAttempts = { current: attempt, max: maxAttempts }
    state.repairAttempts = {
      ...(state.repairAttempts || {}),
      testing: attempt
    }
    state.status = WORK_ORDER_STATUS.RUNNING
    state.currentStage = stage.id
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.appendStageLogEntry(id, 'testing', {
      level: 'INFO',
      source: 'system',
      text: `测试质检${repairMessage}`
    })
    await this.emitStageStatus(id, state, stage, `测试质检${repairMessage}`)

    const prompt = createTestingRepairPrompt({
      title: state.title,
      userInput: buildUserInput(state),
      attempt,
      maxAttempts,
      failedLabel: label,
      failedCommand,
      logSummary: summary,
      repairContextPath
    })
    const repairCommand = buildOpencodeCommand(prompt, state.appDir, {
      thinking: true,
      model: getSelectedModelForStage(state, 'testing'),
      agent: getSelectedAgentForStage(state, 'testing')
    })
    const result = await this.runCommandWithStageLogging(id, 'testing', {
      label: `智能编码/修复 第 ${attempt}/${maxAttempts} 次`,
      command: repairCommand,
      cwd: state.appDir,
      timeoutMs: 40 * 60 * 1000,
      source: 'opencode'
    })

    if (result.exitCode !== 0) {
      const repairSummary = summarizeCommandResult(result)
      await this.appendStageLogEntry(id, 'testing', {
        level: 'ERROR',
        source: 'system',
        text: `智能编码/修复失败：${repairSummary}`
      })
      throw new Error(`智能编码/修复 failed`)
    }

    state = await this.requireWorkOrder(id)
    await this.writeHandoffDocument(state, `测试质检第 ${attempt}/${maxAttempts} 次自动返修完成，下一步重新执行安装、构建和测试。`)
    await this.store.saveWorkOrder(state)
    return state
  }

  async runDeploymentStage(id) {
    const preparedState = await this.runOpencodePipelineStage(id, 'deployment')
    if (getStageByKey(preparedState.stages, 'deployment')?.status === STAGE_STATUS.SKIPPED) {
      return preparedState
    }
    let state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, 'deployment')
    const manifest = await this.ensureManifest(id, 'deployment')
    const port = await this.allocatePort(4101)
    const startCommand = substitutePortInCommand(manifest.start, port)
    const healthUrl = substitutePortInUrl(manifest.healthUrl, port)
    const appUrl = manifest.appUrl ? substitutePortInUrl(manifest.appUrl, port) : inferAppUrlFromHealthUrl(healthUrl)

    markStageRunning(stage, new Date(), {
      type: 'ai',
      label: '本机部署',
      value: `正在启动 ${appUrl}`
    })
    state.currentStage = 5
    state.deploymentPort = port
    state.deploymentHealthUrl = healthUrl
    state.progress = getStageProgress(state.stages)
    await this.store.saveWorkOrder(state)
    await this.emitStageStatus(id, state, stage, `正在启动 ${appUrl}`)
    await this.appendStageLogEntry(id, 'deployment', {
      level: 'INFO',
      source: 'deploy',
      text: `本机部署: ${formatCommand(startCommand)}`
    })
    await this.appendStageLogEntry(id, 'deployment', {
      level: 'INFO',
      source: 'deploy',
      text: `appUrl: ${appUrl}`
    })
    await this.appendStageLogEntry(id, 'deployment', {
      level: 'INFO',
      source: 'deploy',
      text: `healthUrl: ${healthUrl}`
    })

    const child = this.runner.start(startCommand, {
      cwd: state.appDir,
      env: { PORT: String(port) },
      onStdoutLine: async (line) => {
        await this.appendStageLogEntry(id, 'deployment', {
          level: 'INFO',
          source: 'deploy',
          text: line
        })
      },
      onStderrLine: async (line) => {
        await this.appendStageLogEntry(id, 'deployment', {
          level: 'WARN',
          source: 'deploy',
          text: line
        })
      }
    })
    this.runningApps.set(id, child)
    const logPath = await this.getStageLogPath(id, 'deployment')

    const healthy = await this.healthCheck(healthUrl, { timeoutMs: 60 * 1000 })
    if (!healthy) {
      const failedLogPath = await this.appendStageLog(id, 'deployment', `健康检查失败：未能访问 ${healthUrl}`, {
        level: 'ERROR',
        source: 'deploy'
      })
      await this.failStage(id, 'deployment', '健康检查失败', `未能访问 ${healthUrl}`, failedLogPath)
      throw new Error('Deployment health check failed')
    }

    state = await this.requireWorkOrder(id)
    markStageCompleted(getStageByKey(state.stages, 'deployment'), new Date(), {
      type: 'ai',
      label: '本机部署',
      value: `部署成功：${appUrl}`
    }, [
      {
        label: '访问地址',
        value: appUrl,
        isLink: true
      }
    ])
    getStageByKey(state.stages, 'deployment').logPath = logPath
    getStageByKey(state.stages, 'deployment').logSummary = `部署成功：${appUrl}`
    state.deploymentUrl = appUrl
    state.deploymentHealthUrl = healthUrl
    state.progress = 100
    await this.store.saveWorkOrder(state)
    await this.emitStageStatus(id, state, getStageByKey(state.stages, 'deployment'), `部署成功：${appUrl}`)
    await this.appendVisibleMessage(state, {
      content: `部署交付已完成：${appUrl}`,
      phase: 'execution',
      stageId: 'deployment'
    })
    state = await this.requireWorkOrder(id)
    state.deploymentUrl = appUrl
    state.deploymentHealthUrl = healthUrl
    state.status = WORK_ORDER_STATUS.DEPLOYED
    state.progress = 100
    await this.store.saveWorkOrder(state)
    await this.emit(id, 'deployment.updated', {
      deploymentUrl: appUrl,
      deploymentHealthUrl: healthUrl,
      status: WORK_ORDER_STATUS.DEPLOYED,
      workOrder: state
    })
    return state
  }

  async ensureManifest(id, failureStageKey = 'coding') {
    const state = await this.requireWorkOrder(id)
    try {
      return await readManifest(state.appDir)
    } catch (error) {
      const manifestPath = path.join(state.appDir, MANIFEST_FILE)
      const appFiles = await listRelativeFiles(state.appDir)
      const logPath = await this.appendStageLog(id, failureStageKey, [
        '',
        '# 交付清单校验失败',
        `expected: ${manifestPath}`,
        `error: ${error.message}`,
        '',
        '## 当前 app 目录文件',
        appFiles.length ? appFiles.map((file) => `- ${file}`).join('\n') : '- <empty>',
        ''
      ].join('\n'))
      await this.failStage(id, failureStageKey, '缺少或无法解析 factory.manifest.json', error.message, logPath)
      throw error
    }
  }

  async isStageSkipped(id, stageKey) {
    const state = await this.requireWorkOrder(id)
    return getStageByKey(state.stages, stageKey)?.status === STAGE_STATUS.SKIPPED
  }

  async failStage(id, stageKey, message, logSummary = '', logPath = null) {
    const state = await this.requireWorkOrder(id)
    const stage = getStageByKey(state.stages, stageKey)
    const errorText = [message, logSummary].filter(Boolean).join('：')
    const errorEntry = await this.appendStageLogEntry(id, stageKey, {
      level: 'ERROR',
      source: 'system',
      text: errorText
    })
    const effectiveLogPath = logPath || await this.getStageLogPath(id, stageKey)
    markStageFailed(stage, message, logSummary, new Date(), effectiveLogPath)
    state.status = WORK_ORDER_STATUS.FAILED
    state.currentStage = stage.id
    state.progress = getStageProgress(state.stages)
    const assistantMessage = createMessage({
      role: 'assistant',
      content: `${stage.name}执行失败：${logSummary || message}`,
      phase: 'execution',
      stageId: stageKey,
      status: 'FAILED',
      createdAt: errorEntry.timestamp
    })
    state.messages = [...(state.messages || []), assistantMessage]
    await this.store.saveWorkOrder(state)
    await this.emitStageStatus(id, state, stage, message)
    await this.emit(id, 'assistant.message.append', {
      message: assistantMessage,
      workOrder: state
    })
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
    const event = await this.store.appendEvent(workOrderId, {
      type,
      workOrderId,
      timestamp: new Date().toISOString(),
      ...data
    })
    this.eventBus.publish(workOrderId, event)
    return event
  }

  async writeDebugOutput(id, fileName, content) {
    try {
      await fs.writeFile(path.join(this.store.getWorkOrderDir(id), fileName), sanitizeDiagnosticText(content), 'utf8')
    } catch (error) {
      this.logger.warn?.(`Unable to write ${fileName}: ${error.message}`)
    }
  }

  async writeHandoffDocument(state, note = '') {
    const handoffPath = await this.store.writeAppFile(state.id, HANDOFF_FILE, buildHandoffDocument(state, note))
    state.handoffPath = handoffPath
    return handoffPath
  }

  async getStageLogPath(id, stageKey) {
    return this.store.getStageLogPath(id, stageKey)
  }

  async writeStageLog(id, stageKey, content) {
    return this.appendStageLog(id, stageKey, content)
  }

  async appendStageLog(id, stageKey, content, { level = 'INFO', source = 'system' } = {}) {
    const logPath = await this.getStageLogPath(id, stageKey)
    const lines = splitOutputLines(content)
    if (lines.length === 0) {
      await this.appendStageLogEntry(id, stageKey, { level, source, text: '' })
    }
    for (const line of lines) {
      await this.appendStageLogEntry(id, stageKey, { level, source, text: line })
    }
    return logPath
  }

  async appendStageLogEntry(id, stageKey, entry) {
    const savedEntry = await this.store.appendStageLogEntry(id, stageKey, {
      ...entry,
      text: sanitizeDiagnosticText(entry.text)
    })
    await this.emit(id, 'stage.log.append', {
      stageId: stageKey,
      entry: savedEntry
    })
    return savedEntry
  }

  async emitStageStatus(id, state, stage, message) {
    refreshStageTiming(stage)
    return this.emit(id, 'stage.status.changed', {
      stageId: stage.key,
      status: stage.status,
      progress: state.progress,
      message,
      stage,
      workOrder: state
    })
  }

  async appendVisibleMessage(state, {
    role = 'assistant',
    content,
    phase = 'execution',
    stageId = null,
    status = 'COMPLETED',
    kind = null,
    metadata = null
  }) {
    const message = createMessage({
      role,
      content,
      phase,
      stageId,
      status,
      kind,
      metadata,
      createdAt: new Date().toISOString()
    })
    state.messages = [...(state.messages || []), message]
    await this.store.saveWorkOrder(state)
    await this.emit(state.id, 'assistant.message.append', {
      message,
      workOrder: state
    })
    return message
  }

  async appendOpencodeStreamDelta(id, messageId, delta, status = null, metadataPatch = null) {
    if (!messageId) return null
    const updated = await this.store.appendMessageDelta(id, messageId, delta, status, metadataPatch)
    if (!updated) return null
    await this.emit(id, 'assistant.message.delta', {
      messageId,
      delta,
      status: updated.status,
      metadata: updated.metadata,
      workOrderId: id
    })
    return updated
  }

  async finalizeOpencodeStreamMessage(id, messageId, status, metadataPatch = null) {
    if (!messageId) return null
    const updated = await this.store.appendMessageDelta(id, messageId, '', status, metadataPatch)
    if (!updated) return null
    await this.emit(id, 'assistant.message.delta', {
      messageId,
      delta: '',
      status,
      metadata: updated.metadata,
      workOrderId: id
    })
    return updated
  }

  async runCommandWithStageLogging(id, stageKey, {
    label,
    command,
    cwd,
    env,
    timeoutMs,
    source = 'command'
  }) {
    let streamedLineCount = 0
    let replayedLineCount = 0
    let streamMessageId = null
    let startLogged = false
    const formattedCommand = formatCommand(command)
    await this.appendStageLogEntry(id, stageKey, {
      level: 'INFO',
      source,
      text: `${label}: ${formattedCommand}`
    })
    if (source === 'opencode') {
      await this.appendStageLogEntry(id, stageKey, {
        level: 'INFO',
        source,
        text: `opencode log dir: ${getOpencodeLogDir()}`
      })
    }

    const logCommandStart = async (diagnostics) => {
      startLogged = true
      await this.appendStageLogEntry(id, stageKey, {
        level: 'INFO',
        source,
        text: formatCommandStartLog({
          label,
          command: formattedCommand,
          diagnostics,
          cwd,
          timeoutMs
        })
      })
    }

    if (source === 'opencode') {
      const state = await this.requireWorkOrder(id)
      const streamMessage = await this.appendVisibleMessage(state, {
        content: '',
        phase: 'execution',
        stageId: stageKey,
        status: 'STREAMING',
        kind: 'opencode-stream',
        metadata: { stageKey, label, source, activity: 'thinking' }
      })
      streamMessageId = streamMessage.id
    }

    const isClarificationStage = stageKey === 'requirements'
    const handleOpencodeLine = async (line, lineLevel) => {
      const parsed = parseOpencodeLine(line)
      if (!parsed) return
      if (parsed.kind === 'text' || parsed.kind === 'thinking') {
        const text = redactSensitiveText(parsed.text || '')
        if (!text) return
        if (isClarificationStage && text.trimStart().startsWith('{')) {
          return
        }
        await this.appendOpencodeStreamDelta(id, streamMessageId, `${text}\n`, 'STREAMING', { activity: 'thinking' })
        return
      }
      if (parsed.kind === 'tool') {
        const summary = redactSensitiveText(formatToolSummary(parsed.tool, parsed.description))
        if (summary) {
          await this.appendOpencodeStreamDelta(id, streamMessageId, `${summary}\n`, 'STREAMING', {
            activity: 'tool',
            tool: parsed.tool || null,
            toolDescription: redactSensitiveText(parsed.description || '') || null
          })
        }
        return
      }
      if (parsed.kind === 'step') {
        await this.appendOpencodeStreamDelta(id, streamMessageId, '', 'STREAMING', { activity: 'thinking' })
        return
      }
      if (parsed.kind === 'raw') {
        await this.appendOpencodeStreamDelta(id, streamMessageId, `${sanitizeDiagnosticText(line)}\n`, 'STREAMING', { activity: 'thinking' })
      }
    }

    const result = await this.runner.run(command, {
      cwd,
      env,
      timeoutMs,
      onStart: logCommandStart,
      onStdoutLine: async (line) => {
        streamedLineCount += 1
        await this.appendStageLogEntry(id, stageKey, {
          level: 'INFO',
          source,
          text: line
        })
        if (streamMessageId) {
          await handleOpencodeLine(line, 'INFO')
        }
      },
      onStderrLine: async (line) => {
        streamedLineCount += 1
        await this.appendStageLogEntry(id, stageKey, {
          level: inferStderrLogLevel(line),
          source,
          text: line
        })
        if (streamMessageId) {
          await handleOpencodeLine(line, 'WARN')
        }
      }
    })
    const diagnostics = normalizeCommandDiagnostics(result.diagnostics, {
      cwd,
      timeoutMs,
      stdout: result.stdout,
      stderr: result.stderr
    })
    if (!startLogged && diagnostics) {
      await logCommandStart(diagnostics)
    }

    if (streamedLineCount === 0) {
      for (const line of splitOutputLines(result.stdout)) {
        replayedLineCount += 1
        await this.appendStageLogEntry(id, stageKey, {
          level: 'INFO',
          source,
          text: line
        })
        if (streamMessageId) {
          await handleOpencodeLine(line, 'INFO')
        }
      }
      for (const line of splitOutputLines(result.stderr)) {
        replayedLineCount += 1
        await this.appendStageLogEntry(id, stageKey, {
          level: inferStderrLogLevel(line),
          source,
          text: line
        })
        if (streamMessageId) {
          await handleOpencodeLine(line, 'WARN')
        }
      }
    }
    if (source === 'opencode' && streamedLineCount + replayedLineCount === 0) {
      await this.appendStageLogEntry(id, stageKey, {
        level: result.timedOut ? 'WARN' : 'INFO',
        source,
        text: 'opencode 已启动但未产生可读输出'
      })
    }

    await this.appendStageLogEntry(id, stageKey, {
      level: result.exitCode === 0 ? 'INFO' : 'ERROR',
      source,
      text: formatCommandExitLog({ label, result, diagnostics })
    })
    if (source === 'opencode') {
      await this.appendOpencodeDiagnostics(id, {
        stageKey,
        label,
        command: formattedCommand,
        cwd,
        timeoutMs,
        result,
        diagnostics
      })
    }

    if (streamMessageId) {
      const finalStatus = result.exitCode === 0 ? 'COMPLETED' : 'FAILED'
      await this.finalizeOpencodeStreamMessage(id, streamMessageId, finalStatus, { activity: null })
    }
    return result
  }

  async appendOpencodeDiagnostics(id, {
    stageKey,
    label,
    command,
    cwd,
    timeoutMs,
    result,
    diagnostics
  }) {
    try {
      const record = buildOpencodeDiagnosticsRecord({
        stageKey,
        label,
        command,
        cwd,
        timeoutMs,
        result,
        diagnostics
      })
      const diagnosticsPath = path.join(this.store.getWorkOrderDir(id), 'opencode-diagnostics.jsonl')
      await fs.appendFile(diagnosticsPath, `${JSON.stringify(redactSensitiveObject(record))}\n`, 'utf8')
    } catch (error) {
      this.logger.warn?.(`Unable to write opencode diagnostics: ${error.message}`)
    }
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

  async resolveAppContext(appId) {
    const normalized = String(appId || '').trim()
    if (!normalized) return null
    const app = getBuiltinApp(normalized)
    if (!app) {
      const error = new Error('Unknown appId')
      error.code = 'VALIDATION_ERROR'
      throw error
    }
    await ensureBuiltinAppWorkspaces(this.appWorkspaceRoot)
    const workspaceDir = getBuiltinAppWorkspace(app, this.appWorkspaceRoot)
    return {
      ...app,
      workspaceDir,
      appDir: path.join(workspaceDir, 'app')
    }
  }

  async normalizeAndValidateModelSelections(input, base = null) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
    const merged = {
      requirements: base?.requirements || null,
      design: base?.design || null,
      coding: base?.coding || null,
      testing: base?.testing || null,
      deployment: base?.deployment || null
    }
    const keys = Object.keys(source)
    for (const key of keys) {
      if (!MODEL_STAGE_KEYS.has(key)) {
        const error = new Error(`Unsupported model selection stage: ${key}`)
        error.code = 'VALIDATION_ERROR'
        throw error
      }
      const value = String(source[key] || '').trim()
      merged[key] = value || null
    }
    const selected = Object.values(merged).filter(Boolean)
    if (selected.length === 0) return merged
    const availableModels = await this.listOpencodeModels()
    const availableIds = new Set(availableModels.map((model) => model.id))
    for (const model of selected) {
      if (!availableIds.has(model)) {
        const error = new Error(`Model is not available from opencode models: ${model}`)
        error.code = 'VALIDATION_ERROR'
        throw error
      }
    }
    return merged
  }

  async normalizeAndValidateAgentSelections(input, base = null) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
    const merged = {
      requirements: base?.requirements || DEFAULT_OPENCODE_AGENT,
      design: base?.design || DEFAULT_OPENCODE_AGENT,
      coding: base?.coding || DEFAULT_OPENCODE_AGENT,
      testing: base?.testing || DEFAULT_OPENCODE_AGENT,
      deployment: base?.deployment || DEFAULT_OPENCODE_AGENT
    }
    const keys = Object.keys(source)
    for (const key of keys) {
      if (!AGENT_STAGE_KEYS.has(key)) {
        const error = new Error(`Unsupported agent selection stage: ${key}`)
        error.code = 'VALIDATION_ERROR'
        throw error
      }
      const value = String(source[key] || '').trim()
      merged[key] = value || DEFAULT_OPENCODE_AGENT
    }
    if (keys.length === 0) return merged

    const availableAgents = await this.listOpencodeAgents()
    const availableIds = new Set(availableAgents.map((agent) => agent.id))
    for (const agent of new Set(Object.values(merged))) {
      if (!availableIds.has(agent)) {
        const error = new Error(`Agent is not available from opencode agent list: ${agent}`)
        error.code = 'VALIDATION_ERROR'
        throw error
      }
    }
    return merged
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

function validateTitle(title) {
  const trimmed = String(title || '').trim()
  if (!trimmed) {
    const error = new Error('Title is required')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  if (trimmed.length > 120) {
    const error = new Error('Title is too long')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  return trimmed
}

function validateDescription(description) {
  const trimmed = String(description || '').trim()
  if (trimmed.length > 2000) {
    const error = new Error('Description is too long')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  return trimmed
}

function validateSkippableStageKey(stageKey) {
  const normalized = String(stageKey || '').trim()
  if (!SKIPPABLE_STAGE_KEYS.has(normalized)) {
    const error = new Error('Stage cannot be skipped')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  return normalized
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

function formatStageLogEntries(entries) {
  return entries.map((entry) => {
    const timestamp = entry.timestamp || ''
    const level = entry.level || 'INFO'
    const source = entry.source || 'system'
    return `[${timestamp}] [${level}] [${source}] ${entry.text || ''}`
  }).join('\n')
}

function splitOutputLines(content) {
  return String(content || '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
}

function formatCommandStartLog({
  label,
  command,
  diagnostics,
  cwd,
  timeoutMs
}) {
  const normalized = normalizeCommandDiagnostics(diagnostics, { cwd, timeoutMs })
  return [
    `${label} started`,
    `pid=${normalized?.pid ?? '-'}`,
    `cwd=${normalized?.cwd || cwd || '-'}`,
    `timeoutMs=${normalized?.timeoutMs ?? timeoutMs ?? '-'}`,
    `startedAt=${normalized?.startedAt || '-'}`,
    `command=${command}`
  ].join(' ')
}

function formatCommandExitLog({ label, result, diagnostics }) {
  const normalized = normalizeCommandDiagnostics(diagnostics, {
    stdout: result.stdout,
    stderr: result.stderr
  })
  const parts = [
    `${label} exitCode=${result.exitCode}`,
    result.timedOut ? 'timedOut=true' : '',
    `lastOutputAt=${normalized?.lastOutputAt || '<none>'}`,
    normalized?.idleMs != null ? `idleMs=${normalized.idleMs}` : '',
    normalized?.exitSignal ? `exitSignal=${normalized.exitSignal}` : '',
    `stdoutBytes=${normalized?.stdout?.bytes ?? Buffer.byteLength(result.stdout || '', 'utf8')}`,
    `stderrBytes=${normalized?.stderr?.bytes ?? Buffer.byteLength(result.stderr || '', 'utf8')}`,
    `stdoutLines=${normalized?.stdout?.lineCount ?? splitOutputLines(result.stdout).length}`,
    `stderrLines=${normalized?.stderr?.lineCount ?? splitOutputLines(result.stderr).length}`
  ]
  return parts.filter(Boolean).join(' ')
}

function normalizeCommandDiagnostics(diagnostics, fallback = {}) {
  if (!diagnostics && !fallback) return null
  const stdoutText = fallback.stdout || ''
  const stderrText = fallback.stderr || ''
  const stdout = diagnostics?.stdout || {}
  const stderr = diagnostics?.stderr || {}
  return {
    pid: diagnostics?.pid ?? null,
    cwd: diagnostics?.cwd || fallback.cwd || null,
    timeoutMs: diagnostics?.timeoutMs ?? fallback.timeoutMs ?? null,
    startedAt: diagnostics?.startedAt || null,
    endedAt: diagnostics?.endedAt || null,
    lastOutputAt: diagnostics?.lastOutputAt || null,
    idleMs: diagnostics?.idleMs ?? null,
    exitSignal: diagnostics?.exitSignal ?? diagnostics?.signal ?? null,
    stdout: {
      bytes: stdout.bytes ?? Buffer.byteLength(stdoutText, 'utf8'),
      lineCount: stdout.lineCount ?? splitOutputLines(stdoutText).length,
      chunks: stdout.chunks ?? null,
      lastOutputAt: stdout.lastOutputAt || null
    },
    stderr: {
      bytes: stderr.bytes ?? Buffer.byteLength(stderrText, 'utf8'),
      lineCount: stderr.lineCount ?? splitOutputLines(stderrText).length,
      chunks: stderr.chunks ?? null,
      lastOutputAt: stderr.lastOutputAt || null
    },
    outputEvents: Array.isArray(diagnostics?.outputEvents) ? diagnostics.outputEvents : []
  }
}

function buildOpencodeDiagnosticsRecord({
  stageKey,
  label,
  command,
  cwd,
  timeoutMs,
  result,
  diagnostics
}) {
  const normalized = normalizeCommandDiagnostics(diagnostics, {
    cwd,
    timeoutMs,
    stdout: result.stdout,
    stderr: result.stderr
  })
  return {
    stageKey,
    label,
    command,
    pid: normalized?.pid ?? null,
    cwd: normalized?.cwd || cwd || null,
    timeoutMs: normalized?.timeoutMs ?? timeoutMs ?? null,
    startedAt: normalized?.startedAt || null,
    endedAt: normalized?.endedAt || null,
    lastOutputAt: normalized?.lastOutputAt || null,
    idleMs: normalized?.idleMs ?? null,
    exitCode: result.exitCode,
    exitSignal: normalized?.exitSignal || null,
    timedOut: Boolean(result.timedOut),
    stdoutBytes: normalized?.stdout?.bytes ?? 0,
    stderrBytes: normalized?.stderr?.bytes ?? 0,
    stdoutLineCount: normalized?.stdout?.lineCount ?? 0,
    stderrLineCount: normalized?.stderr?.lineCount ?? 0,
    outputEvents: normalized?.outputEvents || [],
    opencodeLogDir: getOpencodeLogDir()
  }
}

function inferStderrLogLevel(line) {
  const text = String(line || '')
  if (/\b(ERROR|ERR|FATAL)\b/i.test(text)) return 'ERROR'
  if (/\b(DEBUG|TRACE)\b/i.test(text)) return 'INFO'
  return 'WARN'
}

function getOpencodeLogDir() {
  const dataHome = process.env.XDG_DATA_HOME || path.join(process.env.HOME || '', '.local', 'share')
  return path.join(dataHome, 'opencode', 'log')
}

function extractUserInput(messages) {
  if (!Array.isArray(messages)) return ''
  return messages
    .filter((message) => message && message.sender === 'user' && typeof message.text === 'string')
    .map((message) => message.text.trim())
    .filter((text) => text.length > 0)
    .join('\n\n')
}

function buildUserInput(state) {
  const conversationInput = extractUserInput(state?.messages)
  const outputSpecSentence = state?.outputSpec?.sentence
  return [conversationInput, outputSpecSentence].filter(Boolean).join('\n\n')
}

function redactSensitiveObject(value) {
  if (typeof value === 'string') return sanitizeDiagnosticText(value)
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((item) => redactSensitiveObject(item))
  const result = {}
  for (const [key, item] of Object.entries(value)) {
    result[key] = redactSensitiveObject(item)
  }
  return result
}

function sanitizeDiagnosticText(value) {
  return redactSensitiveText(redactOpencodeRunArgs(value))
}

function redactSensitiveText(value) {
  let text = String(value ?? '')
  text = text.replace(/("(?:api[_-]?key|apikey|token|password|authorization)"\s*:\s*)"[^"]*"/gi, '$1"[REDACTED]"')
  text = text.replace(/((?:api[_-]?key|apikey|token|password|authorization)\s*[:=]\s*)"[^"]*"/gi, '$1"[REDACTED]"')
  text = text.replace(/((?:api[_-]?key|apikey|token|password|authorization)\s*[:=]\s*)'[^']*'/gi, "$1'[REDACTED]'")
  text = text.replace(/((?:api[_-]?key|apikey|token|password|authorization)\s*[:=]\s*)(?!["'])(?:Bearer\s+)?[^\s,;}\]]+/gi, '$1[REDACTED]')
  return text
}

function redactOpencodeRunArgs(value) {
  const text = String(value ?? '')
  const marker = 'args='
  let output = ''
  let cursor = 0

  while (cursor < text.length) {
    const markerIndex = text.indexOf(`${marker}[`, cursor)
    if (markerIndex === -1) {
      output += text.slice(cursor)
      break
    }

    output += text.slice(cursor, markerIndex)
    const arrayStart = markerIndex + marker.length
    const arrayEnd = findJsonArrayEnd(text, arrayStart)
    if (arrayEnd === -1) {
      output += text.slice(markerIndex, arrayStart + 1)
      cursor = arrayStart + 1
      continue
    }

    const rawArray = text.slice(arrayStart, arrayEnd)
    output += `${marker}${redactPromptFromOpencodeRunArgs(rawArray)}`
    cursor = arrayEnd
  }

  return output
}

function redactPromptFromOpencodeRunArgs(rawArray) {
  try {
    const args = JSON.parse(rawArray)
    if (Array.isArray(args) && args[0] === 'run' && args.length > 1) {
      const printable = args.slice()
      printable[printable.length - 1] = '[prompt omitted]'
      return JSON.stringify(printable)
    }
  } catch {
    if (/^\[\s*"run"/.test(rawArray)) {
      return '["run","[prompt omitted]"]'
    }
  }
  return rawArray
}

function findJsonArrayEnd(text, startIndex) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '[') {
      depth += 1
    } else if (char === ']') {
      depth -= 1
      if (depth === 0) return index + 1
    }
  }

  return -1
}

function buildHandoffDocument(state, note = '') {
  const completedStages = (state.stages || [])
    .filter((stage) => stage.status === STAGE_STATUS.COMPLETED || stage.status === STAGE_STATUS.SKIPPED)
    .map((stage) => {
      const statusText = stage.status === STAGE_STATUS.SKIPPED ? '已跳过' : (stage.logSummary || stage.items?.[0]?.value || '已完成')
      return `- ${stage.name}：${statusText}`
    })
  const runningStage = (state.stages || []).find((stage) => stage.status === STAGE_STATUS.RUNNING)
  const failedStage = (state.stages || []).find((stage) => stage.status === STAGE_STATUS.FAILED)
  const repairAttempts = state.repairAttempts?.testing
    ? `测试质检已自动返修 ${state.repairAttempts.testing}/${TESTING_MAX_REPAIR_RETRIES} 次。`
    : '测试质检尚未触发自动返修。'

  return [
    '# 阶段交接文档',
    '',
    '## 第一阅读项',
    '',
    '- 后续所有阶段必须先阅读本文件。',
    '- 如果本文件不存在或信息不足，再结合本工单对话中的原始用户需求与当前项目完整上下文。',
    '- 本工单不落盘 requirements.md、docs/design.md 等需求/设计文档，请直接以原始用户需求为准。',
    '',
    '## 当前工单',
    '',
    `- 工单：${state.id}`,
    `- 应用：${state.title}`,
    `- 状态：${state.status}`,
    `- 原始用户需求：见本工单对话记录`,
    `- 当前阶段：${runningStage?.name || failedStage?.name || '-'}`,
    `- 返修状态：${repairAttempts}`,
    '',
    '## 最近交接说明',
    '',
    note || '暂无。',
    '',
    '## 已完成阶段',
    '',
    completedStages.length ? completedStages.join('\n') : '- 暂无。',
    '',
    '## 下一阶段执行原则',
    '',
    '- 以不中断流水线为主要目标，自行修复可恢复的问题。',
    '- 成功部署是第二目标，但部署必须在质检通过后执行。',
    '- 不要向用户请求“是否继续”；仅在超过重试上限、缺凭据或需要破坏性操作时失败退出。',
    ''
  ].join('\n')
}

function parseOpencodeLine(line) {
  const raw = String(line || '')
  if (!raw.trim()) return null
  let obj
  try {
    obj = JSON.parse(raw)
  } catch {
    return { kind: 'raw', text: raw }
  }
  if (!obj || typeof obj !== 'object') return { kind: 'raw', text: raw }

  const type = obj.type
  const part = obj.part || {}

  if (type === 'text') {
    const text = typeof part.text === 'string' ? part.text : ''
    return { kind: 'text', text }
  }
  if (type === 'thinking') {
    const text = typeof part.text === 'string' ? part.text : ''
    return { kind: 'thinking', text }
  }
  if (type === 'tool_use' || part.type === 'tool') {
    const tool = part.tool || obj.tool || null
    const state = part.state || obj.state || {}
    const input = state.input || {}
    const description = input.description || input.command || input.path || input.pattern || input.query || ''
    return { kind: 'tool', tool, description: typeof description === 'string' ? description : '' }
  }
  if (type === 'step_start' || type === 'step_finish' || part.type === 'step-start' || part.type === 'step-finish') {
    return { kind: 'step' }
  }
  return { kind: 'skip' }
}

function formatToolSummary(tool, description) {
  const trimmedTool = String(tool || '').trim()
  const trimmedDesc = String(description || '').trim()
  if (!trimmedTool && !trimmedDesc) return ''
  if (trimmedTool && trimmedDesc) {
    return `▸ 执行 ${trimmedTool}: ${trimmedDesc}`
  }
  if (trimmedTool) {
    return `▸ 执行 ${trimmedTool}`
  }
  return `▸ ${trimmedDesc}`
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
