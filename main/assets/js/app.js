
(function() {

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

var ROUTES = {
  '': 'home',
  'blog': 'blog',
  'projects': 'projects',
  'skills': 'skills',
  'work': 'work',
};

function parseHash() {
  var hash = window.location.hash.slice(1) || '';
  var parts = hash.split('?');
  var path = parts[0];
  var query = {};
  if (parts[1]) {
    parts[1].split('&').forEach(function(pair) {
      var kv = pair.split('=');
      try {
        query[kv[0]] = decodeURIComponent(kv[1] || '');
      } catch (_) {
        query[kv[0]] = kv[1] || '';
      }
    });
  }
  return { path: path, query: query };
}

function setActiveNav(key) {
  document.querySelectorAll('.nav-link').forEach(function(a) {
    a.classList.toggle('active', a.dataset.nav === key);
  });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.style.display = p.id === 'page-' + pageId ? '' : 'none';
  });
}

function route() {
  var r = parseHash();
  var pageKey = ROUTES[r.path];
  var navKey = pageKey;

  if (r.path === 'blog' && r.query.p) {
    pageKey = 'post';
    navKey = 'blog';
  }

  if (!pageKey) {
    pageKey = 'home';
  }

  showPage(pageKey);
  window.scrollTo(0, 0);
  setActiveNav(navKey);

  if (window.pageInits && window.pageInits[pageKey]) {
    window.pageInits[pageKey](r.query);
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);

document.addEventListener('click', function(e) {
  var homeLink = document.getElementById('nav-home');
  if (homeLink && e.target.closest('#nav-home')) {
    if (window.location.hash) {
      history.pushState({}, '', window.location.pathname);
      route();
    }
  }
});

document.addEventListener('keydown', function(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  var map = {
    h: '',
    b: '#blog',
    p: '#projects',
    s: '#skills',
    w: '#work',
  };

  var target = map[e.key];
  if (target !== undefined) {
    if (target === '') {
      if (window.location.hash) {
        history.pushState({}, '', window.location.pathname);
        route();
      }
    } else if (window.location.hash !== target) {
      window.location.hash = target;
    }
  }

  if (e.key === 't') {
    if (window.toggleTheme) window.toggleTheme();
  }
});

(window._dataReady || Promise.resolve()).then(route);

})();