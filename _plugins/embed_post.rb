# frozen_string_literal: true

# Obsidian-style cross-references + a few authoring niceties, resolved at
# :pre_render (before Liquid + Markdown) so results flow through the pipeline.
#
#   [[slug]]            inline   → a plain text link to the target
#   [[slug]]            own line → a mention card (reuses _includes/post-mention.html)
#   ![[slug]]           own line → a full embed (transcludes the rendered body)
#   ![[image.png|400]]  own line → an image, optional width in px
#   %%…%%                        → a comment, stripped from the built page
#
# Collection after a pipe (default "posts"): posts | writeups | projects | playlists
#   [[schematics-2025-ctf|writeups]]   ![[daily-ctf|playlists]]
#
# Slug = filename without date prefix / .md extension. Occurrences inside fenced
# code blocks, inline code spans, and {% raw %} are left untouched.
#
# NOTE: only runs under the custom `bundle exec jekyll build` (GitHub Actions).
# GitHub Pages' native build ignores _plugins/ — see REFACTORING.md.

module EmbedPost
  module_function

  IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)\z/i

  # Find a post/writeup/project/playlist document by slug.
  def find_target(site, slug, collection)
    case collection
    when "writeups", "projects", "playlists"
      docs = site.collections[collection]&.docs || []
      docs.find { |d| d.data["slug"] == slug || File.basename(d.path, ".*") == slug }
    else
      site.posts.docs.find { |p| p.data["slug"] == slug }
    end
  end

  # ![[image.png|400]] → a centered image (width optional, px).
  def image_html(file, width)
    src = file.start_with?("/") ? file : "/assets/uploads/#{file}"
    w = (width && width =~ /\A\d+\z/) ? %( width="#{width}") : ""
    %(<figure class="prose-figure"><img src="#{src}" alt=""#{w}></figure>)
  end

  # Rendered-HTML embed card for a resolved (or missing) target.
  def embed_html(site, slug, collection)
    target = find_target(site, slug, collection)

    unless target
      return <<~HTML
        <div class="embed-post embed-post--missing">
          <div class="embed-post__header">
            <span class="embed-post__title">⚠ Could not find: #{slug}</span>
            <span class="embed-post__meta">collection: #{collection}</span>
          </div>
        </div>
      HTML
    end

    title = target.data["title"] || slug.tr("-", " ").capitalize
    url   = target.url
    date  = target.data["date"]
    body_html = site.find_converter_instance(Jekyll::Converters::Markdown).convert(target.content)

    meta = +""
    meta << "<time>#{date.strftime('%b %d, %Y')}</time>" if date.respond_to?(:strftime)
    meta << " · <a href=\"#{url}\">Open original →</a>"

    <<~HTML
      <div class="embed-post">
        <div class="embed-post__header">
          <a href="#{url}" class="embed-post__title">#{title}</a>
          <span class="embed-post__meta">#{meta}</span>
        </div>
        <div class="embed-post__body prose">
          #{body_html}
        </div>
      </div>
    HTML
  end
end

Jekyll::Hooks.register [:posts, :pages, :documents], :pre_render do |doc|
  content = doc.content
  next unless content.include?("[[") || content.include?("%%") || content =~ /!\[[^\]\n]*\|\d/

  site = doc.site

  # Protect fenced code blocks, {% raw %} blocks, and inline code spans.
  placeholders = []
  safe = content.gsub(/(`{3,}|~{3,}).*?\1|\{%-?\s*raw\s*-?%\}.*?\{%-?\s*endraw\s*-?%\}|`[^`\n]+`/m) do |match|
    placeholders << match
    "\x00EMBED_SAFE_#{placeholders.length - 1}\x00"
  end

  # Strip %%comments%% (Obsidian) — a commented-out link is therefore not resolved.
  safe = safe.gsub(/%%.*?%%/m, "")

  # ![alt|400](src) → sized figure. Done here (pre-Markdown) so kramdown's pipe-
  # table parser never sees the `|` and turns the line into a <table>.
  safe = safe.gsub(/!\[([^\]|\n]*)\|(\d+)\]\(([^)\s]+)\)/) do
    alt = Regexp.last_match(1).strip
    width = Regexp.last_match(2)
    src = Regexp.last_match(3)
    cap = alt.empty? ? "" : %(<figcaption>#{alt}</figcaption>)
    %(<figure class="prose-figure"><img src="#{src}" alt="#{alt}" width="#{width}">#{cap}</figure>)
  end

  # 1. ![[…]] on its own line → image (if the target is an image) or an embed.
  safe = safe.gsub(/^!\[\[([^\]\|\n]+?)(?:\|(\w+))?\]\][ \t]*$/) do
    target = Regexp.last_match(1).strip
    arg = Regexp.last_match(2)&.strip
    if target =~ EmbedPost::IMAGE_EXT
      EmbedPost.image_html(target, arg)
    else
      EmbedPost.embed_html(site, target, (arg || "posts"))
    end
  end

  # 2. [[…]] on its own line → mention card (reuse the include).
  safe = safe.gsub(/^\[\[([^\]\|\n]+?)(?:\|(\w+))?\]\][ \t]*$/) do
    slug = Regexp.last_match(1).strip
    collection = (Regexp.last_match(2) || "posts").strip
    %({% include post-mention.html slug="#{slug}" collection="#{collection}" %})
  end

  # 3. [[…]] inline (not part of a leftover ![[).
  safe = safe.gsub(/(?<!!)\[\[([^\]\|\n]+?)(?:\|(\w+))?\]\]/) do
    slug = Regexp.last_match(1).strip
    collection = (Regexp.last_match(2) || "posts").strip
    target = EmbedPost.find_target(site, slug, collection)
    if target
      %(<a class="post-link" href="#{target.url}">#{target.data['title'] || slug}</a>)
    else
      %(<span class="post-link post-link--missing" title="Post not found: #{slug}">#{slug}</span>)
    end
  end

  safe = safe.gsub(/\x00EMBED_SAFE_(\d+)\x00/) { placeholders[Regexp.last_match(1).to_i] }

  doc.content = safe
end

# Build a reverse index of [[slug]] / ![[slug]] links so each page can show
# "Mentioned in" backlinks. Runs after read, before render (raw content).
class BacklinkGenerator < Jekyll::Generator
  safe true
  priority :low

  def generate(site)
    sources = site.posts.docs +
              (site.collections["writeups"]&.docs || []) +
              (site.collections["projects"]&.docs || []) +
              (site.collections["playlists"]&.docs || [])

    index = {}

    sources.each do |doc|
      # Ignore links inside code so examples don't count as real backlinks.
      body = doc.content.gsub(/(`{3,}|~{3,}).*?\1|`[^`\n]+`/m, "")
      body.scan(/!?\[\[([^\]\|\n]+?)(?:\|(\w+))?\]\]/) do |slug, collection|
        target = EmbedPost.find_target(site, slug.strip, (collection || "posts").strip)
        next unless target
        next if target.url == doc.url

        list = (index[target.url] ||= [])
        next if list.any? { |e| e["url"] == doc.url }

        list << {
          "title" => doc.data["title"] || File.basename(doc.path, ".*"),
          "url"   => doc.url,
          "date"  => doc.data["date"]
        }
      end
    end

    site.data["backlinks"] = index
  end
end
