// ── orchestrator (theme, routing) ──

(function() {

// ── safe storage wrapper ──

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

// ── theme toggle ──

var saved = storage.getItem('theme');
var theme = saved || 'dark';
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

// ── section from pathname (/blog/20260708001/ -> blog, / -> home) ──

function _sectionKey(pathname) {
  var m = pathname.match(/^\/(blog|projects|skills|work)(\/|$)/);
  return m ? m[1] : 'home';
}

// ── set active nav link ──

function setActiveNav(key) {
  document.querySelectorAll('.nav-link').forEach(function(a) {
    a.classList.toggle('active', a.dataset.nav === key);
  });
}

// ── show/hide pages ──

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.style.display = p.id === 'page-' + pageId ? '' : 'none';
  });
}

// ── main route handler ──

function route() {
  // on a prerendered post page, leave the inlined HTML alone but still
  // mark the section active and run the client-side chrome upgrades
  // (copy buttons, callouts, images)
  if (window.__prerenderedPost) {
    setActiveNav(_sectionKey(window.location.pathname));
    if (window.pageInits && window.pageInits.post) window.pageInits.post({});
    return;
  }
  var pageKey = _sectionKey(window.location.pathname);

  showPage(pageKey);
  window.scrollTo(0, 0);
  setActiveNav(pageKey);

  if (window.pageInits && window.pageInits[pageKey]) {
    window.pageInits[pageKey]({});
  }
}

// ── keyboard shortcuts ──

document.addEventListener('keydown', function(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  var map = {
    h: '/',
    b: '/blog/',
    p: '/projects/',
    s: '/skills/',
    w: '/work/',
  };

  var target = map[e.key];
  if (target !== undefined && window.location.pathname !== target) {
    _navigateTo(target, true);
  }

  if (e.key === 't') {
    if (window.toggleTheme) window.toggleTheme();
  }
});

// ── soft page cache (background preload so nav feels instant) ──

var _pageCache = {};

function _extractWrap(html) {
  var t = document.createElement('template');
  t.innerHTML = html;
  var w = t.content.querySelector('.wrap');
  var title = t.content.querySelector('title');
  return {
    html: w ? w.innerHTML : '',
    title: title ? title.textContent : document.title,
    prerendered: t.content.querySelector('[data-prerendered]') !== null,
  };
}

function _fetchAndCache(url) {
  if (_pageCache[url]) return Promise.resolve(_pageCache[url]);
  return fetch(url).then(function(r) {
    if (!r.ok) throw new Error('not found');
    return r.text();
  }).then(function(text) {
    _pageCache[url] = _extractWrap(text);
    return _pageCache[url];
  });
}

function _prefetchPages() {
  ['/', '/blog/', '/projects/', '/skills/', '/work/'].forEach(function(u) {
    if (!_pageCache[u]) _fetchAndCache(u).catch(function() {});
  });
}

function _navigateTo(url, push) {
  var pathname = typeof url === 'string' ? url : url.pathname;
  _fetchAndCache(url).then(function(page) {
    var wrap = document.querySelector('.wrap');
    if (wrap) wrap.innerHTML = page.html;
    document.title = page.title;
    window.__prerenderedPost = page.prerendered;
    if (push !== false) history.pushState(null, '', pathname);
    var key = _sectionKey(pathname);
    setActiveNav(key);
    if (window.pageInits && window.pageInits[key] && !page.prerendered) {
      window.pageInits[key]({});
    }
    var postEl = document.getElementById('post-content');
    if (postEl && postEl.getAttribute('data-prerendered') && window.pageInits && window.pageInits.post) {
      window.pageInits.post({});
    }
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

window.addEventListener('popstate', function() {
  _navigateTo(window.location.pathname, false);
});

_prefetchPages();

// ── initial route ──

// slug data is inlined in the html — no async load to wait for
Promise.resolve().then(route);

})();
