import path from 'node:path'

export function buildOpencodeCommand(prompt, appDir) {
  return [
    'opencode',
    'run',
    '--format',
    'json',
    '--dangerously-skip-permissions',
    '--dir',
    path.resolve(appDir),
    prompt
  ]
}

export function createClarificationPrompt(messages) {
  const conversation = messages
    .map((message) => `${message.sender === 'user' ? '用户' : 'AI'}: ${message.text}`)
    .join('\n')

  return `你是单机版 AI 研发助手的需求澄清 Agent。请根据对话判断需求是否足够进入自动研发流水线。

必须只输出一个 JSON 对象，不要输出 Markdown，不要输出额外解释。所有字符串里的换行必须写成 \\n，不能在字符串字面量中直接换行。结构如下：
{
  "complete": boolean,
  "reply": "回复用户的澄清问题或确认语",
  "requirementsMarkdown": "complete=true 时输出完整需求规格说明书 Markdown；否则为空字符串",
  "title": "不超过 24 个中文字符的应用名称"
}

进入流水线的最低条件：目标用户、核心功能、输入数据、主要页面或交互、验收标准基本清楚。若缺少关键信息，complete=false 并只问 1-3 个最关键问题。

当前对话：
${conversation}`
}

export function createStagePrompt({ stageKey, title, requirementsMarkdown }) {
  const shared = `你正在 .runtime/work-orders/<id>/app 目录中为「${title}」生成一个可本机运行的软件应用。
需求文档如下：

${requirementsMarkdown}

硬性要求：
- 只在当前工作目录内创建或修改文件。
- 第一版必须可通过本机命令安装、构建、测试并启动。
- 设计/编码完成后必须生成 factory.manifest.json。
- factory.manifest.json 中 install/build/test/start 必须是命令参数数组，不能是 shell 字符串。
- start 命令中端口使用 "\${PORT}" 占位符，健康检查使用 healthUrl。
- 不要依赖远程部署服务。`

  if (stageKey === 'design') {
    return `${shared}

当前阶段：系统设计。
请输出设计文档、技术选型和文件结构计划，可创建 docs/design.md。若已有代码请保持兼容。`
  }

  if (stageKey === 'coding') {
    return `${shared}

当前阶段：智能编码。
请生成完整应用代码、必要测试、package.json，并确保 factory.manifest.json 至少包含：
{
  "name": "app-name",
  "install": ["npm", "install"],
  "build": ["npm", "run", "build"],
  "test": ["npm", "test"],
  "start": ["npm", "run", "preview", "--", "--host", "127.0.0.1", "--port", "\${PORT}"],
  "healthUrl": "http://127.0.0.1:\${PORT}"
}`
  }

  if (stageKey === 'testing') {
    return `${shared}

当前阶段：测试质检。
请补齐或修复测试，保证 manifest 中的 build/test 命令能通过。不要启动长期运行进程。`
  }

  if (stageKey === 'deployment') {
    return `${shared}

当前阶段：部署交付准备。
请检查启动脚本、健康检查路径和 manifest 是否适合本机部署。不要启动长期运行进程。`
  }

  return shared
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
    throw new Error('Unable to parse clarification JSON from opencode output')
  }
  return {
    complete: Boolean(match.complete),
    reply: String(match.reply || '').trim(),
    requirementsMarkdown: String(match.requirementsMarkdown || '').trim(),
    title: String(match.title || '').trim()
  }
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

## 原始需求

${latestUserMessage}

## 验收标准

- 应用可以在本机安装、构建、测试和启动。
- 交付产物包含 factory.manifest.json。
- 页面或接口能覆盖用户描述的核心流程。`
}
