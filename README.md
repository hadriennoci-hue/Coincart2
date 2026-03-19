# Coincart Monorepo

Monorepo scaffold for:
- `apps/web` Next.js storefront
- `apps/admin` admin/backoffice
- `apps/api` Hono API
- `packages/db` Drizzle + Postgres schema
- `packages/core` business logic
- `packages/types` shared API contracts (Zod)
- `packages/payments` BTCPay adapter interface

## Launch model implemented

- Single store
- Guest checkout (`email` required, `phone` optional)
- Fiat prices (`USD`, `EUR`)
- External sync is source of truth
- Sync batch finalize sets untouched SKUs to out of stock
- BTCPay webhook idempotency

## Security model for sync endpoints

- `Authorization: Bearer <api_key_id>`
- `X-Timestamp`
- `X-Nonce`
- `X-Signature` = `hex(HMAC_SHA256(rawBody + "." + timestamp + "." + nonce, api_key_secret))`

Store hashes of used nonces and reject replay.

## Run locally

Prerequisites:
- Node.js 20+
- `pnpm` installed globally

1. Install deps:
- `pnpm install`

2. Database (choose one):
- Local Postgres on your machine: create DB `coincart` and use connection string below.
- Docker Postgres (optional): `docker compose up -d`

3. Configure env:
- Copy `apps/api/.env.example` to `apps/api/.env`
- Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` for local BTCPay/worker secrets
- Copy `apps/web/.env.example` to `apps/web/.env.local`
- `apps/api/.env` is for local development only.

4. Run API:
- `pnpm dev:api`
- API listens on `http://localhost:4000` and `http://<your-lan-ip>:4000`

5. Run web:
- `pnpm dev:web`
- Web listens on `http://localhost:3000` and `http://<your-lan-ip>:3000`

If you want to open from another device on your network, use your PC local IP (for example `192.168.1.24:3000`).

## Cloudflare deploy

See [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md) for Git-based auto-deploy of API and web.

## Session Handoff (Quick Context)

Updated: 2026-03-17

### Current runtime topology
- Frontend: `apps/web` (Next.js) on Cloudflare Pages / Edge runtime.
- API: `apps/api` (Hono Worker) exposed at:
- `https://coincart-api.hadrien-noci.workers.dev`
- Storefront domain:
- `https://coincart.store`
- R2 image domain:
- `https://img.coincart.store`

### Databases and data stores
- Main SQL database (production): Neon Postgres (Cloud-hosted).
- Role: products, prices, orders, mappings, sync logs, attributes, collections.
- Connection string is managed as `DATABASE_URL` in runtime secrets (not committed).
- The real production catalog is not stored in `apps/api/.env`; that file is only a local dev fallback.
- Cloudflare R2 bucket: `coincart2`.
- Role: image object storage behind `img.coincart.store`.
- Verified custom domain binding:
- bucket `coincart2` <-> `img.coincart.store` (`ssl: active`, `ownership: active`).

### Cloudflare access verified in this session
- Token validity: confirmed active via `/user/tokens/verify`.
- Works:
- list accounts/zones
- list Workers scripts
- list Workers routes
- list R2 buckets
- inspect R2 custom domains
- upload R2 objects (PUT object key)
- Does not work with current token:
- Zone DNS records API (`/zones/:id/dns_records`) -> authentication error
- Implication: app/worker/R2 operations are available; direct DNS edits may require broader token scope.

### Important production fixes applied recently
- Image outage root cause on `img.coincart.store`: missing R2 object keys (not host downtime).
- Confirmed missing key with API error `10007 The specified key does not exist`.
- Patched one required key directly in R2:
- `dummy/laptops/wizhard-main.jpg` now returns `200`.
- Web safety patch added:
- `/api/image-proxy` route proxies `img.coincart.store` images and falls back gracefully when origin object is missing.
- Cart speed was improved with local snapshot-first behavior.
- Cart price bug fixed:
- if live API price is missing/zero, cart now falls back to valid snapshot price instead of `0`.
- Product image gallery fix applied on 2026-03-17:
- deployed API commit `ed3e461`
- confirmed production Worker reads from Neon, not local localhost Postgres
- applied `packages/db/migrations/0015_product_image_gallery.sql` on the live Neon database
- `products.image_urls` now exists in production and catalog product endpoints return `imageUrls`

### Known caveats still relevant
- Coincart connector/variant flow had prior inconsistencies (parent/variant modeling and flaky 500s).
- Worker observability previously showed request hangs on some connector GET paths.
- Some image paths may still 404 until corresponding objects are uploaded to R2.

### Secrets and local state conventions
- Keep secrets only in ignored files / env vars:
- `apps/api/.dev.vars` (already gitignored) can hold local Cloudflare token for operator actions.
- `apps/api/.dev.vars` can also hold local BTCPay secrets for `wrangler dev` and `pnpm dev:api`.
- Do not commit tokens, keys, DB URLs.
