export default defineNuxtPlugin(() => {
  const route = useRoute()
  if (route.path.startsWith('/admin')) return

  const { start } = useSiteStats()
  const scope = effectScope()
  // Keep SSR footer values stable through hydration and let the first render
  // finish before opening analytics connections. Retain cleanup ownership.
  onNuxtReady(() => scope.run(start))
  onScopeDispose(() => scope.stop())
})
