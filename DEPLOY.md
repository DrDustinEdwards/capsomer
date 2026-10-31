# Deploying the site

Capsomer's site lives at **https://capsomer.dustinedwards.info** (rulings.md, rule 16). It is a Cloudflare Worker that is almost all static assets: `wrangler.jsonc` serves `site-dist/` from Workers static assets, and site-runtime's `staticSite` Worker (`worker/index.ts`) runs first for every page but the hashed files under `/assets/`: it receives Content-Security-Policy violation reports at `/csp-report` (it logs them to Workers Logs and stores nothing), serves the prefetch rules at `/speculation-rules.json`, adds the Speculation-Rules, Server-Timing and preload Link headers to each page, and sends the 404 page, private and never stored, for a path with no file. The security headers come from `scripts/security-headers.ts` (built on `@dustinedwards/site-runtime`), which the site build writes into `site-dist/_headers`. A push to `main` deploys it through devkit's shared deploy (`.github/workflows/worker-deploy.yml`, the `deploy` job in `.github/workflows/ci.yml`), the same one the D1 sites use: once the checks pass it builds the site (`npm run site:release`), deploys with `DEPLOY_SHA` set to the commit, waits for `/health` (site-runtime's `staticSite`) to report that commit, checks the home page answers 200, and rolls the deploy back if it does not. Then it tells IndexNow. It costs nothing on the free plan.

The deployed site reads the latest test results at runtime from this repo's `results` branch, which CI writes after every run on `main`, so a new result shows without a redeploy.

## One-time setup

The Worker `capsomer` and the custom domain `capsomer.dustinedwards.info` already exist (the domain was added under the Worker's **Settings**, **Domains & Routes**, and `wrangler deploy` leaves it as it is). The deploy needs:

1. A user API token named `capsomer-ci-deploy` (Cloudflare dashboard, **My Profile**, **API Tokens**, **Create Token**, template **Edit Cloudflare Workers**), saved as the repository secret `CLOUDFLARE_API_TOKEN`, and the account id as `CLOUDFLARE_ACCOUNT_ID` (GitHub, **Settings**, **Secrets and variables**, **Actions**).
2. Cloudflare's Git integration (Workers Builds) disconnected, so a push deploys once: the **capsomer** Worker, **Settings**, **Build**, **Disconnect**.
3. The repository variable `CF_DEPLOY` set to `true`. Until then the `deploy` job is skipped.

### Check it

- `curl -s https://capsomer.dustinedwards.info/health` reports the commit on `main` as `sha`.
- `curl -sI https://capsomer.dustinedwards.info/` shows the `Content-Security-Policy` line and the rest of the security set from `site-dist/_headers`, which `npm run site:release` generates from `scripts/security-headers.ts`.
- `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://capsomer.dustinedwards.info/csp-report -d '{}'` prints `204`: the report endpoint is the Worker.

Docs: https://developers.cloudflare.com/workers/wrangler/ci-cd/ and https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Deploying by hand

From a clean checkout of `main`, signed in with `npx wrangler login`:

```
npm ci --ignore-scripts
npm run site:release
npx wrangler deploy
```
