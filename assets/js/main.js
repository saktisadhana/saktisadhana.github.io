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
    toggle.classList.toggle('open');
    links.classList.toggle('open');
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

// Copy button on code blocks
function initCopyButtons() {
  document.querySelectorAll('.prose pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'copy';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code') || pre;
      navigator.clipboard.writeText(code.innerText).then(function () {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
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
    navigator.clipboard.writeText(window.location.href).then(function () {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
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

  input.addEventListener('input', function () {
    var q = input.value.toLowerCase().trim();
    var items = list.querySelectorAll('li[data-title]');
    var visible = 0;
    items.forEach(function (item) {
      var match = !q || item.dataset.title.includes(q) || (item.dataset.tags || '').includes(q);
      item.style.display = match ? '' : 'none';
      if (match) visible++;
    });
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

// Boot everything once the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  initNavToggle();
  initFadeIn();
  initCopyButtons();
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
