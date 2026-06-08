const language2Color: Record<string, string> = {
  vue: '#41b883',
  typescript: '#3178c6',
  javascript: '#f1e05a',
  html: '#e34c26',
  css: '#563d7c',
  scss: '#c6538c',
  python: '#3572a5',
  shell: '#89e051',
  'c++': '#f34b7d',
  c: '#555555',
  'c#': '#178600',
  java: '#b07219',
  php: '#4F5D95',
  ruby: '#701516',
  go: '#00ADD8',
  rust: '#dea584',
  dart: '#00B4AB',
  swift: '#ffac45',
  kotlin: '#F18E33',
  'objective-c': '#438eff',
  'jupyter notebook': '#DA5B0B',
  dockerfile: '#384d54',
  makefile: '#427819',
}

export function getLanguageColor(language: string) {
  return language2Color[language.toLowerCase()] || '#ddd'
}

export function getDataUrlFromArr(arr: Uint8ClampedArray, w: number, h: number) {
  if (typeof w === 'undefined' || typeof h === 'undefined') w = h = Math.sqrt(arr.length / 4)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  canvas.width = w
  canvas.height = h

  const imgData = ctx.createImageData(w, h)
  imgData.data.set(arr)
  ctx.putImageData(imgData, 0, 0)

  return canvas.toDataURL()
}
