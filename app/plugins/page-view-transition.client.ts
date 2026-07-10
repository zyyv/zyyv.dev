export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:view-transition:start', (transition) => {
    document.documentElement.dataset.pageTransition = 'active'

    const cleanup = () => {
      delete document.documentElement.dataset.pageTransition
    }

    void transition.finished.then(cleanup, cleanup)
  })
})
