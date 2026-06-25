import { promises as fs } from 'node:fs'
import path from 'node:path'

export const BUILTIN_APPS = Object.freeze([
  {
    id: 'builtin-tide-window',
    slug: 'tide-window-calculator',
    title: '航母母港潮汐窗口计算器',
    description: '接入四大母港潮汐数据，根据吃水阈值计算可出港时间窗和倒计时。',
    domain: '海洋域'
  },
  {
    id: 'builtin-deck-wind',
    slug: 'deck-wind-calculator',
    title: '甲板风实时计算器',
    description: '基于甲板风速、风向和舰载机参数，辅助判断起降安全窗口。',
    domain: '航空域'
  },
  {
    id: 'builtin-merchant-density',
    slug: 'merchant-density-alert',
    title: '海域网格商船密度异常告警器',
    description: '按海域网格监控商船密度变化，识别异常聚集并输出告警。',
    domain: '监控域'
  },
  {
    id: 'builtin-community-monitor',
    slug: 'community-anomaly-monitor',
    title: '开源社区异常监测',
    description: '监测开源社区活跃度、议题波动和异常行为趋势。',
    domain: '情报域'
  }
])

const WORKSPACE_DIRS = ['app', 'agents', 'skills', 'docs']

export function getBuiltinApp(id) {
  return BUILTIN_APPS.find((app) => app.id === id) || null
}

export async function ensureBuiltinAppWorkspaces(rootDir) {
  await fs.mkdir(rootDir, { recursive: true })
  const apps = []
  for (const app of BUILTIN_APPS) {
    const workspaceDir = path.join(rootDir, app.slug)
    await fs.mkdir(workspaceDir, { recursive: true })
    for (const dirname of WORKSPACE_DIRS) {
      await fs.mkdir(path.join(workspaceDir, dirname), { recursive: true })
    }
    await fs.writeFile(path.join(workspaceDir, 'workspace.json'), `${JSON.stringify({
      appId: app.id,
      slug: app.slug,
      title: app.title,
      description: app.description,
      directories: WORKSPACE_DIRS,
      updatedAt: new Date().toISOString()
    }, null, 2)}\n`, 'utf8')
    apps.push(await describeBuiltinApp(app, rootDir))
  }
  return apps
}

export async function listBuiltinApps(rootDir) {
  await ensureBuiltinAppWorkspaces(rootDir)
  return Promise.all(BUILTIN_APPS.map((app) => describeBuiltinApp(app, rootDir)))
}

export function getBuiltinAppWorkspace(app, rootDir) {
  return path.join(rootDir, app.slug)
}

async function describeBuiltinApp(app, rootDir) {
  const workspaceDir = getBuiltinAppWorkspace(app, rootDir)
  const directories = {}
  for (const dirname of WORKSPACE_DIRS) {
    directories[dirname] = await pathIsDirectory(path.join(workspaceDir, dirname))
  }
  return {
    ...app,
    workspaceDir,
    appDir: path.join(workspaceDir, 'app'),
    directories,
    workspaceReady: Object.values(directories).every(Boolean)
  }
}

async function pathIsDirectory(targetPath) {
  try {
    const stat = await fs.stat(targetPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}
