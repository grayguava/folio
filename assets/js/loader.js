// ── data loader ──

(function() {
  function loadJSON(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send();
      if (xhr.status === 200) return JSON.parse(xhr.responseText);
    } catch (e) {}
    return null;
  }

  window.POSTS = loadJSON('slugs/meta/posts.json') || [];
  window.PROJECTS = loadJSON('slugs/meta/projects.json') || [];
  window.SKILLS = loadJSON('slugs/profile/skills.json') || [];
  window.WORK = loadJSON('slugs/meta/work.json') || [];

  var base = loadJSON('slugs/profile/about.json') || {};
  var socials = loadJSON('slugs/profile/socials.json') || [];
  var pageSub = loadJSON('slugs/meta/pages.json') || {};

  window.PROFILE = {
    name: base.name || 'grayguava',
    sub: base.sub || '',
    bio: base.bio || '',
    socials: socials,
    pageSub: pageSub,
  };
})();
