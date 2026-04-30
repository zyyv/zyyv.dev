export async function proseHeadingClick(event: MouseEvent, id: string) {
  event.preventDefault()
  window.history.replaceState(null, '', `#${id}`)

  const element = document.getElementById(id)
  if (element) {
    window.scrollTo({
      top: element.offsetTop - 86, // header height + 16px
      behavior: 'smooth',
    })
  }
}
