# Cloudflare Auto-Deploy (Git) - Coincart

This repo is now prepared for Cloudflare deployment with:
- `apps/api` deployable as a Cloudflare Worker (`wrangler.toml`, Worker entrypoint).
- `apps/web` ready to consume a Cloudflare API URL via `NEXT_PUBLIC_API_BASE_URL`.

## 1. Push these changes to your Git repo

```bash
git add .
git commit -m "Prepare Cloudflare auto-deploy for web + api"
git push
```

## 2. Create a cloud Postgres database (required)

Cloudflare Workers cannot connect to your local `localhost:5432`.

Use a managed Postgres (Neon/Supabase/RDS/etc), then run migrations against it:

```bash
set DATABASE_URL=postgres://<user>:<pass>@<host>:5432/<db>
%APPDATA%\npm\pnpm.cmd --filter @coincart/db db:migrate
```

## 3. Deploy API on Cloudflare Workers with Git auto-deploy

1. Cloudflare Dashboard -> `Workers & Pages` -> `Create` -> `Import a repository`.
2. Select this repo.
3. For the Worker project:
   - Name: `coincart-api` (or your preferred name)
   - Root directory: `apps/api`
   - Build command: `pnpm install --frozen-lockfile`
4. Add runtime settings:
   - Variable: `CORS_ORIGIN` = `https://<your-web-url>`
   - Secret: `DATABASE_URL` = your managed Postgres URL
5. Set production branch (for example `main`) and enable automatic deployments.

Expected API URL format:
- `https://coincart-api.<your-subdomain>.workers.dev`

## 4. Deploy Web with Git auto-deploy

1. Cloudflare Dashboard -> `Workers & Pages` -> `Create` -> `Import a repository`.
2. Select this repo again (separate project for web).
3. Configure:
   - Project type: Pages/Next.js project
   - Root directory: `apps/web`
   - Build command: `pnpm install --frozen-lockfile && pnpm build`
4. Add env variable:
   - `NEXT_PUBLIC_API_BASE_URL` = your API Worker URL from step 3.
5. Enable automatic deployments from your production branch.

Expected web URL format:
- `https://<project-name>.pages.dev`

## 5. Set strict CORS after first deploy

Once web URL exists, set:
- `CORS_ORIGIN=https://<project-name>.pages.dev`

Avoid `*` in production.

## 6. Later: attach your custom domain

In each Cloudflare project:
- `Custom domains` -> `Add domain`
- Map:
  - web -> `shop.yourdomain.com` (example)
  - api -> `api.yourdomain.com` (example)

