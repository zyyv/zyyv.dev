<script setup lang="ts">
import CommandTerminal from '~/components/command/CommandTerminal.vue'
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'

const route = useRoute()
const isOpen = shallowRef(false)
const terminalRef = useTemplateRef<InstanceType<typeof CommandTerminal>>('terminal')

function closePanel() {
  isOpen.value = false
}

function openPanel() {
  isOpen.value = true
  nextTick(() => terminalRef.value?.focus())
}

const {
  input,
  transcript,
  suggestions,
  currentTheme,
  isExecuting,
  execute,
  clear,
  completeInput,
  showPreviousCommand,
  showNextCommand,
} = useCommandTerminal({ close: closePanel })

function handleGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (isOpen.value) closePanel()
    else openPanel()
    return
  }

  if (isOpen.value && event.key === 'Escape') {
    event.preventDefault()
    closePanel()
  }
}

onMounted(() => document.addEventListener('keydown', handleGlobalKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleGlobalKeydown))

defineExpose({ openPanel, closePanel })
</script>

<template>
  <Teleport to="body">
    <Transition name="terminal-backdrop">
      <div v-if="isOpen" class="command-palette__backdrop" aria-hidden="true" @click="closePanel" />
    </Transition>

    <Transition name="terminal-window">
      <div v-if="isOpen" class="command-palette__positioner">
        <CommandTerminal
          ref="terminal"
          :input="input"
          :transcript="transcript"
          :suggestions="suggestions"
          :theme="currentTheme"
          :executing="isExecuting"
          :route-path="route.path"
          @update:input="input = $event"
          @execute="execute()"
          @close="closePanel"
          @clear="clear"
          @complete="completeInput"
          @previous="showPreviousCommand"
          @next="showNextCommand"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-palette__backdrop {
  position: fixed;
  z-index: 50;
  inset: 0;
  background: rgb(0 0 0 / 56%);
  backdrop-filter: blur(0.65rem) saturate(80%);
}

.command-palette__positioner {
  position: fixed;
  z-index: 51;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.command-palette__positioner > * {
  pointer-events: auto;
}

.terminal-backdrop-enter-active,
.terminal-backdrop-leave-active {
  transition: opacity 180ms ease;
}

.terminal-backdrop-enter-from,
.terminal-backdrop-leave-to {
  opacity: 0;
}

.terminal-window-enter-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.terminal-window-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.terminal-window-enter-from,
.terminal-window-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .terminal-backdrop-enter-active,
  .terminal-backdrop-leave-active,
  .terminal-window-enter-active,
  .terminal-window-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
