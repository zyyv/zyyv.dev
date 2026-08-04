export default defineNuxtPlugin(() => {
  const route = useRoute()
  if (route.path.startsWith('/admin')) return

  const { start } = useSiteStats()
  start()
})
