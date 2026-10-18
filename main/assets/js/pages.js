

var nameTyped = false;

function typeName(el, target) {
  if (!el || !target) return;
  if (el._typeTimer) { clearTimeout(el._typeTimer); el._typeTimer = null; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || nameTyped) { el.textContent = target; return; }

  // reserve the final width on the heading so the centered line stays put
  var h1 = el.parentNode;
  var cur = el.nextElementSibling; // solid while typing, blink resumes after
  el.textContent = target;
  h1.style.width = h1.getBoundingClientRect().width + 'px';
  h1.style.textAlign = 'left';
  el.textContent = '';
  if (cur) cur.style.animation = 'none';

  var i = 0;
  function step() {
    el.textContent = target.slice(0, ++i);
    if (i < target.length) {
      el._typeTimer = setTimeout(step, 150);
    } else {
      el._typeTimer = null;
      h1.style.width = '';
      h1.style.textAlign = '';
      if (cur) cur.style.animation = '';
      nameTyped = true;
    }
  }
  el._typeTimer = setTimeout(step, 120);
}


function rowHTML(p, showRole) {
  var meta = showRole ? (p.role || '') : ((p.tags || []).join(', '));
  var open = p.href
    ? '<a class="row" href="' + escHtml(p.href) + '" target="_blank" rel="noopener noreferrer">'
    : '<div class="row">';
  var close = p.href ? '</a>' : '</div>';
  return open +
    '<span class="row-name">' + escHtml(p.title) + '</span>' +
    '<span class="row-meta">' + escHtml(meta) + '</span>' +
    '<span class="row-desc">' + escHtml(p.description || '') + '</span>' +
    close;
}


function rowsHTML(list, showRole) {
  return '<div class="rows">' + list.map(function(p) {
    return rowHTML(p, showRole);
  }).join('') + '</div>';
}


function skillsHTML(list) {
  var categories = [];
  var seen = {};
  list.forEach(function(s) {
    if (!seen[s.category]) {
      seen[s.category] = true;
      categories.push(s.category);
    }
  });

  return '<div class="skills">' + categories.map(function(cat) {
    var inner = list.filter(function(s) { return s.category === cat; }).map(function(s) {
      return s.href
        ? '<a href="' + escHtml(s.href) + '" target="_blank" rel="noopener noreferrer">' + escHtml(s.name) + '</a>'
        : escHtml(s.name);
    }).join(' \u00b7 ');
    return '<div class="skill-row">' +
      '<h2 class="skill-cat">' + escHtml(cat) + '</h2>' +
      '<p class="skill-items">' + inner + '</p>' +
    '</div>';
  }).join('') + '</div>';
}


function setTitle(pageTitle) {
  var name = (window.PROFILE && PROFILE.name) || (window.SITE && window.SITE.name) || 'Site Name';
  document.title = pageTitle ? pageTitle + ' · ' + name : name;
}


function renderHomeDirs() {
  var el = document.getElementById('home-dirs');
  if (!el) return;
  var counts = {
    blog: (window.POSTS || []).length,
    projects: (window.PROJECTS || []).length,
    skills: (window.SKILLS || []).length,
    work: (window.WORK || []).length,
  };
  var enabled = (window.SITE && window.SITE.pages) || ['blog', 'projects', 'skills', 'work'];
  el.innerHTML = enabled.map(function(p) {
    return '<a href="/' + p + '/">' +
      '<span class="dir-name">' + p + '/</span>' +
      '<span class="dir-count">(' + counts[p] + ')</span>' +
    '</a>';
  }).join('');
}


function initHome(query) {
  setTitle('');
  var profile = window.PROFILE;

  var el = document.getElementById('home-name');
  if (el) typeName(el, (profile && profile.name) || (window.SITE && window.SITE.name) || '');

  var subEl = document.getElementById('home-sub');
  if (subEl && profile) subEl.textContent = profile.sub;

  var bioEl = document.getElementById('home-bio');
  if (bioEl && profile) bioEl.textContent = profile.bio;

  renderHomeDirs();
  fillSocials(document.getElementById('home-socials'));
}


function initBlog(query) {
  setTitle('blog');

  var list = document.getElementById('blog-list');
  if (!list) return;
  list.innerHTML = logHTML((window.POSTS || []), 0);
}


function initProjects(query) {
  setTitle('projects');

  var list = document.getElementById('projects-list');
  if (!list) return;
  list.innerHTML = rowsHTML((window.PROJECTS || []), false);
}


function initWork(query) {
  setTitle('work');

  var list = document.getElementById('work-list');
  if (!list) return;
  list.innerHTML = rowsHTML((window.WORK || []), true);
}


function initSkills(query) {
  setTitle('skills');

  var list = document.getElementById('skills-list');
  if (!list) return;
  list.innerHTML = skillsHTML((window.SKILLS || []));
}


function fillSocials(el) {
  if (!el || el.childElementCount) return;
  var socials = (window.PROFILE && PROFILE.socials) || [];
  socials.forEach(function(s) {
    if (!s.href) return;
    var a = document.createElement('a');
    a.href = s.href;
    a.setAttribute('aria-label', s.name || '');
    if (s.href.indexOf('mailto:') !== 0) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.innerHTML = s.svg || (s.name || '').toLowerCase();
    el.appendChild(a);
  });
}


window.pageInits = {
  home: initHome,
  blog: initBlog,
  projects: initProjects,
  skills: initSkills,
  work: initWork,
  post: initPost,
};
