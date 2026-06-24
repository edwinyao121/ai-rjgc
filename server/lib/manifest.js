import { promises as fs } from 'node:fs'
import path from 'node:path'

export const MANIFEST_FILE = 'factory.manifest.json'

export async function readManifest(appDir) {
  const manifestPath = path.join(appDir, MANIFEST_FILE)
  const raw = await fs.readFile(manifestPath, 'utf8')
  return validateManifest(JSON.parse(raw))
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('factory.manifest.json must be a JSON object')
  }

  const normalized = {
    name: requireString(manifest.name, 'name'),
    install: requireCommand(manifest.install, 'install'),
    build: requireCommand(manifest.build, 'build'),
    test: requireCommand(manifest.test, 'test'),
    start: requireCommand(manifest.start, 'start'),
    healthUrl: requireString(manifest.healthUrl, 'healthUrl')
  }
  return normalized
}

export function substitutePort(value, port) {
  return String(value).replaceAll('${PORT}', String(port))
}

export function substitutePortInCommand(command, port) {
  return command.map((part) => substitutePort(part, port))
}

export function substitutePortInUrl(url, port) {
  return substitutePort(url, port)
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`factory.manifest.json field "${field}" must be a non-empty string`)
  }
  return value.trim()
}

function requireCommand(value, field) {
  if (!Array.isArray(value) || value.length === 0 || value.some((part) => typeof part !== 'string' || part.trim() === '')) {
    throw new Error(`factory.manifest.json field "${field}" must be a non-empty command array`)
  }
  return value.slice()
}
