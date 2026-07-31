<script setup lang="ts">
import type { JsonValue } from '~/utils/command'
import { computed, shallowRef, watch } from 'vue'

type ExpansionMode = 'default' | 'all' | 'none'

const props = withDefaults(
  defineProps<{
    value: JsonValue
    nodeKey?: string | number
    depth: number
    expansionMode: ExpansionMode
    expansionVersion: number
  }>(),
  {
    nodeKey: undefined,
  },
)

const isExpanded = shallowRef(
  props.expansionMode === 'all' || (props.expansionMode === 'default' && props.depth === 0),
)

const entries = computed(() => {
  if (Array.isArray(props.value)) {
    return props.value.map((value, index) => ({ key: index, value }))
  }

  if (props.value !== null && typeof props.value === 'object') {
    return Object.entries(props.value).map(([key, value]) => ({ key, value }))
  }

  return []
})

const isContainer = computed(
  () => Array.isArray(props.value) || (props.value !== null && typeof props.value === 'object'),
)
const isExpandable = computed(() => isContainer.value && entries.value.length > 0)
const openingToken = computed(() => (Array.isArray(props.value) ? '[' : '{'))
const closingToken = computed(() => (Array.isArray(props.value) ? ']' : '}'))
const containerSummary = computed(() => {
  const count = entries.value.length
  if (Array.isArray(props.value)) return `${count} ${count === 1 ? 'item' : 'items'}`
  return `${count} ${count === 1 ? 'key' : 'keys'}`
})
const primitiveType = computed(() => (props.value === null ? 'null' : typeof props.value))
const primitiveText = computed(() => {
  if (typeof props.value === 'string') return JSON.stringify(props.value)
  if (props.value === null) return 'null'
  return String(props.value)
})
const keyText = computed(() => {
  if (typeof props.nodeKey === 'number') return `[${props.nodeKey}]`
  return props.nodeKey === undefined ? '' : JSON.stringify(props.nodeKey)
})

watch(
  () => props.expansionVersion,
  () => {
    isExpanded.value =
      props.expansionMode === 'all' || (props.expansionMode === 'default' && props.depth === 0)
  },
)
</script>

<template>
  <div class="json-node">
    <button
      v-if="isContainer"
      type="button"
      class="json-node__row json-node__row--container"
      :class="{ 'json-node__row--static': !isExpandable }"
      :aria-expanded="isExpandable ? isExpanded : undefined"
      :disabled="!isExpandable"
      @click="isExpanded = !isExpanded"
    >
      <i
        v-if="isExpandable && isExpanded"
        class="json-node__disclosure i-hugeicons:arrow-down-01"
        aria-hidden="true"
      />
      <i
        v-else-if="isExpandable"
        class="json-node__disclosure i-hugeicons:arrow-right-01"
        aria-hidden="true"
      />
      <span v-else class="json-node__disclosure-placeholder" aria-hidden="true" />
      <span v-if="nodeKey !== undefined" class="json-node__property">
        <span
          class="json-node__key"
          :class="{ 'json-node__key--index': typeof nodeKey === 'number' }"
        >
          {{ keyText }}
        </span>
        <span class="json-node__punctuation">:</span>
      </span>
      <span class="json-node__value">
        <span class="json-node__punctuation">{{ openingToken }}</span>
        <span v-if="!isExpanded || !isExpandable" class="json-node__summary">
          {{ containerSummary }}
        </span>
        <span v-if="!isExpanded || !isExpandable" class="json-node__punctuation">
          {{ closingToken }}
        </span>
      </span>
    </button>

    <div v-else class="json-node__row">
      <span class="json-node__disclosure-placeholder" aria-hidden="true" />
      <span v-if="nodeKey !== undefined" class="json-node__property">
        <span
          class="json-node__key"
          :class="{ 'json-node__key--index': typeof nodeKey === 'number' }"
        >
          {{ keyText }}
        </span>
        <span class="json-node__punctuation">:</span>
      </span>
      <span class="json-node__primitive" :class="`json-node__primitive--${primitiveType}`">
        {{ primitiveText }}
      </span>
    </div>

    <div v-if="isContainer && isExpanded && isExpandable" class="json-node__children">
      <TerminalJsonNode
        v-for="entry in entries"
        :key="`${depth}-${entry.key}`"
        :value="entry.value"
        :node-key="entry.key"
        :depth="depth + 1"
        :expansion-mode="expansionMode"
        :expansion-version="expansionVersion"
      />
    </div>
    <div v-if="isContainer && isExpanded && isExpandable" class="json-node__closing">
      <span class="json-node__disclosure-placeholder" aria-hidden="true" />
      <span class="json-node__punctuation">{{ closingToken }}</span>
    </div>
  </div>
</template>

<style scoped>
.json-node {
  width: max-content;
  min-width: 100%;
  color: var(--terminal-text);
}

.json-node__row,
.json-node__closing {
  display: flex;
  min-height: 1.5rem;
  align-items: center;
  gap: 0.38rem;
  padding: 0.05rem 0.2rem;
  line-height: 1.45;
}

.json-node__row--container {
  width: 100%;
  border: 0;
  border-radius: 0.25rem;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.json-node__row--container:hover:not(:disabled) {
  background: var(--terminal-accent-soft);
}

.json-node__row--container:focus-visible {
  outline: 1px solid var(--terminal-accent);
  outline-offset: -1px;
}

.json-node__row--static {
  cursor: default;
}

.json-node__disclosure,
.json-node__disclosure-placeholder {
  width: 0.8rem;
  height: 0.8rem;
  flex: none;
}

.json-node__disclosure {
  color: var(--terminal-muted);
}

.json-node__key {
  color: var(--terminal-accent);
  font-weight: 600;
}

.json-node__key--index {
  color: var(--terminal-muted);
  font-weight: 400;
}

.json-node__property,
.json-node__value {
  display: inline-flex;
  gap: 0.12rem;
  align-items: baseline;
}

.json-node__value {
  gap: 0.35rem;
}

.json-node__punctuation,
.json-node__summary {
  color: var(--terminal-muted);
}

.json-node__summary {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.66rem;
}

.json-node__primitive {
  max-width: min(46rem, 64vw);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.json-node__primitive--string {
  color: var(--terminal-success);
}

.json-node__primitive--number {
  color: var(--terminal-warning);
}

.json-node__primitive--boolean {
  color: color-mix(in srgb, var(--terminal-accent) 66%, var(--terminal-error));
}

.json-node__primitive--null {
  color: var(--terminal-muted);
  font-style: italic;
}

.json-node__children {
  margin-left: 0.6rem;
  padding-left: 0.62rem;
  border-left: 1px solid var(--terminal-line);
}
</style>
