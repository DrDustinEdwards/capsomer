# Deploying the site

Capsomer's site lives at **https://capsomer.dustinedwards.info** (rulings.md, rule 16). It is a Cloudflare Worker that is almost all static assets: `wrangler.jsonc` serves `site-dist/` from Workers static assets, and site-runtime's `staticSite` Worker (`worker/index.ts`) runs first for every page but the hashed files under `/assets/`: it receives Content-Security-Policy violation reports at `/csp-report` (it logs them to Workers Logs and stores nothing), serves the prefetch rules at `/speculation-rules.json`, adds the Speculation-Rules, Server-Timing and preload Link headers to each page, and sends the 404 page, private and never stored, for a path with no file. The security headers come from the site's entry in site-runtime's site registry: the Worker sends that set, and the site build writes it into `site-dist/_headers` with `site-runtime-headers`. Cloudflare's Git integration (Workers Builds) builds and deploys it from this public repo on every push to `main`. It costs nothing on the free plan.

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
   - **Builds for non-production branches:** off. Only `main` builds and deploys; CI runs the tests on pull requests.
5. Choose **Create and deploy**. The first build installs, writes the site data, builds the site and deploys it to `capsomer.<account>.workers.dev`. Node comes from `.node-version`.

### 2. Add the custom domain

1. In **Workers & Pages**, open the **capsomer** Worker, then **Settings**, then **Domains & Routes**.
2. Choose **Add**, then **Custom domain**.
3. Enter `capsomer.dustinedwards.info` and choose **Add domain**. Cloudflare creates the DNS record and the certificate; it can take a few minutes.

### 3. Check it

- https://capsomer.dustinedwards.info opens the public page, and https://capsomer.dustinedwards.info/admin/ opens the admin in the shared shell.
- `curl -sI https://capsomer.dustinedwards.info/` shows the `Content-Security-Policy` line and the rest of the security set from `site-dist/_headers`, which `npm run site:release` writes with `site-runtime-headers` from the site registry.
- `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://capsomer.dustinedwards.info/csp-report -d '{}'` prints `204`: the report endpoint is the Worker.

Docs: https://developers.cloudflare.com/workers/ci-cd/builds/ and https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Deploying by hand

From a clean checkout of `main`, signed in with `npx wrangler login`:

```
npm ci --ignore-scripts
npm run site:release
npx wrangler deploy
```
