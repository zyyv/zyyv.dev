<script setup lang="ts">
import type { CommandItem } from '~/utils/command'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createDefaultCommands, filterCommands, groupCommandsByCategory } from '~/utils/command'

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement>()
const commandListRef = ref<HTMLDivElement>()
const isKeyboardNavigation = ref(false)
const router = useRouter()

// 关闭面板的函数
function closePanel() {
  isOpen.value = false
  searchQuery.value = ''
  selectedIndex.value = 0
  isKeyboardNavigation.value = false
}

// 使用新的命令系统
const commands = computed(() => {
  return createDefaultCommands({
    router,
    closePanel,
  })
})

// 过滤后的命令
const filteredCommands = computed(() => {
  return filterCommands(commands.value, searchQuery.value)
})

// 按类别分组的命令
const groupedCommands = computed(() => {
  return groupCommandsByCategory(filteredCommands.value)
})

// 扁平化的命令列表，保持与渲染顺序一致
const flattenedCommands = computed(() => {
  const result: CommandItem[] = []
  const groups = groupedCommands.value

  Object.keys(groups).forEach((category) => {
    if (groups[category]) {
      result.push(...groups[category])
    }
  })

  return result
})

function openPanel() {
  isOpen.value = true
  selectedIndex.value = 0
  searchQuery.value = ''
  isKeyboardNavigation.value = false
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function executeCommand(command: CommandItem) {
  command.action()
}

function scrollToSelectedCommand() {
  if (!commandListRef.value)
    return

  nextTick(() => {
    const selectedElement = commandListRef.value?.querySelector(`[data-command-index="${selectedIndex.value}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'auto', // 改为 auto 以获得更快的响应
        block: 'nearest',
        inline: 'nearest',
      })
    }
  })
}

function handleMouseEnter(command: CommandItem) {
  // 如果正在进行键盘导航，忽略鼠标事件
  if (isKeyboardNavigation.value)
    return

  selectedIndex.value = flattenedCommands.value.indexOf(command)
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value)
    return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closePanel()
      break
    case 'ArrowDown':
      event.preventDefault()
      isKeyboardNavigation.value = true
      selectedIndex.value = Math.min(selectedIndex.value + 1, flattenedCommands.value.length - 1)
      scrollToSelectedCommand()
      // 短暂延迟后重置键盘导航标志
      setTimeout(() => {
        isKeyboardNavigation.value = false
      }, 100)
      break
    case 'ArrowUp':
      event.preventDefault()
      isKeyboardNavigation.value = true
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      scrollToSelectedCommand()
      // 短暂延迟后重置键盘导航标志
      setTimeout(() => {
        isKeyboardNavigation.value = false
      }, 100)
      break
    case 'Enter':
      event.preventDefault()
      if (flattenedCommands.value[selectedIndex.value]) {
        executeCommand(flattenedCommands.value[selectedIndex.value]!)
      }
      break
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  // Cmd+K (Mac) 或 Ctrl+K (Windows/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    if (isOpen.value) {
      closePanel()
    }
    else {
      openPanel()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// 当搜索查询改变时重置选中索引
watch(searchQuery, () => {
  selectedIndex.value = 0
})

// 暴露打开命令面板的方法
defineExpose({
  openPanel,
  closePanel,
})
</script>

<template>
  <!-- 遮罩层 -->
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-500 bg-black/50 backdrop-blur-sm"
        @click="closePanel"
      />
    </Transition>

    <!-- 命令面板 -->
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-4"
    >
      <div
        v-if="isOpen"
        class="fixed left-1/2 top-1/4 z-501 w-full max-w-lg -translate-x-1/2 -translate-y-1/4"
        @keydown="handleKeydown"
      >
        <div class="mx-4 overflow-hidden rounded-xl border bg-basecolor shadow-2xl border-gray-200 dark:border-gray-700">
          <!-- 搜索输入框 -->
          <div class="flex items-center border-b px-4 py-3 border-gray-200 dark:border-gray-700">
            <div class="i-hugeicons-search-01 mr-3 h-5 w-5 text-gray-400" />
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              placeholder="搜索命令..."
              class="flex-1 bg-transparent text-basecolor placeholder-gray-500 outline-none dark:placeholder-gray-400"
            >
            <kbd class="hidden rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 sm:block dark:bg-gray-700 dark:text-gray-300">
              ESC
            </kbd>
          </div>

          <!-- 命令列表 -->
          <div ref="commandListRef" class="max-h-96 overflow-y-auto">
            <div v-if="flattenedCommands.length === 0" class="px-4 py-8 text-center op-72">
              没有找到匹配的命令
            </div>

            <div v-else>
              <div
                v-for="(categoryCommands, category) in groupedCommands"
                :key="category"
                class="border-b border-gray-100 last:border-b-0 dark:border-gray-700"
              >
                <!-- 类别标题 -->
                <div class="px-4 py-2 text-xs font-medium op-72 uppercase tracking-wider">
                  {{ category }}
                </div>

                <!-- 类别下的命令 -->
                <div
                  v-for="command in categoryCommands"
                  :key="command.id"
                  :data-command-index="flattenedCommands.indexOf(command)"
                  class="flex cursor-pointer items-center px-4 py-3 transition-colors"
                  :class="[
                    selectedIndex === flattenedCommands.indexOf(command)
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-900  dark:text-gray-100 ',
                  ]"
                  @click="executeCommand(command)"
                  @mouseenter="handleMouseEnter(command)"
                >
                  <!-- 图标 -->
                  <div
                    v-if="command.icon"
                    class="mr-3 h-5 w-5"
                    :class="[
                      command.icon,
                      selectedIndex === flattenedCommands.indexOf(command)
                        ? 'text-basecolor'
                        : 'op-64',
                    ]"
                  />

                  <!-- 命令信息 -->
                  <div class="flex-1 min-w-0">
                    <div class="font-medium truncate text-basecolor">
                      {{ command.title }}
                    </div>
                    <div
                      v-if="command.description"
                      class="text-sm op-72 truncate"
                    >
                      {{ command.description }}
                    </div>
                  </div>

                  <!-- 选中指示器 -->
                  <div
                    v-if="selectedIndex === flattenedCommands.indexOf(command)"
                    class="i-hugeicons-arrow-right-02 h-4 w-4 text-basecolor"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="border-t border-gray-200 px-4 py-2 text-xs op-72 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <span class="flex items-center">
                  <kbd class="mr-1 rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">↑↓</kbd>
                  导航
                </span>
                <span class="flex items-center">
                  <kbd class="mr-1 rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">⏎</kbd>
                  执行
                </span>
              </div>
              <span class="flex items-center">
                <kbd class="mr-1 rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">⌘+K</kbd>
                切换
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
