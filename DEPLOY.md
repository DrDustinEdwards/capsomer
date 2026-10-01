# Deploying the site

Capsomer's site lives at **https://capsomer.dustinedwards.info** (rulings.md, rule 16). It is a static Cloudflare Worker: `wrangler.jsonc` serves `site-dist/` from Workers static assets, with no Worker script. Cloudflare's Git integration (Workers Builds) builds and deploys it from this public repo on every push to `main`. It costs nothing on the free plan.

The deployed site reads the latest test results at runtime from this repo's `results` branch, which CI writes after every run on `main`, so a new result shows without a redeploy.

## One-time setup in the Cloudflare dashboard

### 1. Connect the repo

1. Open https://dash.cloudflare.com and choose the account that holds `dustinedwards.info`.
2. Go to **Workers & Pages**, choose **Create**, then under Workers choose **Import a repository**.
3. If asked, connect GitHub and allow the Cloudflare app access to **DrDustinEdwards/capsomer** (only that repo is enough).
4. Select **DrDustinEdwards/capsomer** and set:
   - **Project name:** `capsomer` (it must match `name` in `wrangler.jsonc`)
   - **Production branch:** `main`
   - **Build command:** `npm ci --ignore-scripts && npm run site:release`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** leave empty (the repo root)
   - **Builds for non-production branches:** off (set 2026-10-01). Only `main` builds and deploys, so the Workers Builds check does not appear on pull requests; CI runs the tests (`.github/workflows/ci.yml`). If preview builds are ever turned on, set **Non-production branch deploy command** to `npx wrangler versions upload` (Cloudflare's default for those branches is `npx wrangler preview`; https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
5. Choose **Create and deploy**. The first build installs, writes the site data, builds the site and deploys it to `capsomer.<account>.workers.dev`. Node comes from `.node-version`.

### 2. Add the custom domain

1. In **Workers & Pages**, open the **capsomer** Worker, then **Settings**, then **Domains & Routes**.
2. Choose **Add**, then **Custom domain**.
3. Enter `capsomer.dustinedwards.info` and choose **Add domain**. Cloudflare creates the DNS record and the certificate; it can take a few minutes.

### 3. Check it

- https://capsomer.dustinedwards.info opens the site in the shared shell.
- `curl -sI https://capsomer.dustinedwards.info/` shows the `Content-Security-Policy` line from `site/public/_headers`.

Docs: https://developers.cloudflare.com/workers/ci-cd/builds/ and https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Deploying by hand

From a clean checkout of `main`, signed in with `npx wrangler login`:

```
npm ci --ignore-scripts
npm run site:release
npx wrangler deploy
```
