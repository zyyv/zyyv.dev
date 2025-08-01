import type { Router } from 'vue-router'

export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: string
  action: () => void | Promise<void>
  category?: string
}

export interface CommandDeps {
  router: Router
  closePanel: () => void
}

// 命令创建工具函数
export function createCommand(
  id: string,
  title: string,
  options: {
    description?: string
    icon?: string
    category?: string
    action: (deps: CommandDeps) => void | Promise<void>
  },
): (deps: CommandDeps) => CommandItem {
  return (deps: CommandDeps): CommandItem => ({
    id,
    title,
    description: options.description,
    icon: options.icon,
    category: options.category,
    action: () => options.action(deps),
  })
}

// 便捷的导航命令创建函数
export function createNavigationCommand(
  id: string,
  title: string,
  path: string,
  options: {
    description?: string
    icon?: string
  } = {},
) {
  return createCommand(id, title, {
    description: options.description,
    icon: options.icon,
    category: '导航',
    action: ({ router, closePanel }) => {
      router.push(path)
      closePanel()
    },
  })
}

// 便捷的工具命令创建函数
export function createUtilityCommand(
  id: string,
  title: string,
  action: () => void | Promise<void>,
  options: {
    description?: string
    icon?: string
    closeAfter?: boolean
  } = {},
) {
  return createCommand(id, title, {
    description: options.description,
    icon: options.icon,
    category: '工具',
    action: async ({ closePanel }) => {
      await action()
      if (options.closeAfter !== false) {
        closePanel()
      }
    },
  })
}

// 预定义的命令工厂函数
export function createDefaultCommands(deps: CommandDeps): CommandItem[] {
  const commands = [
    // 导航命令
    createNavigationCommand('go-home', '首页', '/', {
      description: '回到首页',
      icon: 'i-hugeicons-home-03',
    }),
    createNavigationCommand('go-posts', '文章', '/posts', {
      description: '查看所有文章',
      icon: 'i-hugeicons-news',
    }),
    createNavigationCommand('go-photos', '相册', '/photos', {
      description: '查看照片集',
      icon: 'i-hugeicons-image-01',
    }),

    // 设置命令
    createCommand('toggle-theme', '切换主题', {
      description: '在亮色和暗色主题间切换',
      icon: 'i-hugeicons-moon-02',
      category: '设置',
      action: ({ closePanel }) => {
        const colorMode = useColorMode()
        colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
        closePanel()
      },
    }),

    // 工具命令
    createUtilityCommand(
      'copy-url',
      '复制当前页面链接',
      async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
        }
        catch (err) {
          console.error('复制失败:', err)
        }
      },
      {
        description: '复制当前页面的URL到剪贴板',
        icon: 'i-hugeicons-copy-link',
      },
    ),

    createUtilityCommand(
      'reload-page',
      '刷新页面',
      () => {
        window.location.reload()
      },
      {
        description: '重新加载当前页面',
        icon: 'i-hugeicons-refresh',
        closeAfter: false, // 页面会刷新，不需要关闭面板
      },
    ),

    createCommand('go-back', '返回上一页', {
      description: '返回浏览器历史记录中的上一页',
      icon: 'i-hugeicons-arrow-left-02',
      category: '导航',
      action: ({ closePanel }) => {
        window.history.back()
        closePanel()
      },
    }),

    createCommand('scroll-to-top', '回到顶部', {
      description: '滚动到页面顶部',
      icon: 'i-hugeicons-arrow-up-02',
      category: '导航',
      action: ({ closePanel }) => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        closePanel()
      },
    }),

    createCommand('scroll-to-bottom', '滚动到底部', {
      description: '滚动到页面底部',
      icon: 'i-hugeicons-arrow-down-02',
      category: '导航',
      action: ({ closePanel }) => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        closePanel()
      },
    }),

    createUtilityCommand(
      'print-page',
      '打印页面',
      () => {
        window.print()
      },
      {
        description: '打印当前页面',
        icon: 'i-hugeicons-printer',
      },
    ),

    createUtilityCommand(
      'fullscreen',
      '全屏模式',
      () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        }
        else {
          document.exitFullscreen()
        }
      },
      {
        description: '切换全屏显示',
        icon: 'i-hugeicons-maximize-01',
      },
    ),
  ]

  return commands.map(commandFactory => commandFactory(deps))
}

// 辅助函数：合并多个命令源
export function mergeCommands(...commandSources: CommandItem[][]): CommandItem[] {
  return commandSources.flat()
}

// 辅助函数：按类别分组命令
export function groupCommandsByCategory(commands: CommandItem[]): Record<string, CommandItem[]> {
  const groups: Record<string, CommandItem[]> = {}

  commands.forEach((command) => {
    const category = command.category || '其他'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
  })

  return groups
}

// 辅助函数：过滤命令
export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  if (!query)
    return commands

  const lowerQuery = query.toLowerCase()
  return commands.filter(command =>
    command.title.toLowerCase().includes(lowerQuery)
    || command.description?.toLowerCase().includes(lowerQuery)
    || command.category?.toLowerCase().includes(lowerQuery),
  )
}
