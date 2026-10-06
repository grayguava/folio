// ── data loader ──

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

  // the merged jsonl is emitted by the build; if it's ever missing the site
  // degrades to empty lists rather than firing a wall of /slugs/* requests
  window._dataReady = fetchText('/assets/slugs.jsonl').then(function(t) {
    var posts = [], projects = [], skills = [], work = [], socials = [];
    var profile = null;

    if (t) {
      t.split('\n').forEach(function(line) {
        if (!line.trim()) return;
        var r;
        try { r = JSON.parse(line); } catch (e) { return; }

        if (r.t === 'post') posts.push({ slug: r.slug, title: r.title, date: r.date });
        else if (r.t === 'project') projects.push({ title: r.title, role: r.role, description: r.description, href: r.href, tags: r.tags });
        else if (r.t === 'skill') skills.push(r.href ? { name: r.name, category: r.category, href: r.href } : { name: r.name, category: r.category });
        else if (r.t === 'work') work.push({ title: r.title, role: r.role, description: r.description });
        else if (r.t === 'profile') profile = { name: r.name, sub: r.sub, bio: r.bio };
        else if (r.t === 'social') socials.push({ name: r.name, href: r.href, svg: r.svg });
      });
    }

    window.POSTS = posts;
    window.PROJECTS = projects;
    window.SKILLS = skills;
    window.WORK = work;
    window.PROFILE = profile || { name: 'grayguava', sub: '', bio: '' };
    window.PROFILE.socials = socials;
  });
})();