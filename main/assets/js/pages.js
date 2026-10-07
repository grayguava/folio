// ── page initializers ──

// ── scramble animation ──

function scramble(el, target, duration) {
  if (!el) return;
  if (el._scrambleRAF) cancelAnimationFrame(el._scrambleRAF);

  duration = duration || 200;
  var chars = 'abcdefghijklmnopqrstuvwxyz';
  var steps = Math.ceil(duration / 10);
  var frame = 0;

  function tick() {
    var progress = frame / steps;
    var revealed = Math.floor(progress * target.length);
    var out = '';
    for (var i = 0; i < target.length; i++) {
      if (i < revealed) {
        out += target[i];
      } else {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    el.textContent = out;
    frame++;
    if (frame <= steps) {
      el._scrambleRAF = requestAnimationFrame(tick);
    } else {
      el._scrambleRAF = null;
      el.textContent = target;
    }
  }

  tick();
}

// ── project item renderer ──

function renderItem(p) {
  var hasLink = !!p.href;
  var el = document.createElement(hasLink ? 'a' : 'div');
  el.className = 'item';
  if (hasLink) {
    el.href = p.href;
    el.target = '_blank';
    el.rel = 'noopener';
  }

  var tagsHtml = '';
  if (p.tags && p.tags.length) {
    tagsHtml = '<div class="item-tags">' + p.tags.map(function(t) {
      return '<span class="item-tag">' + t + '</span>';
    }).join('') + '</div>';
  }

  el.innerHTML =
    '<div class="item-body">' +
      '<div class="item-title">' + p.title + '</div>' +
      '<div class="item-meta">' + p.role + '</div>' +
      '<div class="item-desc">' + p.description + '</div>' +
      tagsHtml +
    '</div>' +
    (hasLink ? '<div class="item-arrow">↗</div>' : '');
  return el;
}

// ── set page title ──

function setTitle(pageTitle) {
  var name = (window.PROFILE && PROFILE.name) || (window.SITE && window.SITE.name) || 'grayguava';
  document.title = pageTitle ? pageTitle + ' · ' + name : name;
}

// ── init home page ──

function initHome(query) {
  setTitle('');
  var profile = window.PROFILE;

  var el = document.getElementById('scramble');
  if (el) {
    el.textContent = (profile && profile.name) || 'grayguava';
    scramble(el, el.textContent);
  }

  var subEl = document.getElementById('home-sub');
  if (subEl && profile) subEl.textContent = profile.sub;

  var bioEl = document.getElementById('home-bio');
  if (bioEl && profile) bioEl.textContent = profile.bio;

  var socialContainer = document.getElementById('social-links');
  if (socialContainer && profile && profile.socials) {
    socialContainer.innerHTML = '';
    profile.socials.forEach(function(s) {
      var a = document.createElement('a');
      a.href = s.href;
      a.title = s.name;
      if (!s.href.startsWith('mailto:')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      a.innerHTML = s.svg;
      socialContainer.appendChild(a);
    });
  }

  var homeProjects = document.getElementById('home-projects');
  var homeCfg = (window.SITE && window.SITE.homePreview) || {};
  if (homeProjects) {
    homeProjects.innerHTML = '';
    var projectCount = typeof homeCfg.projects === 'number' ? homeCfg.projects : 2;
    if (projectCount === 0) {
      var projectSec = homeProjects.closest('section');
      if (projectSec) projectSec.remove();
    } else {
      PROJECTS.slice(0, projectCount).forEach(function(p) {
        homeProjects.appendChild(renderItem(p));
      });
    }
  }

  var homeWork = document.getElementById('home-work');
  if (homeWork) {
    homeWork.innerHTML = '';
    var workCount = typeof homeCfg.work === 'number' ? homeCfg.work : 2;
    if (workCount === 0) {
      var workSec = homeWork.closest('section');
      if (workSec) workSec.remove();
    } else {
      WORK.slice(0, workCount).forEach(function(p) {
        homeWork.appendChild(renderItem(p));
      });
    }
  }

  var homePosts = document.getElementById('home-posts');
  if (homePosts) {
    homePosts.innerHTML = '';
    var postCount = typeof homeCfg.posts === 'number' ? homeCfg.posts : 4;
    if (postCount === 0) {
      var postSec = homePosts.closest('section');
      if (postSec) postSec.remove();
    } else {
      POSTS.slice(0, postCount).forEach(function(p) {
        homePosts.appendChild(renderBlogItem(p));
      });
    }
  }
}

// ── init blog page ──

function initBlog(query) {
  setTitle('blog');

  var el = document.getElementById('scramble-blog');
  if (el) {
    el.textContent = 'writing';
    scramble(el, el.textContent);
  }

  var list = document.getElementById('blog-list');
  if (!list) return;
  list.innerHTML = '';
  POSTS.forEach(function(p) { list.appendChild(renderBlogItem(p)); });
}

// ── init projects page ──

function initProjects(query) {
  setTitle('projects');

  var el = document.getElementById('scramble-projects');
  if (el) {
    el.textContent = 'projects';
    scramble(el, el.textContent);
  }

  var list = document.getElementById('projects-list');
  if (!list) return;
  list.innerHTML = '';
  PROJECTS.forEach(function(p) { list.appendChild(renderItem(p)); });
}

// ── init work page ──

function initWork(query) {
  setTitle('work');

  var el = document.getElementById('scramble-work');
  if (el) {
    el.textContent = 'work';
    scramble(el, el.textContent);
  }

  var list = document.getElementById('work-list');
  if (!list) return;
  list.innerHTML = '';
  WORK.forEach(function(p) { list.appendChild(renderItem(p)); });
}

// ── init skills page ──

function initSkills(query) {
  setTitle('skills');

  var el = document.getElementById('scramble-skills');
  if (el) {
    el.textContent = 'skills';
    scramble(el, el.textContent);
  }

  var list = document.getElementById('skills-list');
  if (!list) return;
  list.innerHTML = '';

  var categories = [];
  var seen = {};
  SKILLS.forEach(function(s) {
    if (!seen[s.category]) {
      seen[s.category] = true;
      categories.push(s.category);
    }
  });

  categories.forEach(function(cat) {
    var details = document.createElement('details');
    var summary = document.createElement('summary');
    summary.textContent = cat;
    details.appendChild(summary);

    var content = document.createElement('div');
    content.className = 'skills-content';

    var items = SKILLS.filter(function(s) { return s.category === cat; });
    items.forEach(function(s, i) {
      if (i > 0) {
        content.appendChild(document.createTextNode(' \u00b7 '));
      }
      if (s.href) {
        var a = document.createElement('a');
        a.href = s.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = s.name;
        content.appendChild(a);
      } else {
        var span = document.createElement('span');
        span.textContent = s.name;
        content.appendChild(span);
      }
    });

    details.appendChild(content);
    list.appendChild(details);
  });
}

// ── page init registry ──

window.pageInits = {
  home: initHome,
  blog: initBlog,
  projects: initProjects,
  skills: initSkills,
  work: initWork,
  post: initPost,
};
