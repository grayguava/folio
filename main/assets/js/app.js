/* app.js
   SPDX-License-Identifier: GPL-3.0-only
   Copyright (C) 2026 grayguava */

// orchestrator (theme, routing)

(function() {

// safe storage wrapper

var storage;

try {
  localStorage.setItem('__test__', '1');
  localStorage.removeItem('__test__');
  storage = localStorage;
} catch (_) {
  setTimeout(function() {
    console.log("%c localStorage unavailable :( \n%cYou can change the theme but it won't persist. Enjoy the site anyway! ", "color:#ff6b35;font-size:18px;font-weight:bold", "color:#888;font-size:13px");
  }, 5000);
  storage = {
    getItem: function () { return null; },
    setItem: function () {}
  };
}


var saved = storage.getItem('theme');
var theme = saved || ((window.SITE && window.SITE.theme) || 'dark');
if (theme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}

window.toggleTheme = function() {
  var current = document.documentElement.getAttribute('data-theme');
  if (current === 'light') {
    document.documentElement.removeAttribute('data-theme');
    storage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    storage.setItem('theme', 'light');
  }
};


// pages enabled at build time (window.SITE is inlined by the build;
// all-on fallback when opening source files directly)
var SITE_PAGES = (window.SITE && window.SITE.pages) || ['blog', 'projects', 'skills', 'work'];
var PAGE_KEYS = { blog: 'b', projects: 'p', skills: 's', work: 'w' };

function _sectionKey(pathname) {
  if (!SITE_PAGES.length) return 'home';
  var m = pathname.match(new RegExp('^\\/(' + SITE_PAGES.join('|') + ')(\\/|$)'));
  return m ? m[1] : 'home';
}


function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.style.display = p.id === 'page-' + pageId ? '' : 'none';
  });
}


function route() {
  var pageKey = _sectionKey(window.location.pathname);

  // on a prerendered post page, leave the inlined HTML alone but still
  // run the client-side chrome upgrades (copy buttons, callouts, images)
  if (window.__prerenderedPost) {
    if (window.pageInits && window.pageInits.post) window.pageInits.post({});
    return;
  }

  showPage(pageKey);
  window.scrollTo(0, 0);

  if (window.pageInits && window.pageInits[pageKey]) {
    window.pageInits[pageKey]({});
  }

  _observeBlogRows();
}


document.addEventListener('keydown', function(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  var map = { h: '/' };
  SITE_PAGES.forEach(function(p) {
    if (PAGE_KEYS[p]) map[PAGE_KEYS[p]] = '/' + p + '/';
  });

  var target = map[e.key];
  if (target !== undefined && window.location.pathname !== target) {
    _navigateTo(target, true);
  }

  if (e.key === 't') {
    if (window.toggleTheme) window.toggleTheme();
  }
});

// soft page cache (background preload so nav feels instant)

var _pageCache = {};
var _pending = {};

var _seoSelector = 'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], ' +
  'meta[name="author"], meta[property^="article:"], link[rel="canonical"], ' +
  'link[rel="alternate"][type="application/rss+xml"], script[type="application/ld+json"]';

function _extractWrap(html) {
  var doc = new DOMParser().parseFromString(html, 'text/html');
  var w = doc.querySelector('.wrap');
  var title = doc.querySelector('title');
  return {
    html: w ? w.innerHTML : '',
    title: title ? title.textContent : document.title,
    prerendered: doc.querySelector('[data-prerendered]') !== null,
    seo: Array.prototype.map.call(doc.head.querySelectorAll(_seoSelector), function(el) {
      return el.outerHTML;
    }),
  };
}

function _replaceSeo(page) {
  document.head.querySelectorAll(_seoSelector).forEach(function(el) { el.remove(); });
  (page.seo || []).forEach(function(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    if (t.content.firstElementChild) document.head.appendChild(t.content.firstElementChild);
  });
}

function _fetchAndCache(url, low) {
  if (_pageCache[url]) return Promise.resolve(_pageCache[url]);
  if (_pending[url]) return _pending[url];
  _pending[url] = fetch(url, low ? { priority: 'low' } : undefined).then(function(r) {
    if (!r.ok) throw new Error('not found');
    return r.text();
  }).then(function(text) {
    _pageCache[url] = _extractWrap(text);
    delete _pending[url];
    return _pageCache[url];
  }).catch(function(err) {
    delete _pending[url];
    throw err;
  });
  return _pending[url];
}

function _prefetchPages() {
  var urls = ['/'];
  SITE_PAGES.forEach(function(p) { urls.push('/' + p + '/'); });
  urls.forEach(function(u) {
    if (u === window.location.pathname || _pageCache[u]) return;
    _fetchAndCache(u, true).catch(function() {});
  });
}

// touch devices have no hover to read intent from, so each blog row warms
// once it scrolls into view (150px early) — anything tappable is already
// fetched, and the data spent tracks what was actually browsed
var _blogObserver = null;

function _observeBlogRows() {
  if (!('IntersectionObserver' in window)) return;
  if (window.location.pathname !== '/blog/') return;
  if (!window.matchMedia('(hover: none)').matches) return;
  var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (navigator.onLine === false || (c && c.saveData)) return;
  if (_blogObserver) _blogObserver.disconnect();
  _blogObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (!en.isIntersecting) return;
      _blogObserver.unobserve(en.target);
      _warmPost(en.target);
    });
  }, { rootMargin: '150px 0px' });
  document.querySelectorAll('#blog-list a.log-row').forEach(function(a) {
    _blogObserver.observe(a);
  });
}

// prefetch only once loaded and idle — first paint and fonts own the
// bandwidth until then; navigations above keep normal priority
function _schedulePrefetch() {
  function run() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(function() { _prefetchPages(); }, { timeout: 3000 });
    } else {
      setTimeout(_prefetchPages, 1500);
    }
  }
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
}

function _navigateTo(url, push) {
  var pathname = typeof url === 'string' ? url : url.pathname;
  _fetchAndCache(url).then(function(page) {
    var wrap = document.querySelector('.wrap');
    if (wrap) wrap.innerHTML = page.html;
    document.title = page.title;
    _replaceSeo(page);
    window.__prerenderedPost = page.prerendered;
    if (push !== false) history.pushState(null, '', pathname);
    var key = _sectionKey(pathname);
    if (window.pageInits && window.pageInits[key] && !page.prerendered) {
      window.pageInits[key]({});
    }
    var postEl = document.getElementById('post-content');
    if (postEl && postEl.getAttribute('data-prerendered') && window.pageInits && window.pageInits.post) {
      window.pageInits.post({});
    }
    _observeBlogRows();
    window.scrollTo(0, 0);
  }).catch(function() {
    window.location.href = pathname;
  });
}

document.addEventListener('click', function(e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest('a[href]');
  if (!a || a.target === '_blank') return;
  var href = a.getAttribute('href');
  if (!href || href.charAt(0) !== '/') return;
  if (/^\/(assets|api|slugs|files|fonts)\//.test(href)) return;
  e.preventDefault();
  _navigateTo(href, true);
});

// warm a post as soon as intent shows on its blog row — pointer (hover on
// desktop, first touch on phones) or keyboard focus — into the same soft
// page cache the click reads, so the swap needs no fresh fetch
function _warmPost(a) {
  var href = a.getAttribute('href');
  if (!href || href.charAt(0) !== '/' || _pageCache[href] || _pending[href]) return;
  _fetchAndCache(href, true).catch(function() {});
}

document.addEventListener('pointerover', function(e) {
  var a = e.target.closest ? e.target.closest('a.log-row') : null;
  if (a) _warmPost(a);
});

document.addEventListener('focusin', function(e) {
  var a = e.target.closest ? e.target.closest('a.log-row') : null;
  if (a) _warmPost(a);
});

window.addEventListener('popstate', function() {
  _navigateTo(window.location.pathname, false);
});

_schedulePrefetch();


// slug data is inlined in the html — no async load to wait for
Promise.resolve().then(route);

})();
