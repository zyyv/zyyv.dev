<script setup lang="ts">
const props = defineProps({
  code: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: null,
  },
  filename: {
    type: String,
    default: null,
  },
  highlights: {
    type: Array as () => number[],
    default: () => [],
  },
  meta: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: null,
  },
})

const { copy, copied } = useClipboard()
const icon = computed(() => getLangIcon(props.language, props.filename))
</script>

<template>
  <div b="~ gray:20" my="1em" rd=".375rem" of-hidden class="group">
    <div v-if="icon" p="x4 y1.5" fsc gap-2 pr text-sm>
      <i :class="icon" />
      {{ filename ? filename : language === 'bash' ? 'Terminal' : '' }}
      <i :class="copied ? 'i-carbon:checkmark' : 'i-carbon:copy'" pa text-xs right-4 trans op-0 group-hover:op-100 cursor-pointer @click="copy(code)" />
    </div>
    <pre :class="$props.class"><slot /></pre>
  </div>
</template>

<style>
:is([prose=""], .prose) pre {
  background: #eeed !important;
  margin: 0;
  border-radius: 0;
  padding: 1em;
}

pre code .line {
  display: block;
}

pre code .highlight {
  background: #0001 !important;
}

.dark :is([prose=""], .prose) {
  pre {
    background: #222 !important;
  }

  pre code .highlight {
    background: #fff2 !important;
  }
}
</style>
