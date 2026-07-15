# Photo admin setup

The admin page is available at `/admin/photos`. It stores metadata in D1 and the original,
compressed, and thumbnail variants in R2.

## Cloudflare bindings

Configure these bindings on the deployed Worker:

- `DB`: D1 database `zyyv_dev`
- `PHOTOS`: R2 bucket `photos`
- `IMAGES`: Cloudflare Images binding

Bindings are capabilities and do not need access keys in application code. The checked-in
`wrangler.jsonc` is the source of truth for local development and deployment.

Deploy the Nuxt application as a Cloudflare Worker with Static Assets. Cloudflare Pages does not
support the Images binding used for server-side image transforms.

```sh
pnpm build
pnpm wrangler deploy
```

Apply the initial schema:

```sh
pnpm wrangler d1 migrations apply zyyv_dev --remote
```

## Secrets

Set the following as encrypted Cloudflare environment variables. For local Nuxt development,
copy `.env.example` to `.env`.

- `NUXT_ADMIN_PASSWORD`: password for `/admin/photos`
- `NUXT_SESSION_SECRET`: a random string of at least 32 characters used to sign the HttpOnly cookie

No R2 access key, account ID, or D1 API token is used by the application.

## Upload behavior

- Input formats: JPEG, PNG, WebP
- Maximum original size: 20 MB (the Images binding input limit)
- Compressed variant: maximum width 2560 px, quality 80 where applicable
- Thumbnail variant: maximum width 600 px, quality 80 where applicable
- R2 names: `[name].compressed.[ext]` and `[name].thumbnail.[ext]`
- EXIF and BlurHash are extracted from the original in the browser before upload

The public `/api/photos-data.json` and `/api/photos` endpoints read non-private records from D1
when the binding is available. During a normal local Nuxt session without Cloudflare bindings,
they keep using the existing generated photo data.
