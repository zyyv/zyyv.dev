---
name: zyyv-interaction-sounds
description: Add and review Cuelume interaction sounds in this Nuxt/Vue project when creating or editing pages and components with user interactions. Skip content-only changes with no interactive UI.
---

# zyyv.dev interaction sounds

Keep new UI consistent with the project's existing Cuelume sound system. Every new interactive surface must be audited before the work is considered complete.

## Existing setup

- `cuelume` is already a runtime dependency in `package.json`.
- `app/plugins/interaction-sounds.client.ts` imports `bind`, binds the whole document once, sets the global volume to `0.42`, and plays `arrival` after client-side route changes.
- Cuelume synthesizes sounds with Web Audio; do not add `.mp3`, `.wav`, or another audio engine for ordinary UI feedback.
- The package is ESM-only and SSR-safe to import. Browser-only behavior belongs in the existing `.client.ts` plugin or in user-triggered handlers.
- Official reference: https://github.com/Danilaa1/cuelume

## Required workflow for new pages/components

1. Scan the template for every interactive element: `<button>`, `<a>`, `<NuxtLink>`, custom `role="button"` elements, toggles, dialogs, gallery controls, async actions, copy/share actions, and retry buttons.
2. Put one appropriate `data-cuelume-*` attribute on the actual interactive DOM element. Do not put the attribute only on a wrapper `<div>`.
3. For an action with a meaningful async result, use `play()` after the result resolves. Play `success` only on success and `error` only in the failure path.
4. Check that the interaction is not double-triggered by multiple Cuelume attributes. Prefer `data-cuelume-toggle` for native buttons because it also responds to keyboard activation.
5. Re-scan the finished diff for newly added interactive elements without a sound mapping.

## Sound mapping

Use these project conventions unless the interaction clearly needs another sound from Cuelume:

| Interaction                                                    | Attribute             | Sound     |
| -------------------------------------------------------------- | --------------------- | --------- |
| Navigation or meaningful link hover                            | `data-cuelume-hover`  | `tick`    |
| External link or secondary open action                         | `data-cuelume-toggle` | `scan`    |
| Theme, view, tab, filter, accordion, or preview switch         | `data-cuelume-toggle` | `toggle`  |
| Photo/gallery/page navigation or opening a visual detail       | `data-cuelume-toggle` | `page`    |
| Primary action, submit, retry, zoom, create, or upload control | `data-cuelume-toggle` | `pulse`   |
| Close, back, dismiss, reset, or destructive confirmation       | `data-cuelume-toggle` | `droplet` |
| Reaction or playful accent                                     | `data-cuelume-toggle` | `sparkle` |

Use `press` and `release` attributes only for controls that genuinely benefit from separate pointer-down and pointer-up feedback. Do not add hover cues to dense photo grids, rapidly moving canvas nodes, scrolling surfaces, or repeated list items; click feedback is enough there.

## Imperative feedback

Use `play` for state transitions that cannot be represented by a static data attribute:

```ts
import { play } from 'cuelume'

async function copyLink() {
  try {
    await copy(url)
    play('success', { volume: 0.85 })
  } catch {
    play('error', { volume: 0.85 })
  }
}
```

Keep calls inside event handlers or client-only code. Do not play sounds during SSR, on passive rendering, or merely because a component mounted. Initial page load should remain quiet; the global plugin already handles later client-side arrivals.

## Vue/Nuxt implementation rules

- Use `<script setup lang="ts">` and keep sound side effects out of computed getters.
- Keep sound logic in a focused composable when it is reused or stateful. For one small action, an event handler may call `play()` directly.
- Preserve explicit props-down/events-up contracts. If a shared component needs different sound semantics, add a typed sound prop or an explicit attribute contract instead of coupling it to a parent route.
- For custom `role="button"` elements, preserve Enter/Space keyboard behavior; `data-cuelume-toggle` follows the native click event and should not replace accessibility behavior.
- Keep SSR-safe imports and do not read `window`, `document`, or `navigator` during server rendering.

## Completion checklist

Before handing off a UI change:

- [ ] Every new interactive element has an intentional cue or is explicitly documented as silent.
- [ ] Dense/repeated surfaces are not noisy from hover feedback.
- [ ] Async success/error cues occur only after the operation outcome is known.
- [ ] No interaction has accidentally stacked multiple cues for the same click.
- [ ] `node_modules/.bin/oxlint .` passes.
- [ ] `node_modules/.bin/oxfmt --check .` passes.
- [ ] `node_modules/.bin/nuxt typecheck` passes.
