import { spawn } from 'node:child_process'

const children = []

function start(name, command, args) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env
  })
  children.push(child)
  child.stdout.on('data', (chunk) => process.stdout.write(`[${name}] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`))
  child.on('exit', (code) => {
    if (code && !isShuttingDown) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code)
    }
  })
}

let isShuttingDown = false
function shutdown(code = 0) {
  isShuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 300).unref()
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

start('api', 'npm', ['run', 'server'])
start('vite', 'npm', ['run', 'dev'])
