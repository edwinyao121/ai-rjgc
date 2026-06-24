import { spawn } from 'node:child_process'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'

export class CommandRunner {
  run(command, options = {}) {
    return runCommand(command, options)
  }

  start(command, options = {}) {
    return startCommand(command, options)
  }
}

export function runCommand(command, {
  cwd = process.cwd(),
  env = {},
  timeoutMs = 10 * 60 * 1000,
  maxOutputBytes = 1024 * 1024,
  onStdoutLine = null,
  onStderrLine = null
} = {}) {
  assertCommandArray(command)

  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    let stdoutPending = ''
    let stderrPending = ''
    const lineCallbacks = []
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 2000).unref()
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout = trimBufferedOutput(stdout + text, maxOutputBytes)
      stdoutPending = emitCompleteLines(stdoutPending + text, onStdoutLine, lineCallbacks)
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr = trimBufferedOutput(stderr + text, maxOutputBytes)
      stderrPending = emitCompleteLines(stderrPending + text, onStderrLine, lineCallbacks)
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      if (stdoutPending) emitLine(stdoutPending, onStdoutLine, lineCallbacks)
      if (stderrPending) emitLine(stderrPending, onStderrLine, lineCallbacks)
      Promise.allSettled(lineCallbacks).then(() => {
        resolve({ exitCode: 1, stdout, stderr: `${stderr}\n${error.message}`.trim(), timedOut })
      })
    })
    child.on('close', (exitCode) => {
      clearTimeout(timer)
      if (stdoutPending) emitLine(stdoutPending, onStdoutLine, lineCallbacks)
      if (stderrPending) emitLine(stderrPending, onStderrLine, lineCallbacks)
      Promise.allSettled(lineCallbacks).then(() => {
        resolve({ exitCode: timedOut ? 124 : exitCode ?? 0, stdout, stderr, timedOut })
      })
    })
  })
}

export function startCommand(command, {
  cwd = process.cwd(),
  env = {},
  onStdoutLine = null,
  onStderrLine = null
} = {}) {
  assertCommandArray(command)
  const child = spawn(command[0], command.slice(1), {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let stdoutPending = ''
  let stderrPending = ''
  const lineCallbacks = []
  child.stdout?.on('data', (chunk) => {
    stdoutPending = emitCompleteLines(stdoutPending + chunk.toString(), onStdoutLine, lineCallbacks)
  })
  child.stderr?.on('data', (chunk) => {
    stderrPending = emitCompleteLines(stderrPending + chunk.toString(), onStderrLine, lineCallbacks)
  })
  child.on('close', () => {
    if (stdoutPending) emitLine(stdoutPending, onStdoutLine, lineCallbacks)
    if (stderrPending) emitLine(stderrPending, onStderrLine, lineCallbacks)
  })
  return child
}

export function assertCommandArray(command) {
  if (!Array.isArray(command) || command.length === 0 || command.some((part) => typeof part !== 'string' || part.trim() === '')) {
    throw new Error('Command must be a non-empty string array')
  }
}

export function summarizeCommandResult(result) {
  if (result.timedOut) {
    return `执行超时（exitCode=${result.exitCode}），opencode 在限定时间内未完成。`
  }
  const combined = `${result.stderr || ''}\n${result.stdout || ''}`.trim()
  if (!combined) return ''
  const lines = combined.split('\n')
  const parsed = []
  let jsonCount = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let obj
    try {
      obj = JSON.parse(trimmed)
    } catch {
      parsed.push(trimmed)
      continue
    }
    jsonCount += 1
    const summary = summarizeOpencodeEvent(obj)
    if (summary) parsed.push(summary)
  }
  if (jsonCount === 0) {
    return lines.slice(-20).join('\n')
  }
  return parsed.slice(-20).join('\n') || `opencode 退出（exitCode=${result.exitCode}），未产生可读输出。`
}

function summarizeOpencodeEvent(obj) {
  if (!obj || typeof obj !== 'object') return ''
  const type = obj.type
  const part = obj.part || {}
  if (type === 'text' && typeof part.text === 'string') {
    return part.text
  }
  if (type === 'thinking' && typeof part.text === 'string') {
    return `[思考] ${part.text}`
  }
  if (type === 'tool_use' || part.type === 'tool') {
    const tool = part.tool || obj.tool || ''
    const input = (part.state || obj.state || {}).input || {}
    const desc = input.description || input.command || input.path || input.pattern || input.query || ''
    return `▸ 执行 ${tool}${desc ? `: ${desc}` : ''}`
  }
  return ''
}

export async function findAvailablePort(startPort = 4101) {
  let port = startPort
  while (port < 65000) {
    if (await canListen(port)) return port
    port += 1
  }
  throw new Error('No available local deployment port found')
}

export async function waitForHealth(url, {
  timeoutMs = 60 * 1000,
  intervalMs = 1000
} = {}) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await probeHttp(url)) return true
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return false
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}

function probeHttp(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http
    const request = client.get(url, { timeout: 3000 }, (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 500)
    })
    request.on('timeout', () => {
      request.destroy()
      resolve(false)
    })
    request.on('error', () => resolve(false))
  })
}

function trimBufferedOutput(value, maxOutputBytes) {
  if (Buffer.byteLength(value, 'utf8') <= maxOutputBytes) return value
  return value.slice(-maxOutputBytes)
}

function emitCompleteLines(buffer, callback, pending) {
  const lines = buffer.split(/\r?\n/)
  const remainder = lines.pop() ?? ''
  for (const line of lines) {
    emitLine(line, callback, pending)
  }
  return remainder
}

function emitLine(line, callback, pending) {
  if (!callback) return
  pending.push(Promise.resolve().then(() => callback(line)))
}
