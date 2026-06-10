export function replayAnimations(element: Element) {
  for (const animation of element.getAnimations()) {
    animation.cancel()
    animation.play()
  }
}
