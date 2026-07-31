<script setup lang="ts">
import type { JsonValue, TerminalTone } from '~/utils/command'
import TerminalJsonNode from '~/components/command/TerminalJsonNode.vue'
import { shallowRef } from 'vue'

defineProps<{
  value: JsonValue
  tone?: TerminalTone
}>()

type ExpansionMode = 'default' | 'all' | 'none'

const expansionMode = shallowRef<ExpansionMode>('default')
const expansionVersion = shallowRef(0)

function setExpansion(mode: ExpansionMode) {
  expansionMode.value = mode
  expansionVersion.value += 1
}
</script>

<template>
  <section
    class="json-viewer"
    :class="{ 'json-viewer--error': tone === 'error' }"
    aria-label="JSON response"
    @click.stop
  >
    <header class="json-viewer__toolbar">
      <div class="json-viewer__identity">
        <i class="json-viewer__mark i-hugeicons:code-square" aria-hidden="true" />
        <span>JSON</span>
      </div>
      <div class="json-viewer__actions">
        <button
          type="button"
          aria-label="Expand all JSON nodes"
          title="Expand all"
          @click="setExpansion('all')"
        >
          <i class="i-hugeicons:expand" aria-hidden="true" />
          <span>expand</span>
        </button>
        <button
          type="button"
          aria-label="Collapse all JSON nodes"
          title="Collapse all"
          @click="setExpansion('none')"
        >
          <i class="i-hugeicons:collapse" aria-hidden="true" />
          <span>collapse</span>
        </button>
      </div>
    </header>

    <div class="json-viewer__body">
      <TerminalJsonNode
        :value="value"
        :depth="0"
        :expansion-mode="expansionMode"
        :expansion-version="expansionVersion"
      />
    </div>
  </section>
</template>

<style scoped>
.json-viewer {
  overflow: hidden;
  border: 1px solid var(--terminal-line);
  border-radius: 0.5rem;
  background: var(--terminal-bg);
  white-space: normal;
}

.json-viewer--error {
  border-color: color-mix(in srgb, var(--terminal-error) 45%, var(--terminal-line));
}

.json-viewer__toolbar {
  display: flex;
  min-height: 2.35rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.45rem 0 0.75rem;
  border-bottom: 1px solid var(--terminal-line);
  background: var(--terminal-chrome);
  user-select: none;
}

.json-viewer__identity {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--terminal-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.json-viewer__mark {
  width: 0.9rem;
  height: 0.9rem;
  color: var(--terminal-accent);
}

.json-viewer__actions {
  display: flex;
  gap: 0.1rem;
  align-items: center;
}

.json-viewer__actions button {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  padding: 0.3rem 0.45rem;
  border: 0;
  border-radius: 0.3rem;
  color: var(--terminal-muted);
  background: transparent;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.62rem;
  white-space: nowrap;
}

.json-viewer__actions i {
  width: 0.78rem;
  height: 0.78rem;
}

.json-viewer__actions button:hover {
  color: var(--terminal-text);
  background: var(--terminal-accent-soft);
}

.json-viewer__actions button:focus-visible {
  outline: 1px solid var(--terminal-accent);
  outline-offset: 1px;
}

.json-viewer__actions button:active {
  transform: translateY(1px);
}

.json-viewer__body {
  overflow-x: auto;
  padding: 0.55rem 0.65rem 0.65rem;
  scrollbar-color: var(--terminal-line) transparent;
}

@media (max-width: 640px) {
  .json-viewer__toolbar {
    padding-right: 0.25rem;
  }

  .json-viewer__actions button {
    min-height: 2.35rem;
    padding-inline: 0.5rem;
  }

  .json-viewer__actions span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .json-viewer__actions button:active {
    transform: none;
  }
}
</style>
