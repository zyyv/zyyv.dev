import { bind, play, setVolume } from 'cuelume'

export default defineNuxtPlugin((nuxtApp) => {
  // Keep the cues present but understated across a photo-heavy interface.
  setVolume(0.42)
  bind()

  let isInitialPage = true

  nuxtApp.hook('page:finish', () => {
    if (isInitialPage) {
      isInitialPage = false
      return
    }

    play('arrival', { volume: 0.7 })
  })
})
