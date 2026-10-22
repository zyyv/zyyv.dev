---
name: zyyv-motion
description: Create, adjust, or review Motion for Vue animations in zyyv.dev, including element entrances, staggered sequences, and interactive transitions. Use for motion work in this Nuxt/Vue project; skip content-only changes and unrelated GPU rendering.
---

# zyyv.dev motion

Use `motion-v`, the official Motion for Vue package, for new orchestrated UI animations. The project uses Vue Composition API, TypeScript, and Nuxt. Import Motion APIs explicitly; there is no `motion-v/nuxt` module configured.

## Existing entrance system

`app/components/motion/MotionRevealGroup.vue` uses `useAnimate`, `useInView`, `useReducedMotion`, and `stagger` from `motion-v`. Reuse it for editorial content entrances. It renders the semantic element selected by `as`, so it adds no extra layout wrapper.

```vue
<script setup lang="ts">
import MotionRevealGroup from '~/components/motion/MotionRevealGroup.vue'
</script>

<template>
  <MotionRevealGroup as="section" :delay="0.1">
    <h2 data-motion-reveal>Section title</h2>
    <p data-motion-reveal>Supporting description.</p>
    <nav>
      <a href="/posts" data-motion-reveal data-cuelume-toggle="page" data-cuelume-hover="tick">
        Read posts
      </a>
    </nav>
  </MotionRevealGroup>
</template>
```

- `as` supports `div`, `section`, `header`, `article`, `aside`, `li`, and `p`; extend the typed union when another semantic element is needed.
- `delay` is in **seconds**, like Motion transitions. Do not copy the old directive's millisecond values.
- Mark the smallest meaningful reading units with `data-motion-reveal`: title phrases, descriptions, individual links, cover, and metadata. Sequence order follows DOM order. Do not mark both an ancestor and its child, which would double their movement and opacity.
- Each group starts once on entering the viewport; nested groups own their marked descendants. For long lists, use one group per row/card, not one group around the entire list. Async content should mount its group with its targets; the component does not observe later-added descendants.

## Project motion taste

The user prefers slower, connected, sequential entrances over entire blocks appearing together. Current starting values are 1.15 seconds per item, 0.15 seconds between items, 22px vertical travel, and easing `[0.22, 0.61, 0.36, 1]`. These are tunable project defaults, not requirements for every interaction. Keep overlap between adjacent items and bound list delays so lower items do not wait several seconds.

The home sequence is avatar → title phrases → signature → individual social icons. Cards reveal cover → title → description → metadata. Preserve typography, wrapping, and semantic reading order when splitting content; do not split every character by default.

Apply entrances to public editorial headings, filters, calls to action, status/empty copy, and fixed utility text such as the post table of contents. Keep long-form article paragraphs immediately readable; leave virtualized photo grids, GPU canvases, photo view transitions, and the bookmark canvas itself to their dedicated interaction systems.

## Implementation choices and invariants

- For existing entrance groups, prefer the shared component. For state-driven UI, use `motion` components with `animate`, variants, `whileInView`, or `AnimatePresence` when they fit. Import `motion` from `motion-v`; do not use React syntax or `@vueuse/motion` examples.
- Keep timing and playback in Motion. Do not reintroduce the removed `v-reveal` directive, direct `Element.animate()` entrance code, or a second animation library.
- Preserve the shared component's visible SSR baseline: content must remain readable before hydration, without JavaScript, and when IntersectionObserver is unavailable. Do not blanket-hide page content in CSS. It measures destination opacity and releases its temporary inline styles so muted text and tag filtering continue to work.
- Respect `useReducedMotion()` initially and if the preference changes. Focus or pointer activation must reveal pending content immediately. Release animations on unmount. Passive entrances are silent.
- Avoid competing owners for a CSS property. The shared component animates individual CSS `translate`, preserving existing `transform` effects on project previews, avatar artwork, and links. Do not also animate those same properties on the same node with CSS or another Motion controller.
- Preserve current photo view transitions, GPU scenes, and existing decorative CSS animations unless the task explicitly concerns them. Simple CSS color/hover transitions can remain CSS.
- Preserve existing `data-cuelume-*` attributes when changing tags/components. For new controls, use `.agents/skills/zyyv-interaction-sounds/SKILL.md` to choose feedback; never add sound just because an entrance plays.

## Verify and consult current docs

Run project lint/format and type checks (`pnpm lint`, `pnpm typecheck`) unless the user limits verification. Inspect the affected page for visible content, correct ordering, navigation, and console errors. For changes to the shared engine, check reduced motion, keyboard access during delays, scrolling, and teardown when feasible; report any unverified behavior accurately.

Consult the installed package types when a live documentation example differs from this version. Relevant official references:

- [Vue animation and variants](https://motion.dev/docs/vue-animation)
- [Vue motion component](https://motion.dev/docs/vue-motion-component)
- [Scoped useAnimate](https://motion.dev/docs/vue-use-animate)
- [useInView](https://motion.dev/docs/vue-use-in-view)
- [useReducedMotion](https://motion.dev/docs/vue-use-reduced-motion)
- [stagger](https://motion.dev/docs/stagger)
