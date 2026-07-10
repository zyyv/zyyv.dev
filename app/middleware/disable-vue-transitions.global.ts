export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || !document.startViewTransition) return

  to.meta.pageTransition = false
  to.meta.layoutTransition = false
})
