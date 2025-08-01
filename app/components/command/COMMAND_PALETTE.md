### 基本命令创建

```typescript
import { createCommand } from '~/utils/command'

const myCommand = createCommand('my-id', '我的命令', {
  description: '这是我的自定义命令',
  icon: 'i-hugeicons-star',
  category: '自定义',
  action: ({ router, closePanel }) => {
    // 执行你的操作
    console.log('执行自定义命令')
    closePanel()
  }
})
```

### 导航命令

```typescript
import { createNavigationCommand } from '~/utils/command'

const aboutCommand = createNavigationCommand('go-about', '关于页面', '/about', {
  description: '查看关于页面',
  icon: 'i-hugeicons-info-circle'
})
```

### 工具命令

```typescript
import { createUtilityCommand } from '~/utils/command'

const downloadCommand = createUtilityCommand(
  'download-data',
  '下载数据',
  async () => {
    // 执行下载逻辑
    const data = await fetchData()
    downloadFile(data)
  },
  {
    description: '下载当前数据',
    icon: 'i-hugeicons-download',
    closeAfter: true // 执行后自动关闭面板
  }
)
```

### 添加到默认命令

修改 `app/utils/command.ts` 中的 `createDefaultCommands` 函数：

```typescript
export function createDefaultCommands(deps: CommandDeps): CommandItem[] {
  const commands = [
    // 现有命令...

    // 添加你的自定义命令
    createNavigationCommand('go-about', '关于', '/about', {
      description: '查看关于页面',
      icon: 'i-hugeicons-info-circle'
    }),
  ]

  return commands.map(commandFactory => commandFactory(deps))
}
```
