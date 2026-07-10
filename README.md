# Chris

This is my personal website, built with Nuxt, Vue, UnoCSS, and Nitro SSR.

## Development

```bash
pnpm install
pnpm run dev
```

## Photos

Photo metadata and compressed assets are generated explicitly instead of during install:

```bash
pnpm run prepare:photos
```

Keep original photos in `photos/originals/`. That directory is ignored and is only used as the local source for generating `server/utils/data.ts`, `public/photos/compressed`, and `public/photos/thumb`. Commit the generated metadata and optimized images, not the originals.

## Checks

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
```

The app uses Nuxt file-based routing, Nuxt Content for Markdown posts, and Nitro server routes for
the GitHub and photo APIs.

## Activity

![Alt](https://repobeats.axiom.co/api/embed/97840bd668db10f4af44102c3bff2b93b2917fca.svg 'Repobeats analytics image')
