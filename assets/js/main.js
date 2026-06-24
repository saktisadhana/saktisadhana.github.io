// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');

if (toggle && links) {
  toggle.addEventListener('click', function () {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });
}

// Fade-in on scroll
function initFadeIn() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', initFadeIn);

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

document.addEventListener('DOMContentLoaded', initCopyButtons);

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

document.addEventListener('DOMContentLoaded', initProgressBar);

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
    syncGiscus(theme);
  }

  applyTheme(localStorage.getItem('theme') || 'dark');

  // Giscus iframe isn't ready at DOMContentLoaded — sync once it signals it has loaded
  window.addEventListener('message', function onGiscusReady(e) {
    if (e.origin !== 'https://giscus.app') return;
    syncGiscus(document.documentElement.getAttribute('data-theme') || 'dark');
    window.removeEventListener('message', onGiscusReady);
  });

  btn.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);

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

document.addEventListener('DOMContentLoaded', initBackToTop);

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

document.addEventListener('DOMContentLoaded', initShareBtn);

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
    if (empty) empty.style.display = visible === 0 && q ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
