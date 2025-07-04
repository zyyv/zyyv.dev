import type { UsefulTheme } from 'unocss-preset-useful'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'
import { symbols } from '@unocss/core'
import { defineUsefulConfig } from 'unocss-preset-useful'

export default defineUsefulConfig<UsefulTheme>({
  theme: {
    extend: {
      animation: {
        shape: 'shape 5s linear infinite',
      },
      keyframes: {
        shape: {
          '0%,100%': {
            'border-radius': '42% 58% 70% 30% / 45% 45% 55% 55%',
            'transform': 'translate3d(0,0,0) rotateZ(0.01deg)',
          },
          '34%': {
            'border-radius': '70% 30% 46% 54% / 30% 29% 71% 70%',
            'transform': 'translate3d(0,5px,0) rotateZ(0.01deg)',
          },
          '50%': {
            transform: 'translate3d(0,0,0) rotateZ(0.01deg)',
          },
          '67%': {
            'border-radius': '100% 60% 60% 100% / 100% 100% 60% 60%',
            'transform': 'translate3d(0,-3px,0) rotateZ(0.01deg)',
          },
        },
      },
    },
  },
  icons: {
    extraProperties: {
      'display': 'inline-block',
      'height': '1.2em',
      'width': '1.2em',
      'vertical-align': 'text-bottom',
    },
    collections: {
      'my-logos': FileSystemIconLoader('./public/logos'),
      'custom': {
        post: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.906 17.505L5.337 3.718a2 2 0 0 1 2.317-1.623L19.472 4.18a2 2 0 0 1 1.622 2.317l-2.431 13.787a2 2 0 0 1-2.317 1.623L4.528 19.822a2 2 0 0 1-1.622-2.317Z"/><path stroke-linecap="round" d="m8.929 6.382l7.879 1.389m-8.574 2.55l7.879 1.39M7.54 14.26l4.924.869"/></g></svg>',
        package: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 22c-.818 0-1.6-.33-3.163-.99C4.946 19.366 3 18.543 3 17.16V7m9 15c.818 0 1.6-.33 3.163-.99C19.054 19.366 21 18.543 21 17.16V7m-9 15V11.355M8.326 9.691L5.405 8.278C3.802 7.502 3 7.114 3 6.5s.802-1.002 2.405-1.778l2.92-1.413C10.13 2.436 11.03 2 12 2s1.871.436 3.674 1.309l2.921 1.413C20.198 5.498 21 5.886 21 6.5s-.802 1.002-2.405 1.778l-2.92 1.413C13.87 10.564 12.97 11 12 11s-1.871-.436-3.674-1.309M6 12l2 1m9-9L7 9" color="currentColor"/></svg>',
        ppt: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M13.586 2a2 2 0 0 1 1.284.467l.13.119L19.414 7a2 2 0 0 1 .578 1.238l.008.176V20a2 2 0 0 1-1.85 1.995L18 22H6a2 2 0 0 1-1.995-1.85L4 20V4a2 2 0 0 1 1.85-1.995L6 2zM12 4H6v16h12V10h-4.5a1.5 1.5 0 0 1-1.493-1.356L12 8.5zm.5 7a2.5 2.5 0 0 1 0 5H11v1a1 1 0 1 1-2 0v-4.9a1.1 1.1 0 0 1 1.1-1.1zm0 2H11v1h1.5a.5.5 0 0 0 .09-.992zM14 4.414V8h3.586z"/></g></svg>',
        github: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M10 20.568c-3.429 1.157-6.286 0-8-3.568"/><path d="M10 22v-3.242c0-.598.184-1.118.48-1.588c.204-.322.064-.78-.303-.88C7.134 15.452 5 14.107 5 9.645c0-1.16.38-2.25 1.048-3.2c.166-.236.25-.354.27-.46c.02-.108-.015-.247-.085-.527c-.283-1.136-.264-2.343.16-3.43c0 0 .877-.287 2.874.96c.456.285.684.428.885.46s.469-.035 1.005-.169A9.5 9.5 0 0 1 13.5 3a9.6 9.6 0 0 1 2.343.28c.536.134.805.2 1.006.169c.2-.032.428-.175.884-.46c1.997-1.247 2.874-.96 2.874-.96c.424 1.087.443 2.294.16 3.43c-.07.28-.104.42-.084.526s.103.225.269.461c.668.95 1.048 2.04 1.048 3.2c0 4.462-2.134 5.807-5.177 6.643c-.367.101-.507.559-.303.88c.296.47.48.99.48 1.589V22"/></g></svg>`,
      },
    },
  },
  typography: true,
}, {
  rules: [
    // 隐藏滚动条
    ['scroll-none', [
      {
        'scrollbar-width': 'none',
        '-ms-overflow-style': 'none',
      },
      {
        [symbols.selector]: s => `${s}::-webkit-scrollbar`,
        display: 'none',
      },
    ]],
  ],
  shortcuts: [
    {
      'page-container': 'container mx-auto my-4',
      'quadrant': 'overflow-auto scroll-none @container',
    },
    ['text-basecolor', 'text-dark-800 dark:text-stone-300'],
    ['bg-basecolor', 'bg-light-300 dark:bg-dark-800'],

    ['linear-text', 'text-transparent bg-clip-text bg-linear-to-r'],
    ['text-p-r', 'linear-text from-purple to-red'], // test case

    ['icon', 'size-5.5 cursor-pointer select-none transition-opacity-300 ease-in-out text-basecolor'],
    ['icon-btn', 'icon color-inherit op64 hover-op100 hover-color-teal-500 dark-hover-color-inherit'],
    ['icon-link', 'icon color-inherit op64 hover:op100 hover-text-red-300 dark-hover-color-inherit'],
    ['icon-text', 'color-inherit op64 hover:op100 hover-text-purple dark-hover-color-inherit'],
    ['linkWithIcon', 'trans'],

    ['header-anchor', 'float-left mt-[0.125em] ml-[-0.8em] pr-[0.2em] text-[0.85em] op-0 group-hover-op-60 fw-600'],
  ],
  theme: {
    font: {
      dank: 'dank',
      dm: 'DM Sans',
    },
    colors: {
      context: 'rgba(var(--c-context),%alpha)',
      unocss: {
        DEFAULT: '#818181',
        from: '#ccc',
        via: '#858585',
        to: '#4d4d4d',
      },
      elk: '#c18139',
      onuui: {
        from: '#acc1ee',
        to: '#c084fc',
      },
      unpreset: {
        from: '#ff5c5c',
        to: '#dbe74f',
      },
      vite: {
        from: '#41d1ff',
        to: '#bd34fe',
      },
      vitest: {
        from: '#FCC72B',
        to: '#729B1B',
      },
      vue: '#64b687',
      nuxt: '#64d98a',
      bilibili: '#ed7099',
      bluesky: '#1185fe',
    },
  },
})
