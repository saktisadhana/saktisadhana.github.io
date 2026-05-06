# saktisadhana.github.io

A minimalist blog built with Jekyll, hosted on Netlify (free), with Decap CMS for content management.

## Quick Start

### 1. Push to GitHub

Create a repo called `saktisadhana.github.io` on GitHub and push this project:

```bash
cd saktisadhana.github.io
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/saktisadhana/saktisadhana.github.io.git
git push -u origin main
```

### 2. Deploy on Netlify (Free)

1. Go to [netlify.com](https://app.netlify.com) and sign in with GitHub
2. Click **"Add new site"** → **"Import an existing project"**
3. Select your `saktisadhana.github.io` repo
4. Build settings (should auto-detect):
   - **Build command:** `jekyll build`
   - **Publish directory:** `_site`
5. Click **Deploy**

Your site will be live at `https://saktisadhana.netlify.app` (or any custom name you choose).

### 3. Enable the CMS

1. In Netlify dashboard, go to **Integrations** → **Identity** → **Enable Identity**
2. Under **Registration**, set to **Invite only** (so only you can log in)
3. Go to **Integrations** → **Identity** → **Git Gateway** → **Enable Git Gateway**
4. Go to **Identity** tab → **Invite users** → enter your email
5. Check your email, accept the invite, set a password
6. Visit `https://your-site.netlify.app/admin/` and log in

That's it. You can now write and publish posts from your browser.

## Writing Posts

### From the CMS
Go to `your-site.netlify.app/admin/`, log in, and click "New Blog". Write in the visual editor, hit publish.

### From your editor
Create a file in `_posts/` with the format `YYYY-MM-DD-title.md`:

```markdown
---
title: "My Post Title"
date: 2026-05-06
description: "A short description."
tags:
  - example
---

Your content here. Write in **markdown**.
```

Push to `main` and Netlify will auto-deploy.

## Local Development

If you want to preview locally:

```bash
# Install Ruby and Bundler first, then:
bundle install
bundle exec jekyll serve
```

Visit `http://localhost:4000`.

## Customization

- **Colors:** Edit CSS variables in `assets/css/main.css` (the `:root` block)
- **Site info:** Edit `_config.yml` (title, description, author)
- **Navigation:** Edit `_includes/nav.html`
- **About page:** Edit `about.md` (or through the CMS)

## Cost

**$0.** Everything is free:
- Netlify free tier (300 build minutes/month, plenty for a blog)
- Decap CMS (open source, no cost)
- Netlify Identity (free for up to 1000 users)
- Jekyll (open source)

## License

MIT
