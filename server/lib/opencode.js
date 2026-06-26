import path from 'node:path'

export function buildOpencodeCommand(prompt, appDir, { thinking = false, diagnostics = false, model = null, agent = null } = {}) {
  const command = [
    'opencode',
    'run',
    '--format',
    'json'
  ]
  if (diagnostics) {
    command.push('--print-logs', '--log-level', 'DEBUG')
  }
  if (thinking) {
    command.push('--thinking')
  }
  const selectedModel = String(model || '').trim()
  if (selectedModel) {
    command.push('--model', selectedModel)
  }
  const selectedAgent = String(agent || '').trim()
  if (selectedAgent) {
    command.push('--agent', selectedAgent)
  }
  command.push('--dangerously-skip-permissions', '--dir', path.resolve(appDir), prompt)
  return command
}

export function createClarificationPrompt(messages, context = {}) {
  const conversation = messages
    .filter(isClarificationConversationMessage)
    .map((message) => `${getMessageSenderLabel(message)}: ${getMessageText(message)}`)
    .join('\n')
  const title = String(context.title || '').trim()
  const description = String(context.description || '').trim()
  const appContext = title || description
    ? [
      '当前应用初始信息：',
      title ? `- 应用标题：${title}` : '',
      description ? `- 基本描述：${description}` : '',
      ''
    ].filter(Boolean).join('\n')
    : ''

  return `你是AI 研发助手的「需求分析 Agent」，负责根据用户原始需求判断是否足够进入自动研发流水线。

  你的目标不是审问用户，而是在用户需求基础上进行专业分析扩展，深化理解用户输入场景，帮助用户把模糊想法转化为可研发、可验收的需求。回复应主要展示你对业务场景的深化理解，并形成多条细化需求。

分析时请主动补充以下内容：

业务目标：用户想解决什么问题、达成什么结果；
目标用户：系统主要服务哪些角色；
核心流程：用户如何完成主要业务操作；
功能边界：哪些能力适合作为 MVP，哪些可后续扩展；
数据与交互：需要哪些输入数据、页面或交互方式；
验收与成效：尽量转化为可观测或可量化结果。

每条细化需求都必须包含：

需求内容：具体业务场景或系统能力；
业务需求必要性：说明该需求为什么重要；
预期成效：优先使用可观测或可量化描述。

尽量不要向用户提问题。只有当关键业务目标、使用对象或核心流程完全无法判断时，才在细化需求之后补充 1-2 个关键问题；禁止只输出追问。
条目化展示必须有清晰换行：每条细化需求内部使用 \\n 分隔“需求内容 / 业务需求必要性 / 预期成效”，每条细化需求之间必须用 \\n\\n 分隔，方便用户阅读理解。

必须只输出一个 JSON 对象，不要在 JSON 外输出 Markdown，不要输出额外解释。所有字符串里的换行必须写成 \\n，不能在字符串字面量中直接换行。结构如下：
{
  "complete": boolean,
  "reply": "必须以“我对需求场景的理解如下：”开头，随后输出多条细化需求。每条按“1. 需求内容：...\\n业务需求必要性：...\\n预期成效：...”格式输出，条目之间用 \\n\\n 分隔；末尾用一句话提示用户确认或补充，不要优先提问题",
  "requirementsMarkdown": "complete=true 时输出完整需求规格说明书 Markdown；否则为空字符串",
  "requirementsItems": {
    "detailedRequirements": [
      {
        "requirement": "细化需求内容，描述具体业务场景和能力",
        "businessNecessity": "该细化需求的业务必要性分析",
        "expectedOutcome": "该细化需求的预期成效分析"
      }
    ],
    "businessNecessity": ["无论 complete=true 还是 false，都尽量输出 2-5 条业务需求必要性条目；信息不确定时以初步判断表述"],
    "expectedOutcome": ["无论 complete=true 还是 false，都尽量输出 2-5 条预期成效条目；优先使用可量化或可观测指标"],
    "targetUsers": "已明确时输出目标用户角色描述；否则为空字符串",
    "coreFeatures": ["已明确时输出 3-8 条核心功能条目；否则为空数组"],
    "inputData": "已明确时输出主要输入数据来源说明；否则为空字符串",
    "mainPages": "已明确时输出主要页面或交互说明；否则为空字符串",
    "acceptanceCriteria": ["已明确时输出 2-6 条验收标准条目；否则为空数组"]
  },
  "title": "不超过 24 个中文字符的应用名称"
}

进入流水线的最低条件：目标用户、核心功能、输入数据、主要页面或交互、验收标准基本清楚。若缺少关键信息，complete=false，但仍要先输出场景深化理解和多条细化需求；最多只补充 1-2 个关键问题。complete=true 时 requirementsItems 中的 detailedRequirements 至少包含 2 条，且每条 requirement、businessNecessity、expectedOutcome 都不能为空，否则视为需求分析未完成。

${appContext}当前对话：
${conversation}`
}

function isClarificationConversationMessage(message) {
  if (!message || typeof message !== 'object') return false
  if (message.kind === 'opencode-stream') return false
  if (message.stageId) return false
  if (message.phase && message.phase !== 'clarification') return false
  const sender = String(message.sender || message.role || '').trim()
  if (!['user', 'ai', 'assistant'].includes(sender)) return false
  return getMessageText(message).length > 0
}

function getMessageSenderLabel(message) {
  const sender = String(message.sender || message.role || '').trim()
  return sender === 'user' ? '用户' : 'AI'
}

function getMessageText(message) {
  return String(message.text || message.content || '').trim()
}

export function createStagePrompt({ stageKey, title, userInput, requirementsMarkdown }) {
  const shared = `你正在 .runtime/work-orders/<id>/app 目录中为「${title}」生成一个可本机运行的软件应用。
阶段上下文读取规则：
- 禁止读取 .runtime/work-orders/<id>/ 目录以外的文件
- 第一阅读项必须是 app 根目录的 handoff.md。
- 如果 handoff.md 不存在或信息不足，再结合下方原始用户需求与当前项目（路径是.runtime/work-orders/<id>）完整上下文。
- 不要读取或依赖 requirements.md、docs/design.md 等需求/设计文档文件；本工单不落盘这些文档，仅以原始用户需求为准。
- 进入开发阶段后不要向用户请求“是否继续”；以不中断流水线为主要目标，自行修复可恢复的问题。
- 只有超过系统重试上限、缺少外部凭据、需要破坏性操作或无法在本机范围内处理时，才明确失败退出。

原始用户需求如下：

${userInput || '(无额外原始需求)'}

硬性要求：
- 只在当前工作目录内创建或修改文件。
- 第一版必须可通过本机命令安装、构建、测试并启动。
- 设计/编码完成后必须生成 factory.manifest.json。
- factory.manifest.json 中 install/build/test/start 必须是命令参数数组，不能是 shell 字符串。
- manifest 命令始终从 app 根目录执行；若源码位于子项目目录，命令必须显式指定子项目目录，例如使用 npm --prefix frontend run build，而不能假设当前目录中存在 package.json。
- 若项目包含 Python 依赖，必须使用项目内虚拟环境（如 .venv）安装和运行依赖。不得直接用系统 pip 安装，也不得使用 --break-system-packages；请提供创建 .venv 并调用 .venv/bin/pip 的项目脚本，测试和启动命令也必须使用该虚拟环境中的 Python 工具。
- start 命令中端口使用 "\${PORT}" 占位符，健康检查使用 healthUrl。若 healthUrl 指向 API 或健康检查路径，请同时提供 appUrl 作为用户应访问的前端地址。
- 不要依赖远程部署服务。`

  if (stageKey === 'design') {
    return `${shared}

当前阶段：系统设计。
请输出可指导后续编码和质检的设计思路（仅用于本次阶段思考，不要写入 docs/design.md 或任何需求/设计文档文件）。若已有代码请保持兼容。
设计思路必须包含：
- 用户旅程：核心角色如何从进入页面到完成关键任务。
- 页面结构：主要页面、布局区域、导航关系和关键交互状态。
- 技术方案：框架、目录结构、核心模块、构建和本机启动策略。
- 数据结构：关键实体、字段、状态枚举、示例数据和本地持久化方式。
- 验收场景：至少 3 条可执行验收路径。
- Playwright 端到端测试计划：Web/浏览器应用必须覆盖核心用户路径；若不是浏览器应用，说明等价自动化测试方案和原因。`
  }

  if (stageKey === 'coding') {
    return `${shared}

当前阶段：智能编码。
请根据上方原始用户需求，生成可运行 MVP、真实交互和可访问 UI，避免只交付静态占位页面。
请生成完整应用代码、必要测试、package.json，并确保 factory.manifest.json 至少包含：
{
  "name": "app-name",
  "install": ["npm", "install"],
  "build": ["npm", "run", "build"],
  "test": ["npm", "test"],
  "start": ["npm", "run", "preview", "--", "--host", "127.0.0.1", "--port", "\${PORT}"],
  "healthUrl": "http://127.0.0.1:\${PORT}",
  "appUrl": "http://127.0.0.1:\${PORT}"
}`
  }

  if (stageKey === 'testing') {
    return `${shared}

当前阶段：测试质检。
请优先补齐并执行 Playwright 端到端测试，覆盖核心用户路径、主要表单/按钮交互、错误或空状态，以及页面可访问性基础行为。
保证 manifest 中的 build/test 命令能通过。不要删除有价值的测试，不要以跳过或弱化断言代替修复。不要启动长期运行进程。
若生成物不是 Web/浏览器应用，请补齐等价自动化测试，并在 handoff.md 说明未使用 Playwright 的原因。`
  }

  if (stageKey === 'deployment') {
    return `${shared}

当前阶段：部署交付准备。
请检查启动脚本、健康检查路径和 manifest 是否适合本机部署。不要启动长期运行进程。
必须确认 manifest.appUrl 指向用户可打开的真实前端页面，而不是 /api/health、/health 或其他健康检查接口；healthUrl 只用于后端探活。`
  }

  return shared
}

export function createTestingRepairPrompt({
  title,
  userInput,
  attempt,
  maxAttempts,
  failedLabel,
  failedCommand,
  logSummary,
  repairContextPath
}) {
  const shared = createStagePrompt({
    stageKey: 'coding',
    title,
    userInput
  })
  return `${shared}

当前阶段：智能编码/修复。
测试质检未通过，正在进行第 ${attempt}/${maxAttempts} 次自动返修。

第一阅读项：
- handoff.md
- ${repairContextPath}

失败命令：
- 步骤：${failedLabel}
- 命令：${Array.isArray(failedCommand) ? failedCommand.map((part) => JSON.stringify(part)).join(' ') : String(failedCommand || '')}

失败日志摘要：
${logSummary || '<empty>'}

修复要求：
- 读取 handoff.md 与 ${repairContextPath} 后定位失败原因。
- 可以修改源码、测试、依赖脚本、factory.manifest.json 或本机启动脚本。
- 修复后不要启动长期运行进程，不要部署。
- 保留并修复 Playwright 端到端测试；不允许绕过测试，不要删除有价值的测试，不要使用破坏系统环境的参数。
- 完成后更新 handoff.md，说明修复内容和下一步质检注意事项。`
}

export function parseClarificationResponse(output) {
  const textOutput = extractTextFieldsFromJsonLines(output)
  const strictCandidates = [
    ...collectClarificationCandidates(output),
    ...collectClarificationCandidates(textOutput)
  ]
  const fallbackCandidates = [
    parseLenientClarificationObject(textOutput),
    parsePlainRequirementsMarkdown(textOutput)
  ].filter(Boolean)
  const match = strictCandidates.reverse().find(isClarificationObject) || fallbackCandidates.find(isClarificationObject)
  if (!match) {
    const opencodeErrorMessage = extractOpencodeErrorMessage(output)
    if (opencodeErrorMessage) {
      const error = new Error(`Opencode returned an error while generating clarification: ${opencodeErrorMessage}`)
      error.code = 'OPENCODE_OUTPUT_ERROR'
      error.opencodeErrorMessage = opencodeErrorMessage
      throw error
    }
    throw new Error('Unable to parse clarification JSON from opencode output')
  }
  const requirementsMarkdown = String(match.requirementsMarkdown || '').trim()
  const requirementsItems = normalizeRequirementsItems(match.requirementsItems, requirementsMarkdown, match)
  return {
    complete: Boolean(match.complete),
    reply: String(match.reply || '').trim(),
    requirementsMarkdown,
    requirementsItems,
    title: String(match.title || '').trim()
  }
}

function normalizeRequirementsItems(rawItems, requirementsMarkdown, match) {
  if (rawItems && typeof rawItems === 'object' && !Array.isArray(rawItems)) {
    const items = {
      detailedRequirements: toDetailedRequirementArray(rawItems.detailedRequirements),
      businessNecessity: toStringArray(rawItems.businessNecessity),
      expectedOutcome: toStringArray(rawItems.expectedOutcome),
      targetUsers: String(rawItems.targetUsers || '').trim(),
      coreFeatures: toStringArray(rawItems.coreFeatures),
      inputData: String(rawItems.inputData || '').trim(),
      mainPages: String(rawItems.mainPages || '').trim(),
      acceptanceCriteria: toStringArray(rawItems.acceptanceCriteria)
    }
    if (items.businessNecessity.length === 0 || items.expectedOutcome.length === 0) {
      const extracted = extractItemsFromMarkdown(requirementsMarkdown)
      if (items.businessNecessity.length === 0) items.businessNecessity = extracted.businessNecessity
      if (items.expectedOutcome.length === 0) items.expectedOutcome = extracted.expectedOutcome
      if (!items.targetUsers) items.targetUsers = extracted.targetUsers
      if (items.coreFeatures.length === 0) items.coreFeatures = extracted.coreFeatures
      if (!items.inputData) items.inputData = extracted.inputData
      if (!items.mainPages) items.mainPages = extracted.mainPages
      if (items.acceptanceCriteria.length === 0) items.acceptanceCriteria = extracted.acceptanceCriteria
    }
    return items
  }
  return extractItemsFromMarkdown(requirementsMarkdown, match)
}

function toStringArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0)
}

function toDetailedRequirementArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        const requirement = String(item ?? '').trim()
        return requirement ? { requirement, businessNecessity: '', expectedOutcome: '' } : null
      }
      const requirement = String(item.requirement || item.name || item.title || item.description || '').trim()
      const businessNecessity = String(item.businessNecessity || item.necessity || item.businessValue || '').trim()
      const expectedOutcome = String(item.expectedOutcome || item.outcome || item.effect || '').trim()
      if (!requirement && !businessNecessity && !expectedOutcome) return null
      return { requirement, businessNecessity, expectedOutcome }
    })
    .filter(Boolean)
}

function extractItemsFromMarkdown(markdown, match) {
  const text = String(markdown || '').trim()
  const items = {
    detailedRequirements: [],
    businessNecessity: [],
    expectedOutcome: [],
    targetUsers: '',
    coreFeatures: [],
    inputData: '',
    mainPages: '',
    acceptanceCriteria: []
  }
  if (!text) return items
  const sections = splitMarkdownSections(text)
  const lookup = (keywords) => {
    for (const keyword of keywords) {
      for (const section of sections) {
        if (section.heading.includes(keyword)) {
          return section.items.length > 0 ? section.items : [section.body.trim()].filter(Boolean)
        }
      }
    }
    return []
  }
  items.businessNecessity = lookup(['业务需求必要性', '业务必要性', '必要性', '业务价值', '业务背景'])
  items.expectedOutcome = lookup(['预期成效', '预期效果', '成效', '预期目标', '目标成效'])
  items.coreFeatures = lookup(['核心功能', '功能需求', '功能列表', '主要功能'])
  items.acceptanceCriteria = lookup(['验收标准', '验收口径', '验收'])
  const scalarLookup = (keywords) => {
    for (const keyword of keywords) {
      for (const section of sections) {
        if (section.heading.includes(keyword)) {
          return section.body.trim() || (section.items[0] || '')
        }
      }
    }
    return ''
  }
  items.targetUsers = scalarLookup(['目标用户', '用户角色', '使用对象'])
  items.inputData = scalarLookup(['输入数据', '数据来源', '数据源'])
  items.mainPages = scalarLookup(['主要页面', '页面交互', '页面', '交互'])
  if (items.businessNecessity.length === 0 && match?.title) {
    items.businessNecessity = [`建设「${match.title}」以解决业务痛点`]
  }
  return items
}

export function extractOpencodeErrorMessage(output) {
  for (const line of String(output || '').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const message = readOpencodeErrorMessage(JSON.parse(trimmed))
      if (message) return message
    } catch {
      // opencode can mix non-JSON lines with JSON events.
    }
  }
  return ''
}

function readOpencodeErrorMessage(event) {
  if (!event || typeof event !== 'object' || event.type !== 'error') return ''
  const rawMessage = event.error?.data?.message || event.error?.message || event.message || ''
  if (!rawMessage) return event.error?.name || 'Unknown opencode error'

  for (const candidate of balancedJsonObjectStrings(rawMessage)) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && parsed.code && parsed.message) {
        return `${parsed.code}: ${parsed.message}`
      }
    } catch {
      // Ignore malformed nested error objects.
    }
  }

  return String(rawMessage).split('\n')[0].trim()
}

function splitMarkdownSections(markdown) {
  const lines = String(markdown || '').split(/\r?\n/)
  const sections = []
  let current = null
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      current = { heading: heading[1].trim(), body: '', items: [] }
      sections.push(current)
      continue
    }
    if (!current) {
      current = { heading: '', body: '', items: [] }
      sections.push(current)
    }
    const listItem = line.match(/^\s*[-*+]\s+(.*)$/)
    if (listItem) {
      current.items.push(listItem[1].trim())
    } else if (line.trim()) {
      current.body = current.body ? `${current.body}\n${line}` : line
    }
  }
  return sections
}

function isClarificationObject(value) {
  return value && typeof value === 'object' && Object.hasOwn(value, 'complete') && Object.hasOwn(value, 'reply')
}

function collectClarificationCandidates(text) {
  const raw = String(text || '').trim()
  const candidates = []
  if (!raw) return candidates

  try {
    candidates.push(JSON.parse(raw))
  } catch {
    // Fall through to fenced and balanced-object parsing.
  }

  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi
  for (const match of raw.matchAll(fencePattern)) {
    try {
      candidates.push(JSON.parse(match[1].trim()))
    } catch {
      // Ignore malformed fenced blocks.
    }
  }

  for (const candidate of balancedJsonObjectStrings(raw)) {
    try {
      candidates.push(JSON.parse(candidate))
    } catch {
      // Ignore non-JSON braces in surrounding text.
    }
  }
  return candidates
}

function parseLenientClarificationObject(text) {
  const raw = stripOuterFence(String(text || '').trim())
  if (!raw || !raw.includes('complete') || !raw.includes('reply')) return null

  const complete = extractBooleanField(raw, 'complete')
  const reply = extractLooseStringField(raw, 'reply')
  const requirementsMarkdown = extractLooseStringField(raw, 'requirementsMarkdown')
  const title = extractLooseStringField(raw, 'title')
  if (complete === null || !reply) return null

  return {
    complete,
    reply,
    requirementsMarkdown: requirementsMarkdown || '',
    title: title || ''
  }
}

function parsePlainRequirementsMarkdown(text) {
  const raw = stripOuterFence(String(text || '').trim())
  if (!raw) return null
  const looksLikeRequirements = /^#\s+.+/m.test(raw) || /需求规格说明书|验收标准|功能需求/.test(raw)
  if (!looksLikeRequirements) return null
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() || '应用需求规格说明书'
  return {
    complete: true,
    reply: '需求已整理为规格说明书，开始自动研发。',
    requirementsMarkdown: raw,
    title
  }
}

function stripOuterFence(text) {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json|markdown|md)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1].trim() : trimmed
}

function extractBooleanField(text, field) {
  const match = text.match(new RegExp(`["']?${escapeRegExp(field)}["']?\\s*:\\s*(true|false)`, 'i'))
  if (!match) return null
  return match[1].toLowerCase() === 'true'
}

function extractLooseStringField(text, field) {
  const marker = new RegExp(`["']?${escapeRegExp(field)}["']?\\s*:`, 'i')
  const match = marker.exec(text)
  if (!match) return ''

  const valueStart = match.index + match[0].length
  const valueEnd = findNextClarificationField(text, valueStart)
  const rawValue = text.slice(valueStart, valueEnd).trim().replace(/,$/, '').trim()
  return decodeLooseStringLiteral(rawValue)
}

function findNextClarificationField(text, startIndex) {
  const nextField = /,\s*["']?(complete|reply|requirementsMarkdown|title)["']?\s*:/gi
  nextField.lastIndex = startIndex
  const match = nextField.exec(text)
  if (match) return match.index
  const lastBrace = text.lastIndexOf('}')
  return lastBrace > startIndex ? lastBrace : text.length
}

function decodeLooseStringLiteral(value) {
  let result = value.trim()
  if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) {
    result = result.slice(1, -1)
  }
  return result
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function balancedJsonObjectStrings(text) {
  const results = []
  let start = -1
  let depth = 0
  let inString = false
  let escape = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escape) {
        escape = false
      } else if (char === '\\') {
        escape = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        results.push(text.slice(start, index + 1))
        start = -1
      }
    }
  }
  return results
}

function extractTextFieldsFromJsonLines(output) {
  const fragments = []
  for (const line of String(output || '').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      collectStringFields(JSON.parse(trimmed), fragments)
    } catch {
      // opencode can mix non-JSON lines with JSON events.
    }
  }
  return fragments.join('\n')
}

function collectStringFields(value, fragments) {
  if (!value || typeof value !== 'object') return
  if (typeof value.text === 'string') fragments.push(value.text)
  if (typeof value.content === 'string') fragments.push(value.content)
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      child.forEach((item) => collectStringFields(item, fragments))
    } else if (child && typeof child === 'object') {
      collectStringFields(child, fragments)
    }
  }
}

export function fallbackRequirementsMarkdown({ title, messages }) {
  const latestUserMessage = [...messages].reverse().find((message) => message.sender === 'user')?.text || ''
  return `# ${title || '应用需求规格说明书'}

## 业务必要性

- 当前业务环节缺乏自动化工具支撑，需通过该应用降低人工成本与决策风险。
- 现有流程存在信息不透明、响应滞后等问题，急需数字化手段提升协同效率。

## 细化需求

### 1. 需求内容：原始需求录入与澄清

业务需求必要性：将用户原始业务想法转化为可研发的需求条目，降低理解偏差。

预期成效：形成结构化需求说明，支撑后续设计、编码和验收闭环。

### 2. 需求内容：关键指标实时展示

业务需求必要性：让业务运维与研发人员快速掌握核心状态，减少人工汇总和反复沟通。

预期成效：关键指标在同一页面可观测，异常定位和决策响应更及时。

## 预期成效

- 应用可在本机一键安装、构建、测试并启动，交付周期从天级压缩到小时级。
- 核心流程可视化覆盖率达到 100%，关键指标实时可观测。

## 目标用户

业务运维与研发人员。

## 核心功能

- 原始需求录入与澄清
- 关键指标实时展示
- 阈值判断与告警
- 历史数据回看

## 输入数据

${latestUserMessage || '用户描述的业务数据源。'}

## 主要页面

仪表盘式总览页 + 详情抽屉。

## 验收标准

- 应用可以在本机安装、构建、测试和启动。
- 交付产物包含 factory.manifest.json。
- 页面或接口能覆盖用户描述的核心流程。`
}

export function fallbackRequirementsItems({ title, messages }) {
  const latestUserMessage = [...messages].reverse().find((message) => message.sender === 'user')?.text || ''
  return {
    detailedRequirements: [
      {
        requirement: '原始需求录入与澄清',
        businessNecessity: '将用户原始业务想法转化为可研发的需求条目，降低理解偏差。',
        expectedOutcome: '形成结构化需求说明，支撑后续设计、编码和验收闭环。'
      },
      {
        requirement: '关键指标实时展示',
        businessNecessity: '让业务运维与研发人员快速掌握核心状态，减少人工汇总和反复沟通。',
        expectedOutcome: '关键指标在同一页面可观测，异常定位和决策响应更及时。'
      }
    ],
    businessNecessity: [
      '当前业务环节缺乏自动化工具支撑，需通过该应用降低人工成本与决策风险。',
      '现有流程存在信息不透明、响应滞后等问题，急需数字化手段提升协同效率。'
    ],
    expectedOutcome: [
      '应用可在本机一键安装、构建、测试并启动，交付周期从天级压缩到小时级。',
      '核心流程可视化覆盖率达到 100%，关键指标实时可观测。'
    ],
    targetUsers: '业务运维与研发人员。',
    coreFeatures: [
      '原始需求录入与澄清',
      '关键指标实时展示',
      '阈值判断与告警',
      '历史数据回看'
    ],
    inputData: latestUserMessage || '用户描述的业务数据源。',
    mainPages: '仪表盘式总览页 + 详情抽屉。',
    acceptanceCriteria: [
      '应用可以在本机安装、构建、测试和启动。',
      '交付产物包含 factory.manifest.json。',
      '页面或接口能覆盖用户描述的核心流程。'
    ]
  }
}
