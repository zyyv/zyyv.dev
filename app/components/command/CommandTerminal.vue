<script setup lang="ts">
import TerminalJsonViewer from '~/components/command/TerminalJsonViewer.vue'
import type { TerminalCommand, TerminalTranscriptEntry } from '~/utils/command'
import { nextTick, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  input: string
  transcript: readonly TerminalTranscriptEntry[]
  suggestions: TerminalCommand[]
  theme: string
  executing: boolean
  routePath: string
}>()

const emit = defineEmits<{
  'update:input': [value: string]
  execute: []
  close: []
  clear: []
  complete: []
  previous: []
  next: []
}>()

const inputRef = useTemplateRef<HTMLInputElement>('commandInput')
const outputRef = useTemplateRef<HTMLDivElement>('terminalOutput')
const terminalRef = useTemplateRef<HTMLElement>('terminal')

function focus() {
  nextTick(() => inputRef.value?.focus({ preventScroll: true }))
}

function handleTerminalClick() {
  const selection = window.getSelection()
  const selectionIsInsideTerminal =
    selection &&
    !selection.isCollapsed &&
    selection.anchorNode &&
    terminalRef.value?.contains(selection.anchorNode)

  if (!selectionIsInsideTerminal) focus()
}

function updateInput(event: Event) {
  emit('update:input', (event.target as HTMLInputElement).value)
  nextTick(() => outputRef.value?.scrollTo({ top: outputRef.value.scrollHeight }))
}

function setInput(value: string) {
  emit('update:input', value)
  focus()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('execute')
  } else if (event.key === 'Tab') {
    event.preventDefault()
    emit('complete')
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    emit('previous')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    emit('next')
  } else if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
    event.preventDefault()
    emit('clear')
  }
}

watch(
  () => props.transcript.length,
  () => nextTick(() => outputRef.value?.scrollTo({ top: outputRef.value.scrollHeight })),
)

defineExpose({ focus })
</script>

<template>
  <section
    ref="terminal"
    class="terminal"
    role="dialog"
    aria-modal="true"
    aria-label="zyyv.dev command terminal"
    @click="handleTerminalClick"
  >
    <header class="terminal__chrome">
      <div class="terminal__traffic" aria-hidden="true">
        <button
          class="terminal__dot terminal__dot--close"
          tabindex="-1"
          @click.stop="emit('close')"
        />
      </div>
      <div class="terminal__title">
        <span class="terminal__folder">▰</span>
        <span>zyyv.dev · command terminal</span>
      </div>
      <span class="terminal__live"><i /> live</span>
    </header>

    <div
      ref="terminalOutput"
      class="terminal__output"
      aria-live="polite"
      @touchmove.stop
      @wheel.stop
    >
      <div class="terminal__intro">
        <div class="terminal__wordmark">zyyv.dev</div>
        <p>Regardless of the past, do not ask the future</p>
      </div>

      <dl class="terminal__meta">
        <div>
          <dt>project</dt>
          <dd>zyyv.dev</dd>
        </div>
        <div>
          <dt>branch</dt>
          <dd><span class="terminal__branch-mark">⑂</span> main</dd>
        </div>
        <div>
          <dt>route</dt>
          <dd>{{ routePath }}</dd>
        </div>
        <div>
          <dt>theme</dt>
          <dd>{{ theme }}</dd>
        </div>
      </dl>

      <p class="terminal__welcome">
        Type
        <button type="button" @click.stop="setInput('help')">help</button>
        to explore available commands.
      </p>

      <div v-for="entry in transcript" :key="entry.id" class="terminal__entry">
        <div class="terminal__command">
          <span class="terminal__prompt-symbol">❯</span>
          <span>{{ entry.command }}</span>
        </div>
        <div class="terminal__response">
          <div
            v-for="(line, index) in entry.lines"
            :key="`${entry.id}-${index}`"
            class="terminal__response-line"
          >
            <TerminalJsonViewer v-if="line.kind === 'json'" :value="line.value" :tone="line.tone" />
            <p
              v-else
              :class="[
                `terminal__line--${line.tone ?? 'default'}`,
                { 'terminal__help-line': line.label },
              ]"
            >
              <code v-if="line.label">{{ line.label }}</code>
              <span>{{ line.text || '\u00a0' }}</span>
            </p>
          </div>
        </div>
      </div>

      <form class="terminal__prompt" @submit.prevent="emit('execute')">
        <label for="command-terminal-input">
          <span class="terminal__identity">guest@zyyv.dev</span>
          <span class="terminal__path">:{{ routePath }}</span>
          <span class="terminal__prompt-symbol">❯</span>
        </label>
        <input
          id="command-terminal-input"
          ref="commandInput"
          :value="input"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Terminal command"
          :disabled="executing"
          @input="updateInput"
          @keydown="handleKeydown"
        />
        <span class="terminal__cursor" aria-hidden="true" />
      </form>

      <div v-if="suggestions.length" class="terminal__suggestions">
        <span>complete</span>
        <button
          v-for="suggestion in suggestions"
          :key="suggestion.name"
          type="button"
          @click.stop="setInput(`${suggestion.name} `)"
        >
          {{ suggestion.name }}
        </button>
      </div>
    </div>

    <footer class="terminal__footer">
      <span><kbd>↑↓</kbd> history</span>
      <span><kbd>tab</kbd> complete</span>
      <span><kbd>ctrl l</kbd> clear</span>
      <span class="terminal__footer-spacer" />
      <span><kbd>esc</kbd> close</span>
    </footer>
  </section>
</template>

<style scoped>
.terminal {
  --terminal-bg: #f6f6f4;
  --terminal-chrome: #eaeae7;
  --terminal-line: rgb(20 20 20 / 13%);
  --terminal-text: #161616;
  --terminal-muted: #747474;
  --terminal-accent: #3d5aa9;
  --terminal-accent-soft: rgb(61 90 169 / 9%);
  --terminal-success: #347552;
  --terminal-error: #b3423d;
  --terminal-warning: #9a650d;
  display: grid;
  width: min(58rem, calc(100vw - 2rem));
  height: min(42rem, calc(100dvh - 3rem));
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 52%);
  border-radius: 1.15rem;
  color: var(--terminal-text);
  background: var(--terminal-bg);
  box-shadow:
    0 2rem 5rem rgb(0 0 0 / 24%),
    inset 0 1px rgb(255 255 255 / 72%);
  font-family: dank, 'SFMono-Regular', Consolas, monospace;
}

:global(.dark .terminal) {
  --terminal-bg: #111111;
  --terminal-chrome: #1b1b1b;
  --terminal-line: rgb(255 255 255 / 12%);
  --terminal-text: #ededed;
  --terminal-muted: #909090;
  --terminal-accent: #aab8ef;
  --terminal-accent-soft: rgb(170 184 239 / 10%);
  --terminal-success: #82c99e;
  --terminal-error: #ff8580;
  --terminal-warning: #e5b968;
  border-color: rgb(255 255 255 / 12%);
  box-shadow:
    0 2.5rem 7rem rgb(0 0 0 / 58%),
    inset 0 1px rgb(255 255 255 / 8%);
}

.terminal__chrome {
  position: relative;
  display: grid;
  min-height: 3.55rem;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 1.1rem;
  border-bottom: 1px solid var(--terminal-line);
  background: var(--terminal-chrome);
  user-select: none;
}

.terminal__traffic {
  display: flex;
  gap: 0.55rem;
  align-items: center;
}

.terminal__dot {
  width: 0.78rem;
  height: 0.78rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
}

.terminal__dot--close {
  cursor: pointer;
  background: #6f6f6f;
}

.terminal__dot--minimize {
  background: #a3a3a3;
}

.terminal__dot--maximize {
  background: #c7c7c7;
}

.terminal__dot--close:hover {
  filter: brightness(0.88);
}

.terminal__title {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  color: var(--terminal-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.79rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.terminal__folder {
  color: var(--terminal-text);
  font-size: 0.85rem;
}

.terminal__live {
  display: flex;
  justify-self: end;
  gap: 0.4rem;
  align-items: center;
  color: var(--terminal-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.terminal__live i {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 0.2rem rgb(128 128 128 / 12%);
}

.terminal__output {
  overflow: auto;
  overscroll-behavior: contain;
  padding: clamp(1.4rem, 4vw, 2.75rem);
  scrollbar-color: var(--terminal-line) transparent;
}

.terminal__intro {
  margin-bottom: 1.7rem;
}

.terminal__wordmark {
  color: var(--terminal-text);
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(2.25rem, 6vw, 4rem);
  font-weight: 700;
  letter-spacing: -0.065em;
  line-height: 0.9;
}

.terminal__intro p {
  margin: 0.65rem 0 0;
  color: var(--terminal-muted);
  font-size: 0.82rem;
}

.terminal__meta {
  display: grid;
  max-width: 36rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 0 1.65rem;
  gap: 0.55rem 2rem;
  font-size: 0.8rem;
}

.terminal__meta div {
  display: grid;
  grid-template-columns: 4.25rem 1fr;
  gap: 0.8rem;
}

.terminal__meta dt {
  color: var(--terminal-muted);
}

.terminal__meta dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal__branch-mark {
  color: var(--terminal-muted);
}

.terminal__welcome {
  margin: 0 0 2rem;
  color: var(--terminal-muted);
  font-size: 0.8rem;
}

.terminal__welcome button {
  padding: 0;
  border: 0;
  color: var(--terminal-accent);
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.terminal__entry {
  margin-bottom: 1.4rem;
}

.terminal__command {
  display: flex;
  gap: 0.65rem;
  align-items: baseline;
  margin-bottom: 0.45rem;
  font-size: 0.86rem;
}

.terminal__prompt-symbol {
  color: var(--terminal-accent);
  font-weight: 700;
}

.terminal__response {
  padding-left: 1.4rem;
  font-size: 0.78rem;
  line-height: 1.65;
  white-space: pre-wrap;
}

.terminal__response-line > p {
  min-height: 1em;
  margin: 0;
}

.terminal__help-line {
  display: grid;
  grid-template-columns: minmax(15rem, 1fr) minmax(10rem, 1fr);
  gap: 1rem;
}

.terminal__help-line code {
  overflow-wrap: anywhere;
  color: var(--terminal-text);
  font: inherit;
}

.terminal__line--muted {
  color: var(--terminal-muted);
}

.terminal__line--accent {
  color: var(--terminal-accent);
  font-weight: 700;
}

.terminal__line--success {
  color: var(--terminal-success);
}

.terminal__line--warning {
  color: var(--terminal-warning);
}

.terminal__line--error {
  color: var(--terminal-error);
}

.terminal__prompt {
  display: flex;
  min-height: 1.65rem;
  align-items: center;
  font-size: 0.86rem;
}

.terminal__prompt label {
  display: flex;
  flex: none;
  gap: 0;
  align-items: center;
}

.terminal__identity {
  color: var(--terminal-accent);
  font-weight: 700;
}

.terminal__path {
  max-width: 14rem;
  margin-right: 0.65rem;
  overflow: hidden;
  color: var(--terminal-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal__prompt input {
  min-width: 1rem;
  flex: 1;
  padding: 0;
  border: 0;
  outline: 0;
  color: var(--terminal-text);
  background: transparent;
  caret-color: var(--terminal-accent);
  font: inherit;
}

.terminal__cursor {
  display: none;
}

.terminal__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  margin-top: 0.75rem;
  padding-left: 1.4rem;
  color: var(--terminal-muted);
  font-size: 0.68rem;
}

.terminal__suggestions > span {
  margin-right: 0.25rem;
}

.terminal__suggestions button {
  padding: 0.22rem 0.45rem;
  border: 1px solid var(--terminal-line);
  border-radius: 0.28rem;
  color: var(--terminal-accent);
  background: var(--terminal-accent-soft);
  cursor: pointer;
  font: inherit;
}

.terminal__suggestions button:hover {
  border-color: var(--terminal-accent);
}

.terminal__footer {
  display: flex;
  min-height: 2.8rem;
  gap: 1rem;
  align-items: center;
  padding: 0 1.1rem;
  border-top: 1px solid var(--terminal-line);
  color: var(--terminal-muted);
  background: var(--terminal-chrome);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.66rem;
}

.terminal__footer span {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.terminal__footer kbd {
  padding: 0.12rem 0.34rem;
  border: 1px solid var(--terminal-line);
  border-radius: 0.25rem;
  color: var(--terminal-text);
  background: var(--terminal-bg);
  box-shadow: 0 1px 0 var(--terminal-line);
  font: inherit;
}

.terminal__footer-spacer {
  flex: 1;
}

@media (max-width: 640px) {
  .terminal {
    width: calc(100vw - 1rem);
    height: calc(100dvh - 1rem);
    border-radius: 0.8rem;
  }

  .terminal__chrome {
    grid-template-columns: 1fr auto;
  }

  .terminal__title {
    display: none;
  }

  .terminal__meta {
    grid-template-columns: 1fr;
  }

  .terminal__help-line {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    margin-bottom: 0.5rem !important;
  }

  .terminal__help-line span {
    padding-left: 1rem;
    color: var(--terminal-muted);
  }

  .terminal__footer span:nth-child(-n + 3) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .terminal *,
  .terminal *::before,
  .terminal *::after {
    scroll-behavior: auto !important;
  }
}
</style>
