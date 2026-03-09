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
- Copy `apps/web/.env.example` to `apps/web/.env.local`

4. Run API:
- `pnpm dev:api`
- API listens on `http://localhost:4000` and `http://<your-lan-ip>:4000`

5. Run web:
- `pnpm dev:web`
- Web listens on `http://localhost:3000` and `http://<your-lan-ip>:3000`

If you want to open from another device on your network, use your PC local IP (for example `192.168.1.24:3000`).

## Cloudflare deploy

See [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md) for Git-based auto-deploy of API and web.
