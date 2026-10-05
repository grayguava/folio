
(function() {
  function fetchText(url) {
    return new Promise(function(resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function() {
          if (xhr.status === 200) resolve(xhr.responseText);
          else resolve(null);
        };
        xhr.onerror = function() { resolve(null); };
        xhr.send();
      } catch (e) { resolve(null); }
    });
  }

  function loadRaw() {
    return Promise.all([
      fetchText('slugs/meta/posts.ini'),
      fetchText('slugs/meta/projects.ini'),
      fetchText('slugs/profile/skills.ini'),
      fetchText('slugs/meta/work.ini'),
      fetchText('slugs/profile/about.ini'),
      fetchText('slugs/profile/socials.ini'),
      fetchText('slugs/meta/pages.ini'),
    ]).then(function(texts) {
      var paths = [
        'meta/posts', 'meta/projects', 'profile/skills', 'meta/work',
        'profile/about', 'profile/socials', 'meta/pages',
      ];
      var g = {};
      for (var i = 0; i < paths.length; i++) {
        g[paths[i]] = parseSlug(texts[i] || '');
      }
      return g;
    });
  }

  window._dataReady = fetchText('assets/slugs.min.ini').then(function(t) {
    return t ? parseSlugsMin(t) : loadRaw();
  }).then(function(d) {
    var posts = ((d['meta/posts'] || {}).sections || []).map(function(s) {
      return { slug: s.section, title: s.kv.title || '', date: s.kv.date || '' };
    });
    var projects = ((d['meta/projects'] || {}).sections || []).map(function(s) {
      return {
        title: s.section,
        role: s.kv.role || '',
        description: s.kv.description || '',
        href: s.kv.href || '',
        tags: s.kv.tags ? s.kv.tags.split('|').map(function(x) { return x.trim(); }) : [],
      };
    });
    var skills = [];
    ((d['profile/skills'] || {}).sections || []).forEach(function(s) {
      for (var k in s.kv) skills.push({ name: k, category: s.section, href: s.kv[k] });
      s.items.forEach(function(i) { skills.push({ name: i, category: s.section }); });
    });
    var work = ((d['meta/work'] || {}).sections || []).map(function(s) {
      return { title: s.section, role: s.kv.role || '', description: s.kv.description || '' };
    });

    var base = (d['profile/about'] || {}).kv || {};
    var socials = ((d['profile/socials'] || {}).sections || []).map(function(s) {
      return { name: s.section, href: s.kv.href || '', svg: s.kv.svg || '' };
    });
    var pageSub = (d['meta/pages'] || {}).kv || {};

    window.POSTS = posts;
    window.PROJECTS = projects;
    window.SKILLS = skills;
    window.WORK = work;
    window.PROFILE = {
      name: base.name || 'grayguava',
      sub: base.sub || '',
      bio: base.bio || '',
      socials: socials,
      pageSub: pageSub,
    };
  });
})();