/* ── hash router ── */

(function() {
  var ROUTES = {
    '': 'home',
    'blog': 'blog',
    'projects': 'projects',
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
        query[kv[0]] = decodeURIComponent(kv[1] || '');
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
    setActiveNav(navKey);

    if (window.pageInits && window.pageInits[pageKey]) {
      window.pageInits[pageKey](r.query);
    }
  }

window.addEventListener('hashchange', route);

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
      var btn = document.getElementById('theme-toggle');
      if (btn) btn.click();
    }
  });

  route();
})();