import type { TerminalLine, TerminalTranscriptEntry } from '~/utils/command'
import { computed, readonly, shallowRef } from 'vue'
import {
  formatApiResponse,
  formatHelpLines,
  normalizePublicApiPath,
  resolveTerminalCommand,
  suggestTerminalCommands,
} from '~/utils/command'

const PAGE_PATHS = {
  home: '/',
  posts: '/posts',
  photos: '/photos',
  projects: '/projects',
  about: '/about',
} as const

interface UseCommandTerminalOptions {
  close: () => void
}

const API_REQUEST_TIMEOUT_MS = 10_000

export function useCommandTerminal({ close }: UseCommandTerminalOptions) {
  const route = useRoute()
  const router = useRouter()
  const colorMode = useColorMode()
  const input = shallowRef('')
  const transcript = shallowRef<TerminalTranscriptEntry[]>([])
  const commandHistory = shallowRef<string[]>([])
  const historyIndex = shallowRef(-1)
  const isExecuting = shallowRef(false)
  let nextEntryId = 0

  const suggestions = computed(() => suggestTerminalCommands(input.value))
  const currentTheme = computed(() =>
    colorMode.value === 'dark' ? 'dark' : colorMode.value === 'light' ? 'light' : 'system',
  )

  function appendEntry(command: string, lines: TerminalLine[]) {
    transcript.value = [
      ...transcript.value,
      {
        id: nextEntryId++,
        command,
        lines,
      },
    ]
  }

  function clear() {
    transcript.value = []
  }

  function resetInput() {
    input.value = ''
    historyIndex.value = -1
  }

  function getStatusLines(): TerminalLine[] {
    return [
      { text: 'PROJECT     zyyv.dev', tone: 'accent' },
      { text: 'BRANCH      main' },
      { text: `ROUTE       ${route.path}` },
      { text: `THEME       ${currentTheme.value}` },
      { text: 'STACK       Nuxt 4 · Vue 3 · UnoCSS', tone: 'muted' },
      { text: 'SESSION     active', tone: 'success' },
    ]
  }

  async function requestApi(pathInput: string): Promise<TerminalLine[]> {
    if (!pathInput.trim()) {
      return [
        { text: 'usage: api <path>', tone: 'warning' },
        { text: 'examples: api /photos · api /repos · api /user', tone: 'muted' },
      ]
    }

    const path = normalizePublicApiPath(pathInput)
    if (!path) {
      return [
        { text: '只支持本站 /api 下的公开 GET 接口。', tone: 'error' },
        { text: '外部 URL、/api/admin 和无效路径不会被请求。', tone: 'muted' },
      ]
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS)
    const startedAt = performance.now()

    try {
      const response = await fetch(path, {
        headers: {
          Accept: 'application/json, text/plain;q=0.9, */*;q=0.1',
        },
        signal: controller.signal,
      })
      const contentType = response.headers.get('content-type')?.split(';')[0] ?? ''
      const rawContentLength = response.headers.get('content-length')
      const contentLength = rawContentLength ? Number(rawContentLength) : undefined
      let body: unknown
      let bodyType: 'json' | 'text' | 'binary' = 'binary'

      if (contentType === 'application/json' || contentType.endsWith('+json')) {
        const text = await response.text()
        body = text ? JSON.parse(text) : null
        bodyType = 'json'
      } else if (contentType.startsWith('text/')) {
        body = await response.text()
        bodyType = 'text'
      }

      return formatApiResponse({
        path,
        status: response.status,
        statusText: response.statusText,
        contentType,
        contentLength,
        durationMs: performance.now() - startedAt,
        bodyType,
        body,
      })
    } finally {
      window.clearTimeout(timeout)
    }
  }

  async function execute(rawInput = input.value) {
    const commandText = rawInput.trim()
    if (!commandText || isExecuting.value) return

    commandHistory.value = [
      commandText,
      ...commandHistory.value.filter((item) => item !== commandText),
    ].slice(0, 50)
    resetInput()

    const { command, args } = resolveTerminalCommand(commandText)
    if (!command) {
      appendEntry(commandText, [
        { text: `command not found: ${commandText.split(/\s+/u)[0]}`, tone: 'error' },
        { text: '输入 help 查看可用命令。', tone: 'muted' },
      ])
      return
    }

    if (command.name === 'clear') {
      clear()
      return
    }

    isExecuting.value = true
    let lines: TerminalLine[] = []

    try {
      switch (command.name) {
        case 'help':
          lines = formatHelpLines()
          break
        case 'status':
          lines = getStatusLines()
          break
        case 'api':
          lines = await requestApi(args.join(' '))
          break
        case 'exit':
          close()
          return
        case 'home':
        case 'posts':
        case 'photos':
        case 'projects':
        case 'about': {
          const path = PAGE_PATHS[command.name]
          lines = [{ text: `navigating to ${path}`, tone: 'success' }]
          await navigateTo(path)
          break
        }
        case 'back':
          lines = [{ text: 'returning to previous page', tone: 'success' }]
          router.back()
          break
        case 'top':
          window.scrollTo({ top: 0, behavior: 'smooth' })
          lines = [{ text: 'viewport moved to top', tone: 'success' }]
          break
        case 'bottom':
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
          lines = [{ text: 'viewport moved to bottom', tone: 'success' }]
          break
        case 'theme': {
          const requestedTheme = args[0]?.toLowerCase()
          if (requestedTheme && requestedTheme !== 'light' && requestedTheme !== 'dark') {
            lines = [{ text: 'usage: theme [light|dark]', tone: 'warning' }]
            break
          }
          colorMode.value =
            requestedTheme === 'light' || requestedTheme === 'dark'
              ? requestedTheme
              : currentTheme.value === 'dark'
                ? 'light'
                : 'dark'
          lines = [{ text: `theme switched to ${colorMode.value}`, tone: 'success' }]
          break
        }
        case 'copy':
          await navigator.clipboard.writeText(window.location.href)
          lines = [{ text: 'current URL copied to clipboard', tone: 'success' }]
          break
        case 'reload':
          window.location.reload()
          return
        case 'fullscreen':
          if (document.fullscreenElement) {
            await document.exitFullscreen()
            lines = [{ text: 'fullscreen disabled', tone: 'success' }]
          } else {
            await document.documentElement.requestFullscreen()
            lines = [{ text: 'fullscreen enabled', tone: 'success' }]
          }
          break
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown browser error'
      lines = [{ text: `operation failed: ${message}`, tone: 'error' }]
    } finally {
      isExecuting.value = false
    }

    appendEntry(commandText, lines)
  }

  function completeInput() {
    const suggestion = suggestions.value[0]
    if (suggestion) input.value = `${suggestion.name} `
  }

  function showPreviousCommand() {
    if (!commandHistory.value.length) return
    historyIndex.value = Math.min(historyIndex.value + 1, commandHistory.value.length - 1)
    input.value = commandHistory.value[historyIndex.value] ?? ''
  }

  function showNextCommand() {
    if (historyIndex.value <= 0) {
      historyIndex.value = -1
      input.value = ''
      return
    }
    historyIndex.value -= 1
    input.value = commandHistory.value[historyIndex.value] ?? ''
  }

  return {
    input,
    transcript: readonly(transcript),
    suggestions,
    currentTheme,
    isExecuting: readonly(isExecuting),
    execute,
    clear,
    completeInput,
    showPreviousCommand,
    showNextCommand,
  }
}
