# Chris

This is my personal website, built with Nuxt, Vue, UnoCSS, and Nitro SSR.

## Development

```bash
pnpm install
pnpm run dev
```

## Photos

Upload local source photos to the managed D1 + R2 photo library:

```bash
pnpm run upload:local-photos
```

Keep source photos in `local/` (or set `PHOTO_SOURCE_DIR`). The upload script creates optimized
variants and sends the original, compressed image, thumbnail, and metadata to D1 + R2. The site
loads the photo list through `/api/photos`; generated photo files are not committed under
`public/`.

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
