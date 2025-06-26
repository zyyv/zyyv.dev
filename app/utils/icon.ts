// @unocss-include

const langIcons = {
// package managers
  pnpm: 'i-catppuccin:pnpm',
  npm: 'i-catppuccin:npm',
  yarn: 'i-catppuccin:yarn',
  bun: 'i-catppuccin:bun',
  deno: 'i-catppuccin:deno',
  // frameworks
  vue: 'i-catppuccin:vue',
  svelte: 'i-catppuccin:svelte',
  angular: 'i-catppuccin:angular',
  react: 'i-catppuccin:typescript-react',
  next: 'i-catppuccin:next',
  nuxt: 'i-catppuccin:nuxt',
  solid: 'i-catppuccin:solid',
  astro: 'i-catppuccin:astro',
  // bundlers
  rollup: 'i-catppuccin:rollup',
  webpack: 'i-catppuccin:webpack',
  vite: 'i-catppuccin:vite',
  esbuild: 'i-catppuccin:esbuild',
  bash: 'i-catppuccin:bash',
  // languages
  javascript: 'i-catppuccin:javascript',
  typescript: 'i-catppuccin:typescript',
  html: 'i-catppuccin:html',
  css: 'i-catppuccin:css',
}

const fileIcons = {
  'package.json': 'i-catppuccin:package-json',
  'tsconfig.json': 'i-catppuccin:typescript-config',
  '.npmrc': 'i-catppuccin:npm',
  '.editorconfig': 'i-catppuccin:editorconfig',
  '.eslintrc': 'i-catppuccin:eslint',
  '.eslintignore': 'i-catppuccin:eslint',
  'eslint.config': 'i-catppuccin:eslint',
  '.gitignore': 'i-catppuccin:git',
  '.gitattributes': 'i-catppuccin:git',
  '.env': 'i-catppuccin:env',
  '.env.example': 'i-catppuccin:env',
  '.vscode': 'i-catppuccin:vscode',
  'tailwind.config': 'i-catppuccin:tailwind',
  'uno.config': 'i-catppuccin:unocss',
  'vite.config': 'i-catppuccin:vite',
  'webpack.config': 'i-catppuccin:webpack',
  'esbuild.config': 'i-catppuccin:esbuild',
  'rollup.config': 'i-catppuccin:rollup',
  'jest.config': 'i-catppuccin:jest',
  'babel.config': 'i-catppuccin:babel',
}

const extIcons = {
  '.ts': 'i-catppuccin:typescript',
  '.tsx': 'i-catppuccin:typescript',
  '.mjs': 'i-catppuccin:javascript',
  '.cjs': 'i-catppuccin:javascript',
  '.json': 'i-catppuccin:json',
  '.js': 'i-catppuccin:javascript',
  '.jsx': 'i-catppuccin:javascript',
  '.md': 'i-catppuccin:markdown',
  '.py': 'i-catppuccin:python',
  '.ico': 'i-catppuccin:favicon',
  '.html': 'i-catppuccin:html',
  '.css': 'i-catppuccin:css',
  '.yml': 'i-catppuccin:yaml',
  '.yaml': 'i-catppuccin:yaml',
}

const iconMap = new Map<string, string>()

export function getLangIcon(lang?: string, filename?: string) {
  let icon
  if (filename) {
    const parts = filename.split('.')
    const ext = parts.pop()

    if (iconMap.has(filename) || iconMap.has(`.${ext}`)) {
      return iconMap.get(filename) ?? iconMap.get(`.${ext}`)
    }

    for (const key in fileIcons) {
      for (let i = 0; i < parts.length; i++) {
        const name = parts.slice(i).join('.')
        if (name.includes(key)) {
          icon = fileIcons[key as keyof typeof fileIcons]
          iconMap.set(filename, icon)
          return icon
        }
      }
    }

    if (!icon) {
      icon = extIcons[`.${ext}` as keyof typeof extIcons] ?? icon
      if (icon) {
        iconMap.set(`.${ext}`, icon)
        return icon
      }
    }
  }

  if (lang) {
    icon = langIcons[lang.toLowerCase() as keyof typeof langIcons] ?? icon
  }

  return icon
}
