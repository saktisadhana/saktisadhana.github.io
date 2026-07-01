# tulip-pm registry resolver (Cloudflare Worker)

Server-side half of the site's hidden CTF. Free tier, always-on (`*.workers.dev`),
100k requests/day. The flag is stored as a **secret** — never in this repo.

## Deploy (dashboard, no CLI)

1. Create a free account at https://dash.cloudflare.com → **Workers & Pages**.
2. **Create application → Create Worker** → give it a name (e.g. `tulip-pm-resolver`) → Deploy.
3. **Edit code** → paste the contents of [`worker.js`](worker.js) → **Deploy**.
4. **Settings → Variables and Secrets → Add** → type **Secret**, name `FLAG`,
   value = the flag (`rcks{...}`) → **Deploy**.
5. Copy the Worker URL: `https://tulip-pm-resolver.<your-subdomain>.workers.dev`.

## Deploy (CLI, optional)

```bash
npm i -g wrangler
wrangler login
cd workers/tulip-resolver
wrangler deploy
wrangler secret put FLAG      # paste the flag when prompted
```

## Wire it into the site

Put the Worker base URL into `assets/vendor/tulip-pm.js` → `registry:` field.
The advisory page reads that value, so players discover the endpoint via recon.

## Test it

```bash
BASE="https://tulip-pm-resolver.<your-subdomain>.workers.dev"

# gate closed (no header):
curl -s "$BASE/resolve?pkg=lodash"                       # 403 debug disabled

# gate open, benign package:
curl -s "$BASE/resolve?pkg=lodash" -H "X-Tulip-Debug: 1" # artifact not found

# the exploit — traversal onto the build secret:
curl -s "$BASE/resolve?pkg=../../.tulip/build.secret" -H "X-Tulip-Debug: 1"
# -> rcks{...}
```
