// ── orchestrator (theme, hash router) ──

(function() {

// ── theme toggle ──

var saved = localStorage.getItem('theme');
var theme = saved || 'dark';
if (theme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}

window.toggleTheme = function() {
  var current = document.documentElement.getAttribute('data-theme');
  if (current === 'light') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
};

// ── hash router ──

// ── route definitions ──

var ROUTES = {
  '': 'home',
  'blog': 'blog',
  'projects': 'projects',
  'skills': 'skills',
  'work': 'work',
};

// ── hash parser ──

function parseHash() {
  var hash = window.location.hash.slice(1) || '';
  var parts = hash.split('?');
  var path = parts[0];
  var query = {};
  if (parts[1]) {
    parts[1].split('&').forEach(function(pair) {
      var kv = pair.split('=');
      query[kv[0]] = decodeURIComponent(kv[1] || '');
    });
  }
  return { path: path, query: query };
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

// ── hashchange listener ──

window.addEventListener('hashchange', route);

// ── home link click handler ──

document.addEventListener('click', function(e) {
  var homeLink = document.getElementById('nav-home');
  if (homeLink && e.target.closest('#nav-home')) {
    if (window.location.hash) {
      history.pushState({}, '', window.location.pathname);
      route();
    }
  }
});

// ── keyboard shortcuts ──

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

// ── initial route ──

route();

})();
