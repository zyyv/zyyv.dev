<script setup lang="ts">
import { stagger, useAnimate, useInView, useReducedMotion } from 'motion-v'

const props = withDefaults(
  defineProps<{
    as?: 'div' | 'section' | 'header' | 'article' | 'aside' | 'li' | 'p'
    /** Delay in seconds, matching Motion's API. */
    delay?: number
  }>(),
  { as: 'div', delay: 0 },
)

const [scope, animate] = useAnimate()
const reducedMotion = useReducedMotion()
const observedScope = computed(() =>
  import.meta.client && 'IntersectionObserver' in window && scope.value instanceof HTMLElement
    ? scope.value
    : undefined,
)
const isInView = useInView(observedScope, { once: true, amount: 0.01 })
let hasPlayed = false
let cleanups: Array<() => void> = []

function finish() {
  hasPlayed = true
  cleanups.forEach((cleanup) => cleanup())
  cleanups = []
}

function reveal() {
  if (hasPlayed || !scope.value) return
  const root = scope.value
  if (reducedMotion.value || root.contains(document.activeElement)) {
    finish()
    return
  }
  hasPlayed = true

  // Nested groups own their own sequence. Only explicitly marked content moves.
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-motion-reveal]')).filter(
    (target) => target.closest('[data-motion-group]') === root,
  )
  const delay = Number.isFinite(props.delay) ? Math.min(0.8, Math.max(0, props.delay)) : 0
  const staggerDelay = stagger(0.15, { startDelay: delay })

  targets.forEach((target, index) => {
    const computedStyle = getComputedStyle(target)
    const original = ['opacity', 'translate'].map((property) => ({
      property,
      value: target.style.getPropertyValue(property),
      priority: target.style.getPropertyPriority(property),
    }))
    const controls = animate(
      target,
      {
        opacity: [0, Number(computedStyle.opacity)],
        translate: [
          '0px 22px',
          computedStyle.translate === 'none' ? '0px 0px' : computedStyle.translate,
        ],
      },
      {
        duration: 1.15,
        delay: staggerDelay(Math.min(index, 10), targets.length),
        ease: [0.22, 0.61, 0.36, 1],
      },
    )
    let restored = false
    const restore = () => {
      if (restored) return
      restored = true
      controls.stop()
      // Release inline values so theme, tag dimming and hover CSS stay in control.
      original.forEach(({ property, value, priority }) => {
        if (value) target.style.setProperty(property, value, priority)
        else target.style.removeProperty(property)
      })
    }
    cleanups.push(restore)
    void controls.finished.then(restore, restore)
  })
}

watch(isInView, (visible) => {
  if (visible) reveal()
})
watch(reducedMotion, (reduce) => {
  if (reduce) finish()
})
onBeforeUnmount(finish)
</script>

<template>
  <component :is="as" ref="scope" data-motion-group @focusin="finish" @pointerdown="finish">
    <slot />
  </component>
</template>
