# Chris

Este es mi sitio web personal, construido con Nuxt, Vue, UnoCSS y Nitro SSR.

## Desarrollo

```bash
pnpm install
pnpm run dev
```

## Fotos

Sube las fotos locales a la biblioteca de fotos gestionada con D1 + R2:

```bash
pnpm run upload:local-photos
```

Mantén las fotos originales en `local/` (o establece `PHOTO_SOURCE_DIR`). El script de subida crea variantes optimizadas y envía la imagen original comprimida, la miniatura y los metadatos a D1 + R2. El sitio carga la lista de fotos a través de `/api/photos`; los archivos de fotos generados no se comprometen bajo `public/`.

## Verificaciones

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
```

La aplicación utiliza el enrutamiento basado en archivos de Nuxt, Nuxt Content para publicaciones en Markdown, y rutas del servidor Nitro para las APIs de GitHub y fotos.

## Actividad

![Alt](https://repobeats.axiom.co/api/embed/97840bd668db10f4af44102c3bff2b93b2917fca.svg 'Repobeats analytics image')
