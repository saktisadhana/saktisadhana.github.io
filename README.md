# saktisadhana.github.io

A fast, minimalist blog and CTF-writeup site built with Jekyll, hosted free on GitHub Pages, with a Git-based CMS for editing in the browser. Dark/light themes, a hacker-leaning aesthetic, and zero running cost.

**Live:** https://saktisadhana.github.io

## Stack & cost

Every component is free. There is no server, database, or paid service in the stack.

| Component            | What it does                               | Service                                           | Cost                                              |
| -------------------- | ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------- |
| Hosting              | Serves the static site over HTTPS + CDN    | GitHub Pages                                      | **Free**                                          |
| Domain               | `saktisadhana.github.io`                   | GitHub `*.github.io` subdomain                    | **Free**                                          |
| Build & deploy       | Builds Jekyll and publishes on every push  | GitHub Actions                                    | **Free** (unlimited minutes for public repos)     |
| Site generator       | Turns Markdown + Liquid into static HTML   | Jekyll 4.3                                        | **Free** (open source)                            |
| Content editor       | Browser-based CMS that commits to the repo | Decap CMS                                         | **Free** (open source, self-hosted from `/admin`) |
| CMS login            | Authenticates editors                      | GitHub OAuth (PKCE)                               | **Free**                                          |
| Comments             | Discussion threads under posts             | Giscus (GitHub Discussions)                       | **Free**                                          |
| Fonts                | Inter + JetBrains Mono                     | Self-hosted (woff2, latin subset)                 | **Free**                                          |
| Syntax highlighting  | Colors code blocks at build time           | Rouge (bundled)                                   | **Free**                                          |
| SEO / feed / sitemap | Meta tags, RSS, sitemap.xml                | `jekyll-seo-tag`, `jekyll-feed`, `jekyll-sitemap` | **Free** (open source)                            |

**Total: $0 / month.** The only thing that would ever cost money is an optional custom domain (~$10–15/yr from a registrar) — not currently used.

## Features

- **Dark / light theme** with no-flash loading and a remembered preference
- **CTF writeups** as a dedicated Jekyll collection (`_writeups/`), separate from blog posts (`_posts/`)
- **Floating table of contents** on long posts — pinned left, collapsible, remembers its state
- **Live search** on the blog and writeups lists (title + tags, no plugin)
- **Unified tags page** spanning both posts and writeups
- **Rich content**: LaTeX math (self-hosted KaTeX), Obsidian-style callouts, collapsible spoilers, Mermaid diagrams, `==highlight==`, task lists, footnotes, `<kbd>` — all documented at `/cheatsheet/`
- **Code blocks**: Rouge syntax highlighting + language badge + one-click copy button
- **Reading aids**: reading-time estimate, scroll progress bar, related posts, back-to-top, copy-link button
- **Image lightbox** for screenshots, with keyboard support
- **Comments** via Giscus (GitHub Discussions)
- **Tasteful motion**: staggered list reveal, in-article scroll reveals, hover micro-interactions — all gated behind `prefers-reduced-motion`
- **SEO built in**: `jekyll-seo-tag` (Open Graph, Twitter cards, JSON-LD), RSS feed, sitemap, `robots.txt`, custom 404
- **Print stylesheet** so posts export cleanly to PDF
- **Accessible**: progressive enhancement (content shows without JS), focus-visible rings, ARIA on interactive controls

## Project structure

```
.
├── _config.yml            # Site settings, collections, plugins, defaults
├── _includes/             # Reusable partials
│   ├── head.html          # <head>: theme script, SEO, fonts, CSS
│   ├── nav.html           # Dynamic nav (built from page front matter)
│   ├── footer.html
│   ├── comments.html      # Giscus
│   ├── related.html       # Related posts/writeups by shared tag
│   ├── reading-time.html  # Word-count → minutes
│   └── toc-sidebar.html   # Floating table of contents
├── _layouts/
│   ├── default.html       # Base shell (nav, main, footer, JS)
│   ├── page.html          # Static pages (e.g. About)
│   ├── post.html          # Blog post
│   └── writeup.html       # CTF writeup
├── _posts/                # Blog posts (YYYY-MM-DD-title.md)
├── _writeups/             # CTF writeups (collection)
├── admin/                 # Decap CMS (config.yml + index.html)
├── assets/
│   ├── css/main.css       # All styles (single file)
│   ├── js/main.js         # All behavior (single file, vanilla JS)
│   ├── favicon.svg
│   └── uploads/           # CMS-uploaded media
├── .github/workflows/
│   └── deploy.yml         # Build + deploy to GitHub Pages
├── index.html             # Home
├── blog.html              # Post list
├── writeups.html          # Writeup list
├── tags.html              # Tag index (posts + writeups)
├── about.md
├── 404.html
├── robots.txt
└── Gemfile
```

## Local development

Requires Ruby + Bundler. From the project root:

```bash
bundle install
bundle exec jekyll serve --livereload
```

Then open http://localhost:4000. Changes rebuild automatically.

No Ruby installed? Run it in Docker instead:

```bash
docker run --rm -v "$PWD":/srv/jekyll -p 4000:4000 jekyll/jekyll:4 jekyll serve
```

## Writing content

**Via the CMS (easiest):** go to `/admin`, sign in with GitHub, and create/edit posts, writeups, and the About page. Decap commits changes straight to the `main` branch.

**Via Git (manual):** add a Markdown file with front matter to `_posts/` (filename `YYYY-MM-DD-title.md`) or `_writeups/`. See an existing file for the expected fields (`title`, `date`, `description`, `tags`, and for writeups `event` / `team` / `pdf`). Tags are lowercase; descriptions for common tags live in `_config.yml` under `tag_descriptions`.

**Formatting reference:** the `/cheatsheet/` page (source: `cheatsheet.md`, `noindex`) shows every front-matter field and content feature — math, callouts, spoilers, Mermaid, tables, footnotes, etc. — as *syntax → rendered*. KaTeX and Mermaid are self-hosted under `assets/vendor/` and load **only** on pages that use them (detected from front matter or content), which also scopes the small per-page CSP relaxations they need.

**Cross-linking (Obsidian-style):** `[[slug]]` makes an inline link, `[[slug]]` on its own line renders a mention card, and `![[slug]]` embeds another post's body. Add `|writeups` / `|projects` / `|playlists` for other collections. Also supports `![[img.png|400]]` sized images, `%%comments%%` (stripped at build), and automatic **"Mentioned in"** backlinks. Handled by `_plugins/embed_post.rb`, so it **only works under the GitHub Actions build** (`bundle exec jekyll build`) — GitHub Pages' native build ignores `_plugins/` and would silently drop it.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site with Jekyll and publishes it to GitHub Pages. No manual steps.

## Customization

- **Colors / theme:** CSS variables in the `:root` (and `[data-theme="light"]`) blocks of `assets/css/main.css`
- **Site info:** `_config.yml` (title, description, author, social links)
- **Navigation:** pages opt in via `nav: true` + `nav_order` in their front matter — no need to edit `nav.html`
- **Comments:** the Giscus IDs in `_includes/comments.html` (regenerate at https://giscus.app)

## License

MIT
