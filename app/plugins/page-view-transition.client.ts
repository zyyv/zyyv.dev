export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:view-transition:start', (transition) => {
    document.documentElement.dataset.pageTransition = 'active'

    void transition.finished.finally(() => {
      delete document.documentElement.dataset.pageTransition
    })
  })
})
