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

In development, Nuxt runs with its normal local Node preset so Nuxt Content uses local SQLite.
Nitro proxies the photo APIs and assets to `https://zyyv.dev`, keeping the admin UI and hot module
replacement local while authentication and photo CRUD run in the deployed Worker against
Cloudflare D1 and R2. Start it with `pnpm dev`, then open `/admin/photos` on the local URL. CRUD
performed from the local admin page changes remote data; use it with the same care as the
deployed admin page.

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
- Maximum original size: 50 MB
- The browser creates the compressed and thumbnail variants before upload so originals larger
  than the Images binding's 20 MB input limit are supported
- The three files are sent to R2 in separate sequential requests, then a small finalize request
  writes the D1 record. This avoids parsing one large multipart body inside the Worker.
- Compressed variant: WebP, maximum width 2560 px, quality 80
- Thumbnail variant: WebP, maximum width 600 px, quality 80
- R2 keys are scoped by a server-generated upload UUID
- EXIF and BlurHash are extracted from the original in the browser before upload

In production, `/api/photos?all=1` reads all non-private records from D1. The response uses a
short browser cache and a longer CDN cache with stale-while-revalidate. Compressed and thumbnail
URLs point directly to `https://img.zyyv.dev` and are uploaded with a one-year immutable cache.
During local development, Nitro proxies the endpoint to the deployed Worker.

## Cache rules

R2 object metadata and the public API response already send cache headers, but the zone must also
make both routes eligible for Cloudflare edge caching. Create a Cache Rule matching:

```text
(http.host eq "img.zyyv.dev") or
(http.host eq "zyyv.dev" and http.request.uri.path eq "/api/photos")
```

Use these settings:

- Cache eligibility: Eligible for cache
- Edge TTL: Use cache-control header if present
- Browser TTL: Respect origin

After deploying and enabling the rule, request the same image twice and verify that
`cf-cache-status` changes from `MISS` to `HIT`. The uploaded compressed and thumbnail objects use
one-year immutable URLs; `/api/photos` uses a 60-second browser TTL and a 5-minute edge TTL with
stale-while-revalidate.
