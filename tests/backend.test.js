import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { WorkOrderStore } from '../server/lib/store.js'
import { WorkOrderEventBus } from '../server/lib/events.js'
import { WorkOrderService } from '../server/lib/orchestrator.js'
import { parseClarificationResponse } from '../server/lib/opencode.js'
import { substitutePortInCommand, substitutePortInUrl, validateManifest } from '../server/lib/manifest.js'
import { STAGE_STATUS, WORK_ORDER_STATUS } from '../server/lib/stages.js'

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
    title: '潮汐应用'
  })
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
    await service.emit(state.id, 'stage.updated', { ok: true })

    const events = await fixture.store.readEvents(state.id)
    assert.equal(events.at(-1).type, 'stage.updated')
    assert.match(response.chunks.join(''), /event: stage\.updated/)
  } finally {
    await fixture.cleanup()
  }
})

test('validates manifest command arrays and substitutes deployment port', () => {
  const manifest = validateManifest({
    name: 'demo',
    install: ['npm', 'install'],
    build: ['npm', 'run', 'build'],
    test: ['npm', 'test'],
    start: ['npm', 'run', 'preview', '--', '--port', '${PORT}'],
    healthUrl: 'http://127.0.0.1:${PORT}'
  })

  assert.deepEqual(substitutePortInCommand(manifest.start, 4101), ['npm', 'run', 'preview', '--', '--port', '4101'])
  assert.equal(substitutePortInUrl(manifest.healthUrl, 4101), 'http://127.0.0.1:4101')
  assert.throws(() => validateManifest({ ...manifest, test: 'npm test' }), /command array/)
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

    const state = await service.createWorkOrder({ message: '做一个测试应用' }, { startClarification: false })
    await service.processClarification(state.id, { startPipeline: false })
    const completed = await service.runPipeline(state.id)

    assert.equal(completed.status, WORK_ORDER_STATUS.COMPLETED)
    assert.equal(completed.deploymentUrl, 'http://127.0.0.1:4101')
    assert.equal(completed.stages.every((stage) => stage.status === STAGE_STATUS.COMPLETED), true)
    assert.deepEqual(runner.starts[0].command, ['node', 'server.js', '--port', '4101'])
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
