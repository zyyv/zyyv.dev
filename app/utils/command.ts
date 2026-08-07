export type TerminalTone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'error'

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface TerminalTextLine {
  kind?: 'text'
  text: string
  label?: string
  tone?: TerminalTone
}

export interface TerminalJsonLine {
  kind: 'json'
  value: JsonValue
  tone?: TerminalTone
}

export type TerminalLine = TerminalTextLine | TerminalJsonLine

export interface TerminalTranscriptEntry {
  id: number
  command: string
  lines: readonly TerminalLine[]
}

export interface TerminalCommand {
  name: string
  aliases: string[]
  usage: string
  description: string
  category: 'Navigation' | 'Appearance' | 'Browser' | 'API' | 'System'
}

export interface ApiResponseDetails {
  path: string
  status: number
  statusText: string
  contentType: string
  contentLength?: number
  durationMs: number
  bodyType: 'json' | 'text' | 'binary'
  body?: unknown
}

const API_RESPONSE_CHARACTER_LIMIT = 12_000

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    name: 'help',
    aliases: ['h', '?'],
    usage: 'help',
    description: '显示全部可用命令',
    category: 'System',
  },
  {
    name: 'status',
    aliases: ['s', 'pwd'],
    usage: 'status',
    description: '查看当前项目、路由与主题状态',
    category: 'System',
  },
  {
    name: 'api',
    aliases: ['get'],
    usage: 'api <path>',
    description: '请求本站公开 API，例如 api /photos',
    category: 'API',
  },
  {
    name: 'clear',
    aliases: ['c', 'cls'],
    usage: 'clear',
    description: '清空当前终端输出',
    category: 'System',
  },
  {
    name: 'exit',
    aliases: ['q', 'quit'],
    usage: 'exit',
    description: '关闭终端',
    category: 'System',
  },
  {
    name: 'home',
    aliases: ['ho'],
    usage: 'home',
    description: '前往首页',
    category: 'Navigation',
  },
  {
    name: 'posts',
    aliases: ['po'],
    usage: 'posts',
    description: '前往文章页',
    category: 'Navigation',
  },
  {
    name: 'photos',
    aliases: ['ph'],
    usage: 'photos',
    description: '前往相册',
    category: 'Navigation',
  },
  {
    name: 'projects',
    aliases: ['pr'],
    usage: 'projects',
    description: '前往项目页',
    category: 'Navigation',
  },
  {
    name: 'bookmarks',
    aliases: ['bm'],
    usage: 'bookmarks',
    description: '前往书签页',
    category: 'Navigation',
  },
  {
    name: 'about',
    aliases: ['a'],
    usage: 'about',
    description: '前往关于页',
    category: 'Navigation',
  },
  {
    name: 'back',
    aliases: ['b'],
    usage: 'back',
    description: '返回上一个页面',
    category: 'Navigation',
  },
  {
    name: 'top',
    aliases: ['t'],
    usage: 'top',
    description: '平滑滚动到页面顶部',
    category: 'Navigation',
  },
  {
    name: 'bottom',
    aliases: ['bt'],
    usage: 'bottom',
    description: '平滑滚动到页面底部',
    category: 'Navigation',
  },
  {
    name: 'theme',
    aliases: ['th', 'toggle'],
    usage: 'theme [light|dark]',
    description: '切换或指定页面主题',
    category: 'Appearance',
  },
  {
    name: 'copy',
    aliases: ['cp'],
    usage: 'copy',
    description: '复制当前页面链接',
    category: 'Browser',
  },
  {
    name: 'reload',
    aliases: ['r', 'refresh'],
    usage: 'reload',
    description: '重新加载当前页面',
    category: 'Browser',
  },
  {
    name: 'fullscreen',
    aliases: ['f', 'fs'],
    usage: 'fullscreen',
    description: '进入或退出全屏模式',
    category: 'Browser',
  },
]

export function tokenizeCommand(input: string): string[] {
  const tokens: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/gu

  for (const match of input.matchAll(pattern)) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? '')
  }

  return tokens
}

export function resolveTerminalCommand(input: string): {
  command?: TerminalCommand
  args: string[]
} {
  const [rawName = '', ...args] = tokenizeCommand(input.trim())
  const normalizedName = rawName.toLowerCase()
  const command = TERMINAL_COMMANDS.find(
    (item) => item.name === normalizedName || item.aliases.includes(normalizedName),
  )

  return { command, args }
}

export function suggestTerminalCommands(input: string, limit = 4): TerminalCommand[] {
  const query = input.trim().split(/\s+/u)[0]?.toLowerCase() ?? ''
  if (!query || input.trim().includes(' ')) return []

  return TERMINAL_COMMANDS.filter(
    (command) =>
      command.name.startsWith(query) || command.aliases.some((alias) => alias.startsWith(query)),
  ).slice(0, limit)
}

export function normalizePublicApiPath(input: string): string | undefined {
  const requestedPath = input.trim()
  if (
    !requestedPath ||
    requestedPath.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/iu.test(requestedPath)
  ) {
    return undefined
  }

  const pathWithPrefix =
    requestedPath === '/api' || requestedPath.startsWith('/api/')
      ? requestedPath
      : requestedPath === 'api' || requestedPath.startsWith('api/')
        ? `/${requestedPath}`
        : `/api/${requestedPath.replace(/^\/+/u, '')}`
  const url = new URL(pathWithPrefix, 'https://zyyv.dev')

  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(url.pathname)
  } catch {
    return undefined
  }

  const hasTraversal = decodedPath.split('/').some((segment) => segment === '..')
  const apiRootSegment = decodedPath.slice('/api/'.length).split('/').filter(Boolean)[0]
  const isAdminPath = apiRootSegment === 'admin'
  if (!decodedPath.startsWith('/api/') || hasTraversal || isAdminPath) return undefined

  return `${url.pathname}${url.search}`
}

function formatContentLength(bytes?: number): string {
  if (bytes === undefined || Number.isNaN(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTextBody(body: unknown): { text: string; truncated: boolean } {
  let text: string

  if (typeof body === 'string') {
    text = body || '(empty response)'
  } else if (body === undefined) {
    text = '(response body omitted)'
  } else {
    text = JSON.stringify(body, null, 2) ?? String(body)
  }

  if (text.length <= API_RESPONSE_CHARACTER_LIMIT) return { text, truncated: false }

  return {
    text: `${text.slice(0, API_RESPONSE_CHARACTER_LIMIT)}\n…`,
    truncated: true,
  }
}

export function formatApiResponse(details: ApiResponseDetails): TerminalLine[] {
  const successful = details.status >= 200 && details.status < 300
  const metadata = [
    `HTTP ${details.status}${details.statusText ? ` ${details.statusText}` : ''}`,
    details.contentType || 'unknown content type',
    formatContentLength(details.contentLength),
    `${Math.round(details.durationMs)} ms`,
  ].filter(Boolean)
  let bodyLine: TerminalLine
  let truncated = false

  if (details.bodyType === 'json') {
    bodyLine = {
      kind: 'json',
      value: (details.body ?? null) as JsonValue,
      tone: successful ? 'default' : 'error',
    }
  } else {
    const formattedBody = formatTextBody(details.body)
    bodyLine = {
      text: formattedBody.text,
      tone: successful ? 'default' : 'error',
    }
    truncated = formattedBody.truncated
  }

  return [
    { text: `GET ${details.path}`, tone: 'accent' },
    { text: metadata.join(' · '), tone: successful ? 'success' : 'error' },
    { text: '' },
    bodyLine,
    ...(truncated
      ? [
          {
            text: `response truncated after ${API_RESPONSE_CHARACTER_LIMIT.toLocaleString()} characters`,
            tone: 'warning' as const,
          },
        ]
      : []),
  ]
}

export function formatHelpLines(): TerminalLine[] {
  return [
    { text: 'zyyv.dev command line interface', tone: 'accent' },
    { text: '输入命令并按 Enter 执行。', tone: 'muted' },
    { text: '' },
    ...TERMINAL_COMMANDS.map((command) => ({
      label: `${command.usage} (${command.aliases.join(', ')})`,
      text: command.description,
    })),
    { text: '' },
    { text: '快捷键  ↑↓ 历史 · Tab 补全 · Ctrl+L 清屏 · Esc 关闭', tone: 'muted' },
  ]
}
