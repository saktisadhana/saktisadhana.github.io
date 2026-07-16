# Refactoring & Hardening plan

A prioritised backlog for making the site faster, leaner, and more secure.
**Nothing here is implemented yet** — it's a plan to work through later, one item
at a time. (Last refreshed after the content-features + cross-linking work; the
codebase is now ~2.7k lines of CSS, ~600 of JS, +3.8 MB of vendored libs.)

Priorities: **P1** do first / real bug · **P2** worth doing · **P3** nice-to-have.

> **Hosting constraint:** the site runs on GitHub Pages, which can't set custom
> HTTP response headers. Anything header-based beyond a `<meta>` tag needs a
> proxy (e.g. a free Cloudflare zone) in front of Pages. Noted per-item.

> **Build dependency (important):** cross-links (`[[slug]]` / `![[slug]]` via
> `_plugins/embed_post.rb`) and any future custom plugin work **only** because the
> deploy uses a full `bundle exec jekyll build` in GitHub Actions. GitHub Pages'
> *native* build ignores `_plugins/` and would silently drop these features. Do
> not switch the repo to native Pages building without moving the plugin logic.

> **Do not touch:** `assets/vendor/tulip-pm.js`, `tulip-advisory.html`,
> `workers/tulip-resolver/` — an intentional path-traversal CTF, not a bug.

---

## Housekeeping

- **P1 — Add `.gitattributes`.** The working tree has no `.gitattributes`, so every
  `git` operation warns "LF will be replaced by CRLF" on ~16 files and diffs are
  noisy. One file fixes it: `* text=auto eol=lf` (and mark `assets/vendor/**` +
  `*.woff2` as `binary`). Then renormalise once with `git add --renormalize .`.

## Performance / optimisation

- **P2 — Minify CSS/JS at build.** `assets/css/main.css` (~2.7k lines) is a single
  render-blocking file; `main.js` is unminified too. Add a minify step to
  `.github/workflows/deploy.yml` (e.g. the `jekyll-minifier` gem, or a standalone
  `esbuild`/`csso` step after `jekyll build`, before upload). Keep sources
  readable; only the built `_site` is minified. Biggest single perf win now.
- **P2 — Mermaid weight (3.2 MB).** `assets/vendor/mermaid/mermaid.min.js` is huge.
  It already loads *only* on diagram pages (conditional in `head.html`), so the
  blast radius is limited. To go further: lazy-load it via IntersectionObserver
  when a `.mermaid` block scrolls near the viewport, or pin a slimmer build. If
  diagrams are rare, "accept it" is a valid call — just document the trade-off.
- **P3 — `defer` on `main.js`.** Loaded at end of `<body>` without `defer`
  (`tulip-pm.js` already uses it). Adding `defer` is a small, safe parse win; the
  code is already `DOMContentLoaded`-gated. Note: KaTeX/Mermaid are `defer`ed in
  `head.html` and run before `DOMContentLoaded`, so `initMath`/`initMermaid` still
  find them — keep that ordering if changing script loading.
- **P3 — Split `main.css` into Sass partials.** Jekyll has native Sass; a
  `main.scss` importing `_tokens`, `_prose`, `_cards`, `_content-features`, etc.
  would help maintainability. Bigger refactor, low user-facing payoff — do it only
  alongside the minify step.
- **P3 — `asset_version` is manual** (now at 12) and easy to forget on edits;
  a content-hash at build time would automate cache-busting. Low payoff at this
  scale; the manual bump works.

## Code quality

- **P2 — Dead/duplicate CSS sweep.** The obvious ones were removed
  (`.mention-card__label/__tags`, the duplicated `.post__footer`). Do a broader
  pass for orphaned selectors (e.g. leftover `.playlist-index__list` variants,
  animation classes no longer referenced) — grep each class against templates + JS.
- **P2 — `_plugins/embed_post.rb` robustness.** Now handles inline `[[ ]]`,
  own-line cards, and `![[ ]]` embeds, and protects fenced/inline-code/`{% raw %}`.
  Remaining edges to watch: (a) a post embedded via `![[ ]]` whose *own* body
  contains `[[ ]]` won't have those resolved (its content is converted directly,
  bypassing the hook); (b) very large embeds inflate the host page — consider a
  "collapsed by default" embed variant. Add a couple of test posts.
- **P3 — JS init cost.** ~25 `init*` functions run on every page via one
  `DOMContentLoaded` handler; most early-return when their elements are absent, so
  cost is negligible, but the boot list could be reorganised into a small registry.
  Low priority.

## Content / correctness

- **P3 — Check draft image paths.** `_posts/2026-07-02-daily-ctf-1.md` references
  Obsidian-style `Pasted image ….png`; confirm those exist under `assets/uploads/`
  (with URL-encoded names) or they'll 404 once published. Same for any other post
  pasted from Obsidian.

## Security / hardening

- **P2 — External-link hardening in Markdown.** Template links use `rel="noopener"`,
  but kramdown-generated off-site links in post bodies don't. Add
  `rel="noopener noreferrer"` to external Markdown links (a small post-render pass
  or a JS sweep in `main.js`) to close reverse-tabnabbing everywhere.
- **P3 — CSP is in good shape.** Strict by default; math pages add only
  `style-src-attr 'unsafe-inline'`, diagram pages add `'unsafe-inline'` to
  `style-src` — both scoped per page (`_includes/head.html`). Optional: narrow
  `img-src https:` if all images become local/known-host.
- **P3 — Response headers via proxy.** `Referrer-Policy` is set via `<meta>`;
  `X-Content-Type-Options`, `Permissions-Policy`, HSTS can't be set on GitHub
  Pages. Front with Cloudflare (free) to add them. Optional.
- **P3 — Keep Decap CMS & CI current.** `admin/index.html` pins `decap-cms@3.14.1`
  with SRI; `dependabot.yml` watches bundler + actions. Keep merging those PRs and
  re-pin the SRI hash when bumping Decap.

### Notes (no action)

- The OAuth `app_id` in `admin/config.yml` is a **public** PKCE client id, not a
  secret.
- The intentional CTF's `.tulip/build.secret` must live only in the
  Worker/registry, never be committed.
- **Done since the last revision:** the undefined `--surface` token (previously
  P1) is now defined for both themes.
