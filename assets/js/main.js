// Shared helper: turn heading text into a URL-safe id
function slugify(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Mobile nav toggle
function initNavToggle() {
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', function () {
    var open = toggle.classList.toggle('open');
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Fade-in on scroll, with a staggered cascade for items revealed together
function initFadeIn() {
  var elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      var shown = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      shown.forEach(function (entry, i) {
        // single-entry batches (scrolled into view later) get no delay
        entry.target.style.transitionDelay = (i * 60) + 'ms';
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

// Gentle reveal of article content (headings, media, quotes, code) on scroll
function initProseReveal() {
  var els = document.querySelectorAll('.prose h2, .prose h3, .prose img, .prose blockquote, .prose pre');
  if (!els.length) return;

  els.forEach(function (el) { el.classList.add('prose-reveal'); });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(function (el) { observer.observe(el); });
}

// Copy text to the clipboard, resolving to true/false so callers can show feedback
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
  }
  return Promise.resolve(false);
}

// Copy button on code blocks
function initCopyButtons() {
  document.querySelectorAll('.prose pre').forEach(function (pre) {
    // Skip mermaid diagrams — they render as SVG, not copyable text
    if (pre.classList.contains('mermaid')) return;

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'copy';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code') || pre;
      copyText(code.innerText).then(function (ok) {
        btn.textContent = ok ? 'copied!' : 'failed';
        if (ok) btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'copy';
          btn.classList.remove('copied');
        }, 1800);
      });
    });
    pre.appendChild(btn);
  });
}

// Reading progress bar
function initProgressBar() {
  var bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop || document.body.scrollTop;
    var total = doc.scrollHeight - doc.clientHeight;
    bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  }, { passive: true });
}

// Light / dark mode toggle
function initThemeToggle() {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function syncGiscus(theme) {
    var iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) return;
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: theme === 'light' ? 'light' : 'transparent_dark' } } },
      'https://giscus.app'
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    btn.textContent = theme === 'dark' ? '☀' : '☾';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#fafafa' : '#0e0e0e');
    syncGiscus(theme);
    renderMermaid(); // re-theme any diagrams to match (no-op if none / not yet rendered)
  }

  applyTheme(localStorage.getItem('theme') || 'dark');

  // Giscus iframe isn't ready at DOMContentLoaded; sync once it signals it has loaded
  window.addEventListener('message', function onGiscusReady(e) {
    if (e.origin !== 'https://giscus.app') return;
    syncGiscus(document.documentElement.getAttribute('data-theme') || 'dark');
    window.removeEventListener('message', onGiscusReady);
  });

  btn.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    // retrigger the spin animation
    btn.classList.remove('spin');
    void btn.offsetWidth;
    btn.classList.add('spin');
  });
}

// Back to top button
function initBackToTop() {
  var btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', (document.documentElement.scrollTop || document.body.scrollTop) > 400);
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Share / copy-link button
function initShareBtn() {
  var btn = document.getElementById('share-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    copyText(window.location.href).then(function (ok) {
      btn.textContent = ok ? 'Copied!' : 'Copy failed';
      if (ok) btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = 'Copy link';
        btn.classList.remove('copied');
      }, 1800);
    });
  });
}

// Live search
function initSearch() {
  var input = document.getElementById('search-input');
  var list = document.getElementById('post-list');
  var empty = document.getElementById('search-empty');
  if (!input || !list) return;
  var cloud = document.getElementById('blog-cloud');
  var groups = list.querySelectorAll('.blog-group');

  input.addEventListener('input', function () {
    var q = input.value.toLowerCase().trim();
    var items = list.querySelectorAll('li[data-title]');
    var visible = 0;
    items.forEach(function (item) {
      var match = !q || item.dataset.title.includes(q) || (item.dataset.tags || '').includes(q) || (item.dataset.playlist || '').includes(q);
      item.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    // In the grouped (blog) view, hide any series section with no visible posts.
    groups.forEach(function (group) {
      var shown = 0;
      group.querySelectorAll('li[data-title]').forEach(function (li) {
        if (li.style.display !== 'none') shown++;
      });
      group.style.display = shown ? '' : 'none';
    });
    if (cloud) cloud.style.display = q ? 'none' : '';
    if (empty) empty.classList.toggle('is-hidden', !(visible === 0 && q));
  });
}

// Table of Contents
function initToc() {
  var toc = document.getElementById('toc');
  if (!toc) return;
  var headings = document.querySelectorAll('.prose h2, .prose h3');
  if (headings.length < 2) {
    var sidebar = document.getElementById('toc-sidebar');
    var showBtn = document.getElementById('toc-show');
    if (sidebar) sidebar.style.display = 'none';
    if (showBtn) showBtn.style.display = 'none';
    document.body.classList.add('no-toc');
    return;
  }
  var ul = document.createElement('ul');
  ul.className = 'toc__list';
  headings.forEach(function (h) {
    if (!h.id) h.id = slugify(h.textContent);
    var li = document.createElement('li');
    li.className = 'toc__item toc__item--' + h.tagName.toLowerCase();
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.className = 'toc__link';
    li.appendChild(a);
    ul.appendChild(li);
  });
  toc.appendChild(ul);

  var tocObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = toc.querySelector('a[href="#' + entry.target.id + '"]');
      if (!link) return;
      if (entry.isIntersecting) {
        toc.querySelectorAll('.toc__link').forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px' });

  headings.forEach(function (h) { tocObserver.observe(h); });
}

// Toggle the floating table of contents (hide / show, remembered across pages)
function initTocToggle() {
  if (document.body.classList.contains('no-toc')) return;
  var collapseBtn = document.getElementById('toc-collapse');
  var showBtn = document.getElementById('toc-show');
  var backdrop = document.getElementById('toc-backdrop');
  var tocNav = document.getElementById('toc');
  if (!collapseBtn || !showBtn) return;

  function isNarrow() { return window.matchMedia('(max-width: 1359px)').matches; }

  function setHidden(hidden) {
    document.documentElement.classList.toggle('toc-collapsed', hidden);
    collapseBtn.setAttribute('aria-expanded', String(!hidden));
    // Persist only on desktop; on narrow screens the drawer always starts closed.
    if (!isNarrow()) {
      try { localStorage.setItem('tocHidden', hidden ? '1' : '0'); } catch (e) {}
    }
  }

  // Narrow screens: closed by default (drawer). Desktop: respect saved preference.
  setHidden(isNarrow() ? true : localStorage.getItem('tocHidden') === '1');

  collapseBtn.addEventListener('click', function () { setHidden(true); });
  showBtn.addEventListener('click', function () { setHidden(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setHidden(true); });

  // On the mobile drawer, tapping a heading link should close it.
  if (tocNav) {
    tocNav.addEventListener('click', function (e) {
      if (isNarrow() && e.target.closest('.toc__link')) setHidden(true);
    });
  }

  // If the window shrinks into drawer territory while open, close it so it
  // doesn't cover the article.
  window.addEventListener('resize', function () {
    if (isNarrow() && !document.documentElement.classList.contains('toc-collapsed')) {
      setHidden(true);
    }
  });
}

// Heading anchor links
function initHeadingAnchors() {
  document.querySelectorAll('.prose h2, .prose h3, .prose h4').forEach(function (h) {
    // Project-card titles are <h2>s that live inside .prose but aren't article
    // headings — skip them so they don't get a "#" anchor.
    if (h.closest('.project-card')) return;
    if (!h.id) h.id = slugify(h.textContent);
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.className = 'heading-anchor';
    a.setAttribute('aria-label', 'Link to this section');
    // hide the literal "#" from assistive tech; the aria-label names the link
    a.innerHTML = '<span aria-hidden="true">#</span>';
    h.appendChild(a);
  });
}

// Image lightbox (keyboard accessible)
function initLightbox() {
  var images = document.querySelectorAll('.prose img');
  if (!images.length) return;

  var lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image viewer');
  var lbImg = document.createElement('img');
  lbImg.id = 'lightbox-img';
  lbImg.alt = '';
  var closeBtn = document.createElement('button');
  closeBtn.id = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close image viewer');
  closeBtn.textContent = '×';
  lightbox.appendChild(lbImg);
  lightbox.appendChild(closeBtn);
  document.body.appendChild(lightbox);

  var lastFocused = null;

  function openLightbox(img) {
    lastFocused = img;
    lbImg.src = img.src;
    lbImg.alt = img.alt || 'Enlarged image';
    lightbox.classList.add('open');
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    if (lastFocused) lastFocused.focus();
  }

  images.forEach(function (img) {
    // leave linked images alone — let the link do its job
    if (img.closest('a')) return;
    img.style.cursor = 'zoom-in';
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    if (!img.alt) img.setAttribute('aria-label', 'View image full size');
    img.addEventListener('click', function () { openLightbox(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img);
      }
    });
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target !== lbImg) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'Tab') {
      // only one focusable control in the dialog — keep focus on it
      e.preventDefault();
      closeBtn.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Content features (math, diagrams, callouts, and Markdown polish). Each is
// scoped to `.prose`, guarded by feature-detection, and safe to no-op.
// ---------------------------------------------------------------------------

// LaTeX math via self-hosted KaTeX auto-render. kramdown (math_engine: null)
// leaves the $…$ / $$…$$ delimiters in the text (inside .kdmath), so auto-render
// picks them up. Code/pre are ignored; escape a literal dollar in prose as \$.
function initMath() {
  var prose = document.querySelector('.prose');
  if (!prose || typeof renderMathInElement !== 'function') return;
  renderMathInElement(prose, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    throwOnError: false
  });
}

// Mermaid diagrams from ```mermaid fences. Rouge wraps them in .language-mermaid;
// swap that for a <pre class="mermaid"> holding the raw source, then render.
var mermaidSources = [];
var mermaidTheme = null;

function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  document.querySelectorAll('.prose .language-mermaid').forEach(function (block) {
    var code = block.querySelector('code') || block;
    var pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = code.textContent.replace(/\n$/, '');
    var wrapper = block.closest('.highlighter-rouge') || block;
    wrapper.parentNode.replaceChild(pre, wrapper);
    mermaidSources.push({ el: pre, src: pre.textContent });
  });
  renderMermaid();
}

// (Re)render diagrams for the current theme. Called on load and on theme toggle.
function renderMermaid() {
  if (typeof mermaid === 'undefined' || !mermaidSources.length) return;
  var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark';
  if (theme === mermaidTheme) return; // already rendered for this theme
  mermaidTheme = theme;
  mermaid.initialize({ startOnLoad: false, theme: theme, securityLevel: 'strict', fontFamily: 'inherit' });
  mermaidSources.forEach(function (m) {
    m.el.removeAttribute('data-processed');
    m.el.innerHTML = '';
    m.el.textContent = m.src;
  });
  try {
    mermaid.run({ nodes: mermaidSources.map(function (m) { return m.el; }) });
  } catch (e) { /* leave the source visible if a diagram fails to parse */ }
}

// Obsidian-style callouts: a blockquote whose first line is `[!type]` (optionally
// `-`/`+` for a collapsible one, and an optional title). Types map to an accent
// colour + icon in CSS.
function initCallouts() {
  // Icon per type. Obsidian aliases are their own classes (coloured via CSS groups).
  var ICON = {
    note: '✎',
    abstract: '≡', summary: '≡', tldr: '≡',
    info: 'ℹ', todo: '☐',
    tip: '✦', hint: '✦', important: '★',
    success: '✔', check: '✔', done: '✔',
    question: '?', help: '?', faq: '?',
    warning: '▲', caution: '▲', attention: '▲',
    danger: '‼', error: '✖', fail: '✖', failure: '✖', missing: '✖',
    example: '❯', quote: '❝', cite: '❝', bug: '☣'
  };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  document.querySelectorAll('.prose blockquote').forEach(function (bq) {
    var p = bq.querySelector('p');
    if (!p) return;
    var m = p.innerHTML.match(/^\s*\[!(\w+)\]([+-]?)[ \t]*([^\n<]*)/);
    if (!m) return;

    var type = m[1].toLowerCase();
    if (!ICON[type]) type = 'note';
    var fold = m[2];                       // '' | '-' (collapsed) | '+' (open)
    var title = (m[3] || '').trim() || cap(type);

    // Strip the marker line from the first paragraph.
    p.innerHTML = p.innerHTML.replace(/^\s*\[!\w+\][+-]?[ \t]*[^\n<]*(\n|<br\s*\/?>)?/, '');
    if (!p.textContent.trim() && !p.querySelector('img')) p.remove();

    var headHTML = '<span class="callout__icon" aria-hidden="true">' + ICON[type] +
                   '</span><span class="callout__title">' + title + '</span>';

    var foldable = (fold === '-' || fold === '+');
    var box = document.createElement(foldable ? 'details' : 'div');
    box.className = 'callout callout--' + type + (foldable ? ' callout--foldable' : '');
    if (fold === '+') box.open = true;

    var header = document.createElement(foldable ? 'summary' : 'div');
    header.className = 'callout__header';
    header.innerHTML = headHTML;
    box.appendChild(header);

    var body = document.createElement('div');
    body.className = 'callout__body';
    while (bq.firstChild) body.appendChild(bq.firstChild);
    box.appendChild(body);

    bq.parentNode.replaceChild(box, bq);
  });
}

// Language badge on fenced code blocks (sits alongside the copy button).
function initCodeLabels() {
  document.querySelectorAll('.prose div.highlighter-rouge').forEach(function (block) {
    var cls = block.className.match(/language-([\w+-]+)/);
    if (!cls || cls[1] === 'mermaid') return;
    var pre = block.querySelector('pre');
    if (!pre) return;
    var label = document.createElement('span');
    label.className = 'code-lang';
    label.textContent = cls[1];
    pre.appendChild(label);
  });
}

// Wrap tables so wide ones scroll instead of overflowing the page on mobile.
function initTableWrap() {
  document.querySelectorAll('.prose table').forEach(function (t) {
    if (t.parentNode.classList && t.parentNode.classList.contains('table-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });
}

// Turn a standalone image with alt text into <figure> + <figcaption>.
function initFigures() {
  document.querySelectorAll('.prose img').forEach(function (img) {
    if (img.closest('a') || img.closest('figure')) return;
    var alt = (img.getAttribute('alt') || '').trim();
    if (!alt) return;
    var fig = document.createElement('figure');
    var cap = document.createElement('figcaption');
    cap.textContent = alt;
    var p = img.parentNode;
    if (p.tagName === 'P' && p.childNodes.length === 1) {
      p.parentNode.insertBefore(fig, p);
      fig.appendChild(img);
      fig.appendChild(cap);
      p.remove();
    } else {
      p.insertBefore(fig, img);
      fig.appendChild(img);
      fig.appendChild(cap);
    }
  });
}

// Obsidian ==highlight== → <mark>, over prose text only (skips code, math, links).
function initHighlight() {
  var prose = document.querySelector('.prose');
  if (!prose) return;
  var walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.nodeValue || node.nodeValue.indexOf('==') === -1) return NodeFilter.FILTER_REJECT;
      if (node.parentNode.closest('pre, code, a, .katex, .code-lang')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);
  targets.forEach(function (node) {
    if (!/==[^=]+==/.test(node.nodeValue)) return;
    var frag = document.createDocumentFragment();
    var parts = node.nodeValue.split(/==([^=]+)==/g);
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        var mark = document.createElement('mark');
        mark.textContent = part;
        frag.appendChild(mark);
      } else if (part) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
}

// kramdown's GFM parser already renders `- [ ]` / `- [x]` as disabled checkboxes
// (.task-list-item-checkbox). Just tag the list + items so the CSS can hide the
// bullet and align things (avoids relying on :has() for older browsers).
function initTaskLists() {
  document.querySelectorAll('.prose .task-list-item-checkbox').forEach(function (box) {
    var li = box.closest('li');
    if (li) li.classList.add('task-item');
    var list = box.closest('ul');
    if (list) list.classList.add('task-list');
  });
}

// Smoothly animate <details> open AND close (spoilers + foldable callouts).
// Native <details> snaps; the modern ::details-content CSS only works in the very
// newest browsers. This drives a height + fade (spoilers also un-blur) via the
// Web Animations API, which works everywhere, and keeps the content visible
// through the close animation before removing [open].
function initDetailsAnimation() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.prose details').forEach(function (details) {
    var summary = details.querySelector('summary');
    if (!summary) return;

    // Single wrapper to animate. Callouts already have .callout__body; for a
    // plain spoiler, wrap everything after the summary in one.
    var content = details.querySelector(':scope > .callout__body');
    if (!content) {
      content = document.createElement('div');
      content.className = 'details-content';
      var node = summary.nextSibling;
      while (node) {
        var next = node.nextSibling;
        content.appendChild(node);
        node = next;
      }
      details.appendChild(content);
    }

    var isSpoiler = !details.classList.contains('callout');
    var anim = null;

    function keyframes(from, to) {
      var k = [
        { height: from + 'px', opacity: from ? 1 : 0 },
        { height: to + 'px', opacity: to ? 1 : 0 }
      ];
      if (isSpoiler) {
        k[0].filter = from ? 'blur(0)' : 'blur(6px)';
        k[1].filter = to ? 'blur(0)' : 'blur(6px)';
      }
      return k;
    }

    function run(from, to, done) {
      if (anim) anim.cancel();
      content.style.overflow = 'hidden';
      content.style.height = from + 'px';
      anim = content.animate(keyframes(from, to), { duration: 280, easing: 'ease' });
      anim.onfinish = function () {
        anim = null;
        content.style.height = '';
        content.style.overflow = '';
        content.style.filter = '';
        if (done) done();
      };
    }

    summary.addEventListener('click', function (e) {
      if (reduce || typeof content.animate !== 'function') return; // native toggle
      e.preventDefault();
      if (details.open) {
        run(content.scrollHeight, 0, function () { details.open = false; });
      } else {
        details.open = true;
        run(0, content.scrollHeight, null);
      }
    });
  });
}

// Boot everything once the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  initNavToggle();
  initFadeIn();
  initCopyButtons();
  initCodeLabels();
  initMath();
  initMermaid();
  initCallouts();
  initDetailsAnimation();
  initHighlight();
  initTaskLists();
  initTableWrap();
  initFigures();
  initProgressBar();
  initThemeToggle();
  initBackToTop();
  initShareBtn();
  initSearch();
  initToc();
  initTocToggle();
  initHeadingAnchors();
  initLightbox();
  initProseReveal();
});
