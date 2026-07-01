---
title: Setting Up Jekyll with Decap CMS
date: 2026-05-06
published: false
description: "A quick walkthrough of how this blog is set up: Jekyll, Netlify, and a free CMS."
tags:
  - tutorial
  - jekyll
---

If you're reading this, the setup worked. Here's how it's put together.

## The pieces

1. **Jekyll**: a static site generator that turns markdown into HTML
2. **Netlify**: free hosting with automatic deploys from GitHub
3. **Decap CMS**: a browser-based content editor that commits to your repo

## How it works

Every time I push to `main`, Netlify builds the site and deploys it. When I write a post through the CMS at `/admin`, it creates a new markdown file in `_posts/` and commits it: which triggers a new build.

## The config

The CMS is configured in `admin/config.yml`. It defines what fields each post has:

```yaml
collections:
  - name: "blog"
    label: "Blog"
    folder: "_posts"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime" }
      - { label: "Description", name: "description", widget: "string" }
      - { label: "Body", name: "body", widget: "markdown" }
```

That's it. No database, no server, no monthly bill.

## Why this approach

I wanted something that:

- Costs nothing to run
- Lets me write in markdown
- Doesn't require a terminal to publish
- Keeps everything in Git

This setup checks all those boxes.
