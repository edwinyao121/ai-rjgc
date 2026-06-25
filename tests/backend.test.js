import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { WorkOrderStore } from '../server/lib/store.js'
import { WorkOrderEventBus } from '../server/lib/events.js'
import { WorkOrderService } from '../server/lib/orchestrator.js'
import { createApiServer } from '../server/index.js'
import { parseClarificationResponse, buildOpencodeCommand, createClarificationPrompt, createStagePrompt } from '../server/lib/opencode.js'
import { inferAppUrlFromHealthUrl, substitutePortInCommand, substitutePortInUrl, validateManifest } from '../server/lib/manifest.js'
import { summarizeCommandResult } from '../server/lib/runner.js'
import { runCommand } from '../server/lib/runner.js'
import { STAGE_STATUS, WORK_ORDER_STATUS, createPipelineStages, markStageCompleted, markStageFailed, markStageRunning } from '../server/lib/stages.js'

test('allocates work order ids and persists state and requirements files', async () => {
  const fixture = await createFixture()
  try {
    const first = await fixture.store.createWorkOrder({
      message: '做一个舰载任务看板',
      now: new Date('2026-06-24T08:00:00+08:00')
    })
    const second = await fixture.store.createWorkOrder({
      message: '做一个海况计算器',
      now: new Date('2026-06-24T08:05:00+08:00')
    })

    assert.equal(first.id, 'WO-20260624-001')
    assert.equal(second.id, 'WO-20260624-002')

    const saved = await fixture.store.readWorkOrder(first.id)
    assert.equal(saved.title, '做一个舰载任务看板')
    assert.equal(saved.stages[0].status, STAGE_STATUS.RUNNING)

    const requirementsPath = await fixture.store.writeRequirements(first.id, '# 需求规格说明书')
    assert.equal(path.basename(requirementsPath), `${first.id}-requirements.md`)
    assert.equal((await readFile(requirementsPath, 'utf8')).trim(), '# 需求规格说明书')
  } finally {
    await fixture.cleanup()
  }
})

test('stage timing exposes estimated remaining while running and actual elapsed when completed', () => {
  const stages = createPipelineStages(new Date('2026-06-24T08:00:00.000Z'))
  const designStage = stages.find((stage) => stage.key === 'design')

  markStageRunning(designStage, new Date('2026-06-24T08:10:00.000Z'), {
    type: 'ai',
    label: '系统设计',
    value: 'opencode 正在执行该阶段'
  })

  assert.equal(designStage.status, STAGE_STATUS.RUNNING)
  assert.equal(designStage.estimatedDuration, '25分钟')
  assert.equal(designStage.estimatedRemaining, '25分钟')
  assert.equal(designStage.estimatedCompletedAt, '2026-06-24T08:35:00.000Z')

  markStageCompleted(designStage, new Date('2026-06-24T08:11:30.000Z'), {
    type: 'ai',
    label: '系统设计',
    value: '阶段执行完成'
  })

  assert.equal(designStage.status, STAGE_STATUS.COMPLETED)
  assert.equal(designStage.actualDuration, '1分30秒')
  assert.equal(designStage.duration, '1分30秒')
  assert.equal(designStage.estimatedRemaining, '0秒')
})

test('parses clarification JSON from opencode JSON events and markdown fences', () => {
  const raw = [
    JSON.stringify({
      type: 'message',
      message: {
        content: [
          {
            type: 'text',
            text: '```json\n{"complete":false,"reply":"请补充目标用户和验收标准","requirementsMarkdown":"","title":"潮汐应用"}\n```'
          }
        ]
      }
    }),
    JSON.stringify({ type: 'done' })
  ].join('\n')

  assert.deepEqual(parseClarificationResponse(raw), {
    complete: false,
    reply: '请补充目标用户和验收标准',
    requirementsMarkdown: '',
    requirementsItems: {
      detailedRequirements: [],
      businessNecessity: [],
      expectedOutcome: [],
      targetUsers: '',
      coreFeatures: [],
      inputData: '',
      mainPages: '',
      acceptanceCriteria: []
    },
    title: '潮汐应用'
  })
})

test('clarification prompt asks the agent to deepen scenarios into detailed requirements', () => {
  const prompt = createClarificationPrompt([
    { sender: 'user', text: '做一个仓库库存预警看板' }
  ])

  assert.match(prompt, /深化理解用户输入场景/)
  assert.match(prompt, /多条细化需求/)
  assert.match(prompt, /每条细化需求都必须包含/)
  assert.match(prompt, /业务需求必要性/)
  assert.match(prompt, /预期成效/)
  assert.match(prompt, /尽量不要向用户提问题/)
  assert.match(prompt, /每条细化需求之间必须用 \\n\\n 分隔/)
})

test('parses clarification JSON with multiline requirementsMarkdown from opencode text events', () => {
  const modelText = `{
  "complete": true,
  "reply": "需求已确认，开始自动研发。",
  "requirementsMarkdown": "# 航母母港潮汐窗口计算器需求规格说明书

## 目标用户

军事辅助决策人员。

## 核心功能

- 使用 mock 实时潮汐数据。
- 按推荐参数计算可出港时间窗口。
",
  "title": "航母母港潮汐窗口计算器"
}`
  const raw = JSON.stringify({
    type: 'text',
    part: {
      type: 'text',
      text: modelText
    }
  })

  const parsed = parseClarificationResponse(raw)

  assert.equal(parsed.complete, true)
  assert.equal(parsed.reply, '需求已确认，开始自动研发。')
  assert.equal(parsed.title, '航母母港潮汐窗口计算器')
  assert.match(parsed.requirementsMarkdown, /军事辅助决策人员/)
})

test('treats plain requirements markdown as a completed clarification', () => {
  const raw = JSON.stringify({
    type: 'text',
    part: {
      type: 'text',
      text: '# 航母母港潮汐窗口计算器需求规格说明书\n\n## 验收标准\n\n- 展示时间窗口列表。'
    }
  })

  const parsed = parseClarificationResponse(raw)

  assert.equal(parsed.complete, true)
  assert.equal(parsed.title, '航母母港潮汐窗口计算器需求规格说明书')
  assert.match(parsed.requirementsMarkdown, /时间窗口列表/)
})

test('reports opencode error events from clarification output', () => {
  const raw = JSON.stringify({
    type: 'error',
    error: {
      name: 'UnknownError',
      data: {
        message: 'Type validation failed: Value: {"request_id":"req-1","code":"InvalidParameter","message":"Output data may contain inappropriate content."}.'
      }
    }
  })

  assert.throws(
    () => parseClarificationResponse(raw),
    (error) => error.code === 'OPENCODE_OUTPUT_ERROR' && /Output data may contain inappropriate content/.test(error.message)
  )
})

test('broadcasts SSE events and writes events.jsonl', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner()
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })
    const state = await service.createWorkOrder({ message: '做一个测试应用' }, { startClarification: false })
    const response = new FakeResponse()

    fixture.eventBus.subscribe(state.id, response, [])
    await service.emit(state.id, 'stage.status.changed', { ok: true })

    const events = await fixture.store.readEvents(state.id)
    assert.equal(events.at(-1).type, 'stage.status.changed')
    assert.match(response.chunks.join(''), /event: stage\.status\.changed/)
  } finally {
    await fixture.cleanup()
  }
})

test('assigns monotonic event sequences and replays events after Last-Event-ID', async () => {
  const fixture = await createFixture()
  try {
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      autoStart: false
    })
    const state = await service.createWorkOrder({ message: '做一个测试应用' }, { startClarification: false })

    const first = await service.emit(state.id, 'stage.status.changed', {
      stageId: 'requirements',
      status: STAGE_STATUS.RUNNING
    })
    const second = await service.emit(state.id, 'assistant.message.append', {
      message: { id: 'msg-test', role: 'assistant', content: '需求澄清中' }
    })

    assert.equal(first.sequence, 2)
    assert.equal(second.sequence, 3)

    const history = await service.getEvents(state.id, { afterSequence: 2 })
    const response = new FakeResponse()
    fixture.eventBus.subscribe(state.id, response, history)
    const streamed = response.chunks.join('')

    assert.doesNotMatch(streamed, /stage\.status\.changed/)
    assert.match(streamed, /event: assistant\.message\.append/)
    assert.match(streamed, /id: 3/)
  } finally {
    await fixture.cleanup()
  }
})

test('migrates legacy state.messages into messages.json with normalized roles', async () => {
  const fixture = await createFixture()
  try {
    const state = await fixture.store.createWorkOrder({
      message: '旧格式用户需求',
      now: new Date('2026-06-24T08:00:00+08:00')
    })
    const messagesPath = path.join(fixture.store.getWorkOrderDir(state.id), 'messages.json')
    await rm(messagesPath, { force: true })

    const loaded = await fixture.store.readWorkOrder(state.id)
    assert.equal(loaded.messages[0].role, 'user')
    assert.equal(loaded.messages[0].content, '旧格式用户需求')
    assert.equal(loaded.messages[1].role, 'assistant')
    assert.equal(loaded.messages[1].content, '已创建工单，正在进行需求澄清。')

    const persisted = JSON.parse(await readFile(messagesPath, 'utf8'))
    assert.equal(persisted[0].role, 'user')
    assert.equal(persisted[1].role, 'assistant')
  } finally {
    await fixture.cleanup()
  }
})

test('concurrent message file writes do not race on a shared temp file', async () => {
  const fixture = await createFixture()
  try {
    const state = await fixture.store.createWorkOrder({
      message: '并发消息写入',
      now: new Date('2026-06-24T08:00:00+08:00')
    })

    const writes = Array.from({ length: 80 }, (_, index) => fixture.store.writeMessages(state.id, [
      {
        id: `msg-${index}`,
        role: 'assistant',
        content: `第 ${index} 次写入 ${'x'.repeat(4096)}`,
        phase: 'clarification',
        createdAt: new Date('2026-06-24T08:00:00.000Z').toISOString()
      }
    ]))
    const results = await Promise.allSettled(writes)
    const rejected = results.filter((result) => result.status === 'rejected')

    assert.deepEqual(rejected.map((result) => result.reason?.code), [])
    const persisted = await fixture.store.readMessages(state.id)
    assert.equal(persisted.length, 1)
    assert.match(persisted[0].content, /第 \d+ 次写入/)
  } finally {
    await fixture.cleanup()
  }
})

test('appends and reads structured stage log entries as JSONL', async () => {
  const fixture = await createFixture()
  try {
    const state = await fixture.store.createWorkOrder({
      message: '需要实时日志',
      now: new Date('2026-06-24T08:00:00+08:00')
    })

    const first = await fixture.store.appendStageLogEntry(state.id, 'design', {
      level: 'INFO',
      source: 'opencode',
      text: '开始生成架构设计'
    })
    const second = await fixture.store.appendStageLogEntry(state.id, 'design', {
      level: 'ERROR',
      source: 'system',
      text: '设计阶段失败'
    })

    const entries = await fixture.store.readStageLogEntries(state.id, 'design')
    assert.equal(first.sequence, 1)
    assert.equal(second.sequence, 2)
    assert.deepEqual(entries.map((entry) => entry.text), ['开始生成架构设计', '设计阶段失败'])

    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      autoStart: false
    })
    const log = await service.getStageLog(state.id, 'design')
    assert.equal(log.stageKey, 'design')
    assert.equal(log.entries.length, 2)
    assert.match(log.content, /开始生成架构设计/)
    assert.match(log.content, /ERROR/)
  } finally {
    await fixture.cleanup()
  }
})

test('runCommand reports stdout and stderr lines as they arrive', async () => {
  const stdoutLines = []
  const stderrLines = []
  const result = await runCommand([
    process.execPath,
    '-e',
    'console.log("out one"); console.error("err one"); process.stdout.write("out two")'
  ], {
    onStdoutLine: (line) => stdoutLines.push(line),
    onStderrLine: (line) => stderrLines.push(line)
  })

  assert.equal(result.exitCode, 0)
  assert.deepEqual(stdoutLines, ['out one', 'out two'])
  assert.deepEqual(stderrLines, ['err one'])
})

test('runCommand returns process diagnostics when a command times out without output', async () => {
  const result = await runCommand([
    process.execPath,
    '-e',
    'setTimeout(() => {}, 2000)'
  ], {
    timeoutMs: 50
  })

  assert.equal(result.exitCode, 124)
  assert.equal(result.timedOut, true)
  assert.equal(typeof result.diagnostics.pid, 'number')
  assert.ok(result.diagnostics.pid > 0)
  assert.equal(result.diagnostics.cwd, process.cwd())
  assert.equal(result.diagnostics.timeoutMs, 50)
  assert.equal(result.diagnostics.stdout.bytes, 0)
  assert.equal(result.diagnostics.stdout.lineCount, 0)
  assert.equal(result.diagnostics.stderr.bytes, 0)
  assert.equal(result.diagnostics.stderr.lineCount, 0)
  assert.equal(result.diagnostics.lastOutputAt, null)
  assert.ok(result.diagnostics.idleMs >= 0)
})

test('validates manifest command arrays and substitutes deployment port', () => {
  const manifest = validateManifest({
    name: 'demo',
    install: ['npm', 'install'],
    build: ['npm', 'run', 'build'],
    test: ['npm', 'test'],
    start: ['npm', 'run', 'preview', '--', '--port', '${PORT}'],
    healthUrl: 'http://127.0.0.1:${PORT}/api/health',
    appUrl: 'http://127.0.0.1:${PORT}'
  })

  assert.deepEqual(substitutePortInCommand(manifest.start, 4101), ['npm', 'run', 'preview', '--', '--port', '4101'])
  assert.equal(substitutePortInUrl(manifest.healthUrl, 4101), 'http://127.0.0.1:4101/api/health')
  assert.equal(substitutePortInUrl(manifest.appUrl, 4101), 'http://127.0.0.1:4101')
  assert.equal(inferAppUrlFromHealthUrl('http://127.0.0.1:4101/api/health'), 'http://127.0.0.1:4101')
  assert.throws(() => validateManifest({ ...manifest, test: 'npm test' }), /command array/)
})

test('skipStage marks pending development stages as skipped with events and progress', async () => {
  const fixture = await createFixture()
  try {
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner: new FakeRunner([
        clarificationHandler({
          complete: true,
          reply: '需求已确认。',
          requirementsMarkdown: '# 跳过阶段需求',
          title: '跳过阶段应用'
        })
      ]),
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个跳过阶段应用' }, { startClarification: false })
    await service.processClarification(state.id)

    for (const stageKey of ['design', 'coding', 'testing', 'deployment']) {
      const updated = await service.skipStage(state.id, stageKey)
      const stage = updated.stages.find((item) => item.key === stageKey)
      assert.equal(stage.status, STAGE_STATUS.SKIPPED)
      assert.equal(stage.items[0].value, '已跳过')
    }

    const skipped = await fixture.store.readWorkOrder(state.id)
    assert.equal(skipped.progress, 100)

    const events = await fixture.store.readEvents(state.id)
    assert.ok(events.some((event) => event.type === 'stage.log.append' && event.stageId === 'design' && /已跳过/.test(event.entry?.text || '')))
    assert.ok(events.some((event) => event.type === 'stage.status.changed' && event.stageId === 'deployment' && event.status === STAGE_STATUS.SKIPPED))
  } finally {
    await fixture.cleanup()
  }
})

test('skipStage rejects requirements invalid stages and non-pending stages', async () => {
  const fixture = await createFixture()
  try {
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner: new FakeRunner([
        clarificationHandler({
          complete: true,
          reply: '需求已确认。',
          requirementsMarkdown: '# 跳过校验需求',
          title: '跳过校验应用'
        })
      ]),
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个跳过校验应用' }, { startClarification: false })
    await assert.rejects(() => service.skipStage(state.id, 'design'), { code: 'CONFLICT' })

    await service.processClarification(state.id)

    await assert.rejects(() => service.skipStage(state.id, 'requirements'), { code: 'VALIDATION_ERROR' })
    await assert.rejects(() => service.skipStage(state.id, 'unknown'), { code: 'VALIDATION_ERROR' })

    const runningState = await fixture.store.readWorkOrder(state.id)
    markStageRunning(runningState.stages.find((stage) => stage.key === 'design'), new Date())
    await fixture.store.saveWorkOrder(runningState)
    await assert.rejects(() => service.skipStage(state.id, 'design'), { code: 'CONFLICT' })

    const completedState = await fixture.store.readWorkOrder(state.id)
    markStageCompleted(completedState.stages.find((stage) => stage.key === 'design'), new Date())
    await fixture.store.saveWorkOrder(completedState)
    await assert.rejects(() => service.skipStage(state.id, 'design'), { code: 'CONFLICT' })

    const failedState = await fixture.store.readWorkOrder(state.id)
    markStageFailed(failedState.stages.find((stage) => stage.key === 'design'), '失败', '失败')
    await fixture.store.saveWorkOrder(failedState)
    await assert.rejects(() => service.skipStage(state.id, 'design'), { code: 'CONFLICT' })

    const skippedState = await fixture.store.readWorkOrder(state.id)
    skippedState.stages.find((stage) => stage.key === 'design').status = STAGE_STATUS.PENDING
    skippedState.status = WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT
    await fixture.store.saveWorkOrder(skippedState)
    await service.skipStage(state.id, 'design')
    await assert.rejects(() => service.skipStage(state.id, 'design'), { code: 'CONFLICT' })
  } finally {
    await fixture.cleanup()
  }
})

test('POST /api/work-orders/:id/stage-skips returns the updated work order', async () => {
  const fixture = await createFixture()
  let apiServer
  try {
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner: new FakeRunner([
        clarificationHandler({
          complete: true,
          reply: '需求已确认。',
          requirementsMarkdown: '# 接口跳过需求',
          title: '接口跳过应用'
        })
      ]),
      autoStart: false
    })
    const state = await service.createWorkOrder({ message: '做一个接口跳过应用' }, { startClarification: false })
    await service.processClarification(state.id)

    apiServer = createApiServer({ service, eventBus: fixture.eventBus })
    await new Promise((resolve) => apiServer.listen(0, '127.0.0.1', resolve))
    const { port } = apiServer.address()

    const response = await fetch(`http://127.0.0.1:${port}/api/work-orders/${state.id}/stage-skips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageKey: 'design' })
    })
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.workOrder.id, state.id)
    assert.equal(payload.workOrder.stages.find((stage) => stage.key === 'design').status, STAGE_STATUS.SKIPPED)
  } finally {
    if (apiServer) {
      await new Promise((resolve) => apiServer.close(resolve))
    }
    await fixture.cleanup()
  }
})

test('runs a complete mock pipeline and writes the deployment URL', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      async () => ok(JSON.stringify({
        complete: true,
        reply: '需求已确认，开始研发。',
        requirementsMarkdown: '# 测试应用需求',
        title: '测试应用'
      })),
      async () => ok('design ok'),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'mock-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}/api/health'
        }), 'utf8')
        return ok('coding ok')
      },
      async () => ok('testing prep ok'),
      async () => ok('install ok'),
      async () => ok('build ok'),
      async () => ok('test ok'),
      async () => ok('deployment prep ok')
    ])
    const healthChecks = []
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4101,
      healthCheck: async (url) => {
        healthChecks.push(url)
        return true
      }
    })

    const state = await service.createWorkOrder({ message: '做一个测试应用' }, { startClarification: false })
    await service.processClarification(state.id, { startPipeline: false })
    const completed = await service.runPipeline(state.id)

    assert.equal(completed.status, WORK_ORDER_STATUS.DEPLOYED)
    assert.equal(completed.deploymentUrl, 'http://127.0.0.1:4101')
    assert.equal(completed.deploymentHealthUrl, 'http://127.0.0.1:4101/api/health')
    assert.equal(completed.stages.every((stage) => stage.status === STAGE_STATUS.COMPLETED), true)
    assert.deepEqual(runner.starts[0].command, ['node', 'server.js', '--port', '4101'])
    assert.deepEqual(healthChecks, ['http://127.0.0.1:4101/api/health'])

    const events = await fixture.store.readEvents(state.id)
    assert.ok(events.some((event) => event.type === 'stage.log.append' && event.entry?.text === 'install ok'))
    assert.ok(events.some((event) => event.type === 'stage.log.append' && event.entry?.text === 'appUrl: http://127.0.0.1:4101'))
    assert.ok(events.some((event) => event.type === 'stage.log.append' && event.entry?.text === 'healthUrl: http://127.0.0.1:4101/api/health'))
    assert.ok(events.some((event) => event.type === 'stage.log.append' && event.entry?.source === 'deploy'))
    assert.ok(events.some((event) => (
      event.type === 'deployment.updated'
      && event.status === WORK_ORDER_STATUS.DEPLOYED
      && event.deploymentUrl === 'http://127.0.0.1:4101'
      && event.deploymentHealthUrl === 'http://127.0.0.1:4101/api/health'
    )))

    const testingLog = await service.getStageLog(state.id, 'testing')
    assert.match(testingLog.content, /install ok/)
    assert.match(testingLog.content, /build ok/)
    assert.match(testingLog.content, /test ok/)
  } finally {
    await fixture.cleanup()
  }
})

test('runPipeline skips deployment without starting an app and completes the work order', async () => {
  const fixture = await createFixture()
  try {
    const healthChecks = []
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 跳过部署需求',
        title: '跳过部署应用'
      }),
      async () => ok('design ok'),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'skip-deploy-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}'
        }), 'utf8')
        return ok('coding ok')
      },
      async () => ok('testing prep ok'),
      async () => ok('install ok'),
      async () => ok('build ok'),
      async () => ok('test ok')
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4101,
      healthCheck: async (url) => {
        healthChecks.push(url)
        return true
      }
    })

    const state = await service.createWorkOrder({ message: '做一个跳过部署应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.skipStage(state.id, 'deployment')
    const completed = await service.runPipeline(state.id)

    assert.equal(completed.status, WORK_ORDER_STATUS.COMPLETED)
    assert.equal(completed.deploymentUrl, null)
    assert.equal(completed.stages.find((stage) => stage.key === 'deployment').status, STAGE_STATUS.SKIPPED)
    assert.equal(runner.starts.length, 0)
    assert.deepEqual(healthChecks, [])
    assert.equal(runner.runs.length, 7)

    const events = await fixture.store.readEvents(state.id)
    assert.equal(events.some((event) => event.type === 'deployment.updated'), false)
  } finally {
    await fixture.cleanup()
  }
})

test('runPipeline continues after a skipped middle stage', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 跳过设计需求',
        title: '跳过设计应用'
      }),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'skip-design-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}'
        }), 'utf8')
        return ok('coding ok')
      },
      async () => ok('testing prep ok'),
      async () => ok('install ok'),
      async () => ok('build ok'),
      async () => ok('test ok'),
      async () => ok('deployment prep ok')
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4101,
      healthCheck: async () => true
    })

    const state = await service.createWorkOrder({ message: '做一个跳过设计应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.skipStage(state.id, 'design')
    const completed = await service.runPipeline(state.id)

    assert.equal(completed.status, WORK_ORDER_STATUS.DEPLOYED)
    assert.equal(completed.stages.find((stage) => stage.key === 'design').status, STAGE_STATUS.SKIPPED)
    assert.equal(completed.stages.find((stage) => stage.key === 'coding').status, STAGE_STATUS.COMPLETED)
    assert.equal(completed.stages.find((stage) => stage.key === 'testing').status, STAGE_STATUS.COMPLETED)
    assert.equal(completed.stages.find((stage) => stage.key === 'deployment').status, STAGE_STATUS.COMPLETED)
    assert.equal(runner.runs.some((run) => String(run.command.at(-1)).includes('系统设计阶段')), false)
  } finally {
    await fixture.cleanup()
  }
})

test('skipped coding stays skipped when testing later fails on missing manifest', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 缺失产物需求',
        title: '缺失产物应用'
      }),
      async () => ok('design ok'),
      async () => ok('testing prep ok')
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个缺失产物应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.skipStage(state.id, 'coding')

    await assert.rejects(() => service.runPipeline(state.id), /factory\.manifest\.json/)

    const failed = await fixture.store.readWorkOrder(state.id)
    assert.equal(failed.status, WORK_ORDER_STATUS.FAILED)
    assert.equal(failed.stages.find((stage) => stage.key === 'coding').status, STAGE_STATUS.SKIPPED)
    assert.equal(failed.stages.find((stage) => stage.key === 'testing').status, STAGE_STATUS.FAILED)
  } finally {
    await fixture.cleanup()
  }
})

test('testing failure triggers one automatic repair attempt before deployment', async () => {
  const fixture = await createFixture()
  try {
    const repairPrompts = []
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 自动返修需求',
        title: '自动返修应用'
      }),
      async () => ok('design ok'),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'repair-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}'
        }), 'utf8')
        return ok('coding ok')
      },
      async () => ok('testing prep ok'),
      async () => ok('install ok'),
      async () => ok('build ok'),
      async () => ({ exitCode: 1, stdout: 'unit output', stderr: 'vitest failed' }),
      async (command) => {
        repairPrompts.push(command.at(-1))
        return ok('repair applied')
      },
      async () => ok('install ok after repair'),
      async () => ok('build ok after repair'),
      async () => ok('test ok after repair'),
      async () => ok('deployment prep ok')
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4103,
      healthCheck: async () => true
    })

    const state = await service.createWorkOrder({ message: '做一个自动返修应用' }, { startClarification: false })
    await service.processClarification(state.id)
    const completed = await service.runPipeline(state.id)

    assert.equal(completed.status, WORK_ORDER_STATUS.DEPLOYED)
    assert.equal(completed.repairAttempts?.testing, 1)
    assert.equal(repairPrompts.length, 1)
    assert.match(repairPrompts[0], /智能编码\/修复/)
    assert.match(repairPrompts[0], /第 1\/3 次/)
    assert.match(repairPrompts[0], /vitest failed/)
    assert.match(repairPrompts[0], /repair-context\/testing-failure-attempt-1\.md/)

    const repairContext = await readFile(path.join(state.appDir, 'repair-context/testing-failure-attempt-1.md'), 'utf8')
    assert.match(repairContext, /运行测试失败/)
    assert.match(repairContext, /vitest failed/)

    const testingLog = await service.getStageLog(state.id, 'testing')
    assert.match(testingLog.content, /第 1\/3 次返修中/)
    assert.match(testingLog.content, /test ok after repair/)
  } finally {
    await fixture.cleanup()
  }
})

test('testing failure fails only after three automatic repair attempts', async () => {
  const fixture = await createFixture()
  try {
    const repairPrompts = []
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 返修上限需求',
        title: '返修上限应用'
      }),
      async () => ok('design ok'),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'retry-limit-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}'
        }), 'utf8')
        return ok('coding ok')
      },
      async () => ok('testing prep ok'),
      async () => ok('install 1'),
      async () => ok('build 1'),
      async () => ({ exitCode: 1, stdout: '', stderr: 'test fail 1' }),
      async (command) => {
        repairPrompts.push(command.at(-1))
        return ok('repair 1')
      },
      async () => ok('install 2'),
      async () => ok('build 2'),
      async () => ({ exitCode: 1, stdout: '', stderr: 'test fail 2' }),
      async (command) => {
        repairPrompts.push(command.at(-1))
        return ok('repair 2')
      },
      async () => ok('install 3'),
      async () => ok('build 3'),
      async () => ({ exitCode: 1, stdout: '', stderr: 'test fail 3' }),
      async (command) => {
        repairPrompts.push(command.at(-1))
        return ok('repair 3')
      },
      async () => ok('install 4'),
      async () => ok('build 4'),
      async () => ({ exitCode: 1, stdout: '', stderr: 'test fail 4' })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4104,
      healthCheck: async () => true
    })

    const state = await service.createWorkOrder({ message: '做一个返修上限应用' }, { startClarification: false })
    await service.processClarification(state.id)

    await assert.rejects(() => service.runPipeline(state.id), /测试质检超过最大重试次数 3/)

    const failed = await fixture.store.readWorkOrder(state.id)
    assert.equal(failed.status, WORK_ORDER_STATUS.FAILED)
    assert.equal(failed.repairAttempts?.testing, 3)
    assert.equal(failed.stages.find((stage) => stage.key === 'testing').status, STAGE_STATUS.FAILED)
    assert.equal(repairPrompts.length, 3)
    assert.match(repairPrompts[2], /第 3\/3 次/)
    assert.equal(runner.starts.length, 0)

    const testingLog = await service.getStageLog(state.id, 'testing')
    assert.match(testingLog.content, /测试质检超过最大重试次数 3/)
    assert.match(testingLog.content, /test fail 4/)
  } finally {
    await fixture.cleanup()
  }
})

test('marks a stage as failed and keeps a log summary when a stage command fails', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      async () => ok(JSON.stringify({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 失败场景需求',
        title: '失败应用'
      })),
      async () => ({ exitCode: 1, stdout: '', stderr: 'design exploded' })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个会失败的应用' }, { startClarification: false })
    await service.processClarification(state.id, { startPipeline: false })
    await assert.rejects(() => service.runPipeline(state.id), /系统设计 failed/)

    const failed = await fixture.store.readWorkOrder(state.id)
    assert.equal(failed.status, WORK_ORDER_STATUS.FAILED)
    const designStage = failed.stages.find((stage) => stage.key === 'design')
    assert.equal(designStage.status, STAGE_STATUS.FAILED)
    assert.match(designStage.logSummary, /design exploded/)
    assert.ok(failed.messages.some((message) => message.role === 'assistant' && /系统设计执行失败/.test(message.content)))

    const log = await service.getStageLog(state.id, 'design')
    assert.ok(log.entries.some((entry) => entry.level === 'ERROR' && /design exploded/.test(entry.text)))
  } finally {
    await fixture.cleanup()
  }
})

test('missing manifest fails the coding stage only and exposes stage logs', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      async () => ok(JSON.stringify({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 缺失 manifest 场景需求',
        title: '缺失清单应用'
      })),
      async () => ok('design created docs/design.md'),
      async () => ok('coding created app files but forgot manifest')
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个缺失 manifest 的应用' }, { startClarification: false })
    await service.processClarification(state.id, { startPipeline: false })
    await assert.rejects(() => service.runPipeline(state.id), /factory\.manifest\.json/)

    const failed = await fixture.store.readWorkOrder(state.id)
    const designStage = failed.stages.find((stage) => stage.key === 'design')
    const codingStage = failed.stages.find((stage) => stage.key === 'coding')
    assert.equal(designStage.status, STAGE_STATUS.COMPLETED)
    assert.equal(codingStage.status, STAGE_STATUS.FAILED)
    assert.match(codingStage.logSummary, /factory\.manifest\.json/)
    assert.ok(codingStage.logPath)

    const log = await service.getStageLog(state.id, 'coding')
    assert.equal(log.stageKey, 'coding')
    assert.match(log.content, /coding created app files but forgot manifest/)
    assert.match(log.content, /factory\.manifest\.json/)
  } finally {
    await fixture.cleanup()
  }
})

test('clarification complete leaves work order in READY_FOR_DEVELOPMENT and does not auto-run pipeline', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认，等待用户启动智能开发。',
        requirementsMarkdown: '# 准备就绪需求',
        title: '准备就绪应用'
      })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个准备就绪的应用' }, { startClarification: false })
    const clarified = await service.processClarification(state.id)

    assert.equal(clarified.status, WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT)
    assert.equal(clarified.stages[0].status, STAGE_STATUS.COMPLETED)
    assert.equal(clarified.stages[1].status, STAGE_STATUS.PENDING)
    assert.equal(runner.runs.length, 1, 'clarification should not auto-run design/coding stages')
    assert.ok(runner.runs[0].command.includes('--print-logs'), 'clarification should enable opencode printed logs')
    assert.equal(runner.runs[0].command[runner.runs[0].command.indexOf('--log-level') + 1], 'DEBUG')

    const persisted = await fixture.store.readWorkOrder(state.id)
    assert.equal(persisted.status, WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT)
    assert.ok(persisted.requirementsPath)
    assert.ok(persisted.handoffPath)
    assert.equal(persisted.stages[0].items[0].label, '需求澄清结果')
    assert.equal(persisted.stages[0].outputs.length, 0)
    assert.ok(!persisted.messages.some((message) => /需求规格说明书/.test(message.content)))
    assert.ok(persisted.messages.some((message) => /准备就绪/.test(message.content)))

    const handoff = await readFile(persisted.handoffPath, 'utf8')
    assert.match(handoff, /# 阶段交接文档/)
    assert.match(handoff, /准备就绪应用/)
    assert.match(handoff, /## 第一阅读项/)
  } finally {
    await fixture.cleanup()
  }
})

test('deferred app shell creation stores title and description without starting clarification', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '不应被调用',
        requirementsMarkdown: '# 不应生成'
      })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: true
    })

    const state = await service.createWorkOrder({
      title: '长应用名称需要完整展示',
      description: '这是创建应用壳时输入的基本描述，用于先登记应用但不触发需求澄清。',
      deferClarification: true
    })

    assert.equal(state.title, '长应用名称需要完整展示')
    assert.equal(state.description, '这是创建应用壳时输入的基本描述，用于先登记应用但不触发需求澄清。')
    assert.equal(state.status, WORK_ORDER_STATUS.CLARIFYING)
    assert.equal(state.awaitingOriginalRequirement, true)
    assert.equal(state.stages[0].items[0].label, '等待原始需求')
    assert.equal(state.stages[0].items[0].value, '请在 AI 研发助手中输入原始需求')
    assert.equal(runner.runs.length, 0, 'deferred app shell must not call opencode before original requirement')

    const persisted = await fixture.store.readWorkOrder(state.id)
    assert.equal(persisted.title, '长应用名称需要完整展示')
    assert.equal(persisted.description, '这是创建应用壳时输入的基本描述，用于先登记应用但不触发需求澄清。')
    assert.equal(persisted.awaitingOriginalRequirement, true)
  } finally {
    await fixture.cleanup()
  }
})

test('deferred app shell clarification prompt includes title description and original requirement', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: false,
        reply: '请补充验收标准',
        requirementsMarkdown: '',
        requirementsItems: {
          detailedRequirements: [],
          businessNecessity: ['需要先登记应用壳'],
          expectedOutcome: ['后续需求澄清上下文完整'],
          targetUsers: '',
          coreFeatures: [],
          inputData: '',
          mainPages: '',
          acceptanceCriteria: []
        },
        title: '舰载任务态势应用'
      })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({
      title: '舰载任务态势应用',
      description: '用于登记舰载任务、风险等级和处置进度的应用。',
      deferClarification: true
    })
    await service.appendUserMessage(state.id, {
      message: '原始需求：需要任务列表、风险筛选、处置倒计时和移动端看板。'
    }, { startClarification: false })
    await service.processClarification(state.id)

    const prompt = runner.runs[0].command.at(-1)
    assert.match(prompt, /舰载任务态势应用/)
    assert.match(prompt, /用于登记舰载任务、风险等级和处置进度的应用/)
    assert.match(prompt, /原始需求：需要任务列表、风险筛选、处置倒计时和移动端看板/)

    const persisted = await fixture.store.readWorkOrder(state.id)
    assert.equal(persisted.awaitingOriginalRequirement, false)
  } finally {
    await fixture.cleanup()
  }
})

test('clarification falls back to deterministic requirements when opencode returns an error event', async () => {
  const fixture = await createFixture()
  try {
    const errorEvent = JSON.stringify({
      type: 'error',
      error: {
        name: 'UnknownError',
        data: {
          message: 'Type validation failed: Value: {"request_id":"req-1","code":"InvalidParameter","message":"Output data may contain inappropriate content."}.'
        }
      }
    })
    const runner = new FakeRunner([
      async (_command, options) => {
        if (options.onStdoutLine) await options.onStdoutLine(errorEvent)
        return { exitCode: 0, stdout: errorEvent, stderr: '' }
      }
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个潮汐窗口仪表盘，展示四个港口和倒计时' }, { startClarification: false })
    const clarified = await service.processClarification(state.id)

    assert.equal(clarified.status, WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT)
    assert.equal(clarified.stages[0].status, STAGE_STATUS.COMPLETED)
    assert.match(clarified.requirementsMarkdown, /潮汐窗口仪表盘/)
    assert.ok(clarified.messages.some((message) => /已基于原始需求生成保底需求摘要/.test(message.content)))

    const requirementsLog = await service.getStageLog(state.id, 'requirements')
    assert.match(requirementsLog.content, /Output data may contain inappropriate content/)
  } finally {
    await fixture.cleanup()
  }
})

test('startDevelopmentRun only launches the pipeline when ready and rejects conflicting states', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 启动按钮需求',
        title: '启动按钮应用'
      }),
      async () => ok('design ok'),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'mock-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}'
        }), 'utf8')
        return ok('coding ok')
      },
      async () => ok('testing prep ok'),
      async () => ok('install ok'),
      async () => ok('build ok'),
      async () => ok('test ok'),
      async () => ok('deployment prep ok')
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4101,
      healthCheck: async () => true
    })

    const state = await service.createWorkOrder({ message: '做一个启动按钮应用' }, { startClarification: false })
    assert.equal(state.status, WORK_ORDER_STATUS.CLARIFYING)

    await assert.rejects(() => service.startDevelopmentRun(state.id), { code: 'CONFLICT' })

    await service.processClarification(state.id)
    const ready = await fixture.store.readWorkOrder(state.id)
    assert.equal(ready.status, WORK_ORDER_STATUS.READY_FOR_DEVELOPMENT)

    const started = await service.startDevelopmentRun(state.id)
    assert.equal(started.status, WORK_ORDER_STATUS.RUNNING)

    await assert.rejects(() => service.startDevelopmentRun(state.id), { code: 'CONFLICT' })

    let deployed
    for (let i = 0; i < 50; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      deployed = await fixture.store.readWorkOrder(state.id)
      if (deployed.status === WORK_ORDER_STATUS.DEPLOYED || deployed.status === WORK_ORDER_STATUS.FAILED) break
    }
    assert.equal(deployed.status, WORK_ORDER_STATUS.DEPLOYED)
    assert.equal(deployed.deploymentUrl, 'http://127.0.0.1:4101')

    await assert.rejects(() => service.startDevelopmentRun(state.id), { code: 'CONFLICT' })

    const events = await fixture.store.readEvents(state.id)
    assert.ok(events.some((event) => event.type === 'development.run.started'))
  } finally {
    await fixture.cleanup()
  }
})

test('startDevelopmentRun on a failed work order is rejected with CONFLICT', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 失败启动需求',
        title: '失败启动应用'
      }),
      async () => ({ exitCode: 1, stdout: '', stderr: 'design exploded' })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个会失败的启动应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.startDevelopmentRun(state.id)

    let failed
    for (let i = 0; i < 50; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      failed = await fixture.store.readWorkOrder(state.id)
      if (failed.status === WORK_ORDER_STATUS.FAILED) break
    }
    assert.equal(failed.status, WORK_ORDER_STATUS.FAILED)

    await assert.rejects(() => service.startDevelopmentRun(state.id), { code: 'CONFLICT' })
  } finally {
    await fixture.cleanup()
  }
})

test('opencode stdout/stderr lines produce assistant.message.append + assistant.message.delta persisted to messages.json', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 流式输出需求',
        title: '流式输出应用'
      }),
      streamingHandler([
        'opencode design line 1',
        'opencode design line 2',
        'opencode design line 3'
      ], { exitCode: 0 })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个流式输出应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.runOpencodePipelineStage(state.id, 'design')

    const events = await fixture.store.readEvents(state.id)
    const appendEvents = events.filter((event) => event.type === 'assistant.message.append')
    const streamAppended = appendEvents.find((event) => event.message?.kind === 'opencode-stream' && event.message?.metadata?.stageKey === 'design')
    assert.ok(streamAppended, 'expected a design-stage opencode-stream message append event')
    assert.equal(streamAppended.message.status, 'STREAMING')
    assert.equal(streamAppended.message.metadata?.stageKey, 'design')

    const deltaEvents = events.filter((event) => event.type === 'assistant.message.delta' && event.messageId === streamAppended.message.id)
    assert.ok(deltaEvents.length >= 3, `expected at least 3 delta events, got ${deltaEvents.length}`)
    assert.equal(deltaEvents.at(-1).status, 'COMPLETED')

    const persisted = await fixture.store.readWorkOrder(state.id)
    const streamMessage = persisted.messages.find((message) => message.id === streamAppended.message.id)
    assert.ok(streamMessage, 'streaming message should be persisted to messages.json')
    assert.equal(streamMessage.kind, 'opencode-stream')
    assert.match(streamMessage.content, /opencode design line 1/)
    assert.match(streamMessage.content, /opencode design line 2/)
    assert.match(streamMessage.content, /opencode design line 3/)
    assert.equal(streamMessage.status, 'COMPLETED')

    const designLog = await service.getStageLog(state.id, 'design')
    assert.match(designLog.content, /opencode design line 1/)
    assert.match(designLog.content, /opencode design line 3/)
  } finally {
    await fixture.cleanup()
  }
})

test('opencode failure marks the streaming message FAILED and keeps stage logs consistent', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 失败流式需求',
        title: '失败流式应用'
      }),
      streamingHandler(['good line 1', 'good line 2'], { exitCode: 1, stderr: ['boom stderr'] })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个失败流式应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await assert.rejects(() => service.runOpencodePipelineStage(state.id, 'design'), /系统设计 failed/)

    const events = await fixture.store.readEvents(state.id)
    const streamAppend = events.find((event) => event.type === 'assistant.message.append' && event.message?.kind === 'opencode-stream' && event.message?.metadata?.stageKey === 'design')
    assert.ok(streamAppend)
    const streamDeltas = events.filter((event) => event.type === 'assistant.message.delta' && event.messageId === streamAppend.message.id)
    assert.equal(streamDeltas.at(-1).status, 'FAILED')

    const persisted = await fixture.store.readWorkOrder(state.id)
    const streamMessage = persisted.messages.find((message) => message.id === streamAppend.message.id)
    assert.equal(streamMessage.status, 'FAILED')
    assert.match(streamMessage.content, /good line 1/)
    assert.match(streamMessage.content, /boom stderr/)

    const designLog = await service.getStageLog(state.id, 'design')
    assert.match(designLog.content, /good line 1/)
    assert.match(designLog.content, /boom stderr/)
    assert.ok(designLog.entries.some((entry) => entry.level === 'ERROR'))
  } finally {
    await fixture.cleanup()
  }
})

test('opencode stage logging writes startup timeout diagnostics and a local diagnostics JSONL file', async () => {
  const fixture = await createFixture()
  try {
    const startedAt = '2026-06-25T09:00:00.000Z'
    const runner = new FakeRunner([
      async (command, options) => {
        await options.onStart?.({
          pid: 4321,
          cwd: options.cwd,
          timeoutMs: options.timeoutMs,
          startedAt
        })
        return {
          exitCode: 124,
          stdout: '',
          stderr: '',
          timedOut: true,
          diagnostics: {
            pid: 4321,
            cwd: options.cwd,
            timeoutMs: options.timeoutMs,
            startedAt,
            endedAt: '2026-06-25T09:15:00.000Z',
            lastOutputAt: null,
            idleMs: 900000,
            signal: 'SIGTERM',
            stdout: { bytes: 0, lineCount: 0 },
            stderr: { bytes: 0, lineCount: 0 },
            outputEvents: []
          }
        }
      }
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })
    const state = await service.createWorkOrder({ message: '做一个超时诊断应用' }, { startClarification: false })

    const result = await service.runCommandWithStageLogging(state.id, 'requirements', {
      label: '需求澄清',
      command: ['opencode', 'run', '--format', 'json', '--dir', state.appDir, 'prompt apiKey="secret-value"'],
      cwd: state.appDir,
      timeoutMs: 15 * 60 * 1000,
      source: 'opencode'
    })

    assert.equal(result.exitCode, 124)
    const requirementsLog = await service.getStageLog(state.id, 'requirements')
    assert.match(requirementsLog.content, /pid=4321/)
    assert.match(requirementsLog.content, /timeoutMs=900000/)
    assert.match(requirementsLog.content, /\[prompt omitted\]/)
    assert.match(requirementsLog.content, /opencode 已启动但未产生可读输出/)
    assert.match(requirementsLog.content, /timedOut=true/)
    assert.match(requirementsLog.content, /idleMs=900000/)
    assert.doesNotMatch(requirementsLog.content, /secret-value/)

    const diagnosticsPath = path.join(fixture.store.getWorkOrderDir(state.id), 'opencode-diagnostics.jsonl')
    const diagnostics = JSON.parse((await readFile(diagnosticsPath, 'utf8')).trim())
    assert.equal(diagnostics.stageKey, 'requirements')
    assert.equal(diagnostics.pid, 4321)
    assert.equal(diagnostics.cwd, state.appDir)
    assert.equal(diagnostics.timeoutMs, 15 * 60 * 1000)
    assert.equal(diagnostics.startedAt, startedAt)
    assert.equal(diagnostics.lastOutputAt, null)
    assert.equal(diagnostics.exitCode, 124)
    assert.equal(diagnostics.timedOut, true)
    assert.equal(diagnostics.stdoutBytes, 0)
    assert.equal(diagnostics.stderrBytes, 0)
    assert.match(diagnostics.opencodeLogDir, /opencode\/log$/)
    assert.match(diagnostics.command, /\[prompt omitted\]/)
    assert.doesNotMatch(JSON.stringify(diagnostics), /secret-value/)
  } finally {
    await fixture.cleanup()
  }
})

test('opencode stderr diagnostics are logged with sensitive fields redacted', async () => {
  const fixture = await createFixture()
  try {
    const stderrLines = [
      'DEBUG authorization: Bearer secret-token',
      'ERROR apiKey="secret-value"'
    ]
    const runner = new FakeRunner([
      async (_command, options) => {
        await options.onStart?.({
          pid: 4322,
          cwd: options.cwd,
          timeoutMs: options.timeoutMs,
          startedAt: '2026-06-25T09:00:00.000Z'
        })
        for (const line of stderrLines) {
          await options.onStderrLine?.(line)
        }
        return {
          exitCode: 0,
          stdout: '',
          stderr: stderrLines.join('\n'),
          timedOut: false,
          diagnostics: {
            pid: 4322,
            cwd: options.cwd,
            timeoutMs: options.timeoutMs,
            startedAt: '2026-06-25T09:00:00.000Z',
            endedAt: '2026-06-25T09:00:01.000Z',
            lastOutputAt: '2026-06-25T09:00:01.000Z',
            idleMs: 0,
            signal: null,
            stdout: { bytes: 0, lineCount: 0 },
            stderr: { bytes: Buffer.byteLength(stderrLines.join('\n')), lineCount: 2 },
            outputEvents: []
          }
        }
      }
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })
    const state = await service.createWorkOrder({ message: '做一个脱敏日志应用' }, { startClarification: false })

    await service.runCommandWithStageLogging(state.id, 'requirements', {
      label: '需求澄清',
      command: ['opencode', 'run', '--format', 'json', '--dir', state.appDir, 'prompt'],
      cwd: state.appDir,
      timeoutMs: 15 * 60 * 1000,
      source: 'opencode'
    })

    const requirementsLog = await service.getStageLog(state.id, 'requirements')
    assert.match(requirementsLog.content, /DEBUG authorization: \[REDACTED\]/)
    assert.match(requirementsLog.content, /ERROR apiKey="\[REDACTED\]"/)
    assert.doesNotMatch(requirementsLog.content, /secret-token/)
    assert.doesNotMatch(requirementsLog.content, /secret-value/)
  } finally {
    await fixture.cleanup()
  }
})

test('install/build/test commands only write to stage logs and never create opencode-stream messages', async () => {
  const fixture = await createFixture()
  try {
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# 非opencode需求',
        title: '非opencode应用'
      }),
      streamingHandler(['design ok'], { exitCode: 0 }),
      async (_command, options) => {
        await writeFile(path.join(options.cwd, 'factory.manifest.json'), JSON.stringify({
          name: 'mock-app',
          install: ['node', '--version'],
          build: ['node', '--version'],
          test: ['node', '--version'],
          start: ['node', 'server.js', '--port', '${PORT}'],
          healthUrl: 'http://127.0.0.1:${PORT}'
        }), 'utf8')
        return ok('coding ok')
      },
      streamingHandler(['testing prep ok'], { exitCode: 0 }),
      streamingHandler(['install ok'], { exitCode: 0 }),
      streamingHandler(['build ok'], { exitCode: 0 }),
      streamingHandler(['test ok'], { exitCode: 0 }),
      streamingHandler(['deployment prep ok'], { exitCode: 0 })
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false,
      allocatePort: async () => 4102,
      healthCheck: async () => true
    })

    const state = await service.createWorkOrder({ message: '做一个非opencode应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.runPipeline(state.id)

    const events = await fixture.store.readEvents(state.id)
    const streamAppends = events.filter((event) => event.type === 'assistant.message.append' && event.message?.kind === 'opencode-stream')
    const streamStages = new Set(streamAppends.map((event) => event.message.metadata?.stageKey))
    assert.deepEqual([...streamStages].sort(), ['coding', 'deployment', 'design', 'requirements', 'testing'])

    const persisted = await fixture.store.readWorkOrder(state.id)
    const streamMessages = persisted.messages.filter((message) => message.kind === 'opencode-stream')
    assert.equal(streamMessages.length, 5)

    const testingLog = await service.getStageLog(state.id, 'testing')
    assert.match(testingLog.content, /install ok/)
    assert.match(testingLog.content, /build ok/)
    assert.match(testingLog.content, /test ok/)
  } finally {
    await fixture.cleanup()
  }
})

test('buildOpencodeCommand adds --thinking flag when thinking option is true', () => {
  const base = buildOpencodeCommand('prompt', '/tmp/app', { thinking: false })
  assert.ok(!base.includes('--thinking'), 'should not include --thinking when thinking is false')

  const withThinking = buildOpencodeCommand('prompt', '/tmp/app', { thinking: true })
  assert.ok(withThinking.includes('--thinking'), 'should include --thinking when thinking is true')
})

test('buildOpencodeCommand adds print logs and DEBUG log level when diagnostics are enabled', () => {
  const command = buildOpencodeCommand('prompt', '/tmp/app', { diagnostics: true })

  assert.ok(command.includes('--print-logs'), 'should ask opencode to print local logs to stderr')
  assert.ok(command.includes('--log-level'), 'should set opencode log level')
  assert.equal(command[command.indexOf('--log-level') + 1], 'DEBUG')
  assert.equal(command.at(-1), 'prompt')
})

test('coding prompt requires Python dependencies to use a project virtual environment', () => {
  const prompt = createStagePrompt({
    stageKey: 'coding',
    title: 'Python 应用',
    requirementsMarkdown: '# Python 应用需求'
  })

  assert.match(prompt, /项目内.*虚拟环境/)
  assert.match(prompt, /不得.*(?:pip|系统).*安装/)
})

test('coding prompt requires manifest commands to target subproject directories explicitly', () => {
  const prompt = createStagePrompt({
    stageKey: 'coding',
    title: '前后端分离应用',
    requirementsMarkdown: '# 前后端分离应用需求'
  })

  assert.match(prompt, /子项目目录/)
  assert.match(prompt, /npm.*--prefix/)
  assert.match(prompt, /healthUrl.*appUrl/s)
  assert.match(prompt, /用户应访问的前端地址/)
})

test('stage prompt requires handoff.md as first reading item before full context fallback', () => {
  const prompt = createStagePrompt({
    stageKey: 'design',
    title: '交接应用',
    requirementsMarkdown: '# 交接应用需求'
  })

  assert.match(prompt, /第一阅读项.*handoff\.md/s)
  assert.match(prompt, /handoff\.md.*不存在.*requirements\.md/s)
  assert.match(prompt, /不要向用户请求.*是否继续/s)
})

test('opencode JSON events are parsed: only text/thinking content and tool summaries appear in stream message', async () => {
  const fixture = await createFixture()
  try {
    const jsonEvents = [
      JSON.stringify({ type: 'step_start', part: { type: 'step-start', id: 'p1' } }),
      JSON.stringify({ type: 'thinking', part: { type: 'thinking', text: 'Let me plan the design.' } }),
      JSON.stringify({ type: 'text', part: { type: 'text', text: 'I will create the theme file.' } }),
      JSON.stringify({ type: 'tool_use', part: { type: 'tool', tool: 'bash', state: { input: { command: 'npm install', description: 'Install dependencies' } } } }),
      JSON.stringify({ type: 'tool_use', part: { type: 'tool', tool: 'edit', state: { input: { path: 'src/App.vue' } } } }),
      JSON.stringify({ type: 'step_finish', part: { type: 'step-finish', reason: 'tool-calls' } }),
      'a non-JSON stderr line'
    ]
    const runner = new FakeRunner([
      clarificationHandler({
        complete: true,
        reply: '需求已确认。',
        requirementsMarkdown: '# JSON 事件需求',
        title: 'JSON事件应用'
      }),
      async (_command, options) => {
        for (const line of jsonEvents) {
          if (options.onStdoutLine) await options.onStdoutLine(line)
        }
        if (options.onStderrLine) await options.onStderrLine(jsonEvents[6])
        return { exitCode: 0, stdout: jsonEvents.slice(0, 6).join('\n'), stderr: jsonEvents[6] }
      }
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个 JSON 事件应用' }, { startClarification: false })
    await service.processClarification(state.id)
    await service.runOpencodePipelineStage(state.id, 'design')

    const persisted = await fixture.store.readWorkOrder(state.id)
    const streamMessage = persisted.messages.find((message) => message.kind === 'opencode-stream' && message.metadata?.stageKey === 'design')
    assert.ok(streamMessage, 'design-stage opencode-stream message should exist')

    assert.match(streamMessage.content, /Let me plan the design\./)
    assert.match(streamMessage.content, /I will create the theme file\./)
    assert.match(streamMessage.content, /▸ 执行 bash: Install dependencies/)
    assert.match(streamMessage.content, /▸ 执行 edit: src\/App\.vue/)
    assert.match(streamMessage.content, /a non-JSON stderr line/)

    assert.doesNotMatch(streamMessage.content, /step_start/)
    assert.doesNotMatch(streamMessage.content, /step_finish/)
    assert.doesNotMatch(streamMessage.content, /"type":"tool"/)

    assert.equal(streamMessage.metadata.activity, null)
    assert.equal(streamMessage.status, 'COMPLETED')

    const events = await fixture.store.readEvents(state.id)
    const deltaEvents = events.filter((event) => event.type === 'assistant.message.delta' && event.messageId === streamMessage.id)
    const toolDelta = deltaEvents.find((event) => event.metadata?.activity === 'tool')
    assert.ok(toolDelta, 'expected a delta event with activity=tool')
    assert.equal(toolDelta.metadata.tool, 'bash')
    assert.equal(toolDelta.metadata.toolDescription, 'Install dependencies')

    const designLog = await service.getStageLog(state.id, 'design')
    assert.match(designLog.content, /step_start/)
    assert.match(designLog.content, /"type":"tool"/)
    assert.match(designLog.content, /a non-JSON stderr line/)
  } finally {
    await fixture.cleanup()
  }
})

test('clarification stage skips text events that look like JSON response', async () => {
  const fixture = await createFixture()
  try {
    const clarificationJson = JSON.stringify({
      complete: true,
      reply: '需求已确认。',
      requirementsMarkdown: '# 澄清跳过需求',
      title: '澄清跳过应用'
    })
    const events = [
      JSON.stringify({ type: 'step_start', part: { type: 'step-start' } }),
      JSON.stringify({ type: 'text', part: { type: 'text', text: clarificationJson } }),
      JSON.stringify({ type: 'step_finish', part: { type: 'step-finish' } })
    ]
    const runner = new FakeRunner([
      async (_command, options) => {
        for (const line of events) {
          if (options.onStdoutLine) await options.onStdoutLine(line)
        }
        return { exitCode: 0, stdout: events.join('\n'), stderr: '' }
      }
    ])
    const service = new WorkOrderService({
      store: fixture.store,
      eventBus: fixture.eventBus,
      runner,
      autoStart: false
    })

    const state = await service.createWorkOrder({ message: '做一个澄清跳过应用' }, { startClarification: false })
    await service.processClarification(state.id)

    const persisted = await fixture.store.readWorkOrder(state.id)
    const streamMessage = persisted.messages.find((message) => message.kind === 'opencode-stream' && message.metadata?.stageKey === 'requirements')
    assert.ok(streamMessage, 'requirements-stage opencode-stream message should exist')
    assert.equal(streamMessage.content, '', 'clarification JSON text should be skipped, content should be empty')
    assert.doesNotMatch(streamMessage.content, /complete/)
    assert.equal(streamMessage.status, 'COMPLETED')
  } finally {
    await fixture.cleanup()
  }
})

test('summarizeCommandResult returns a readable timeout message when timedOut is true', () => {
  const summary = summarizeCommandResult({ exitCode: 124, stdout: '{"type":"text"}', stderr: '', timedOut: true })
  assert.match(summary, /执行超时/)
  assert.match(summary, /124/)
})

test('summarizeCommandResult parses opencode JSON events into readable summary', () => {
  const stdout = [
    JSON.stringify({ type: 'step_start', part: { type: 'step-start' } }),
    JSON.stringify({ type: 'thinking', part: { type: 'thinking', text: 'Planning the design.' } }),
    JSON.stringify({ type: 'text', part: { type: 'text', text: 'Creating theme file.' } }),
    JSON.stringify({ type: 'tool_use', part: { type: 'tool', tool: 'bash', state: { input: { command: 'npm install', description: 'Install deps' } } } }),
    JSON.stringify({ type: 'step_finish', part: { type: 'step-finish' } })
  ].join('\n')
  const summary = summarizeCommandResult({ exitCode: 0, stdout, stderr: '', timedOut: false })
  assert.match(summary, /Planning the design\./)
  assert.match(summary, /Creating theme file\./)
  assert.match(summary, /▸ 执行 bash: Install deps/)
  assert.doesNotMatch(summary, /step_start/)
  assert.doesNotMatch(summary, /step_finish/)
  assert.doesNotMatch(summary, /"type":"tool"/)
})

test('summarizeCommandResult keeps non-JSON lines as-is', () => {
  const summary = summarizeCommandResult({ exitCode: 1, stdout: 'plain line 1\nplain line 2', stderr: 'boom stderr', timedOut: false })
  assert.match(summary, /plain line 1/)
  assert.match(summary, /plain line 2/)
  assert.match(summary, /boom stderr/)
})

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'factory-backend-'))
  const store = new WorkOrderStore({
    rootDir: path.join(root, 'work-orders'),
    requirementsDir: path.join(root, 'requirements')
  })
  const eventBus = new WorkOrderEventBus()
  await store.init()
  return {
    root,
    store,
    eventBus,
    cleanup: () => rm(root, { recursive: true, force: true })
  }
}

function ok(stdout = '') {
  return { exitCode: 0, stdout, stderr: '' }
}

class FakeRunner {
  constructor(handlers = []) {
    this.handlers = handlers
    this.runs = []
    this.starts = []
  }

  async run(command, options = {}) {
    this.runs.push({ command, options })
    const handler = this.handlers[this.runs.length - 1]
    if (handler) return handler(command, options)
    return ok('')
  }

  start(command, options = {}) {
    this.starts.push({ command, options })
    return {
      killed: false,
      kill() {
        this.killed = true
      },
      stdout: { on() {} },
      stderr: { on() {} }
    }
  }
}

function streamingHandler(lines, { exitCode = 0, stderr = [] } = {}) {
  return async (_command, options) => {
    for (const line of lines) {
      if (options.onStdoutLine) await options.onStdoutLine(line)
    }
    for (const line of stderr) {
      if (options.onStderrLine) await options.onStderrLine(line)
    }
    return { exitCode, stdout: lines.join('\n'), stderr: stderr.join('\n') }
  }
}

function clarificationHandler(payload) {
  return async () => ok(JSON.stringify(payload))
}

class FakeResponse extends EventEmitter {
  constructor() {
    super()
    this.chunks = []
    this.headers = {}
  }

  setHeader(name, value) {
    this.headers[name] = value
  }

  write(chunk) {
    this.chunks.push(chunk)
  }
}
