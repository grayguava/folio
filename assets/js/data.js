/* ── page initializers ── */

function setTitle(pageTitle) {
  document.title = pageTitle ? pageTitle + ' · grayguava' : 'grayguava';
}

function initHome(query) {
  setTitle('');
  var el = document.getElementById('scramble');
  if (el) scramble(el, el.textContent);

  var homeProjects = document.getElementById('home-projects');
  if (homeProjects) {
    homeProjects.innerHTML = '';
    PROJECTS.slice(0, 2).forEach(function(p) {
      homeProjects.appendChild(renderItem(p));
    });
  }
}

function initBlog(query) {
  setTitle('blog');
  var el = document.getElementById('scramble-blog');
  if (el) scramble(el, el.textContent);

  var list = document.getElementById('blog-list');
  if (!list) return;
  list.innerHTML = '';
  POSTS.forEach(function(p) { list.appendChild(renderBlogItem(p)); });
}

function initProjects(query) {
  setTitle('projects');
  var el = document.getElementById('scramble-projects');
  if (el) scramble(el, el.textContent);

  var list = document.getElementById('projects-list');
  if (!list) return;
  list.innerHTML = '';
  PROJECTS.forEach(function(p) { list.appendChild(renderItem(p)); });
}

function initWork(query) {
  setTitle('work');
  var el = document.getElementById('scramble-work');
  if (el) scramble(el, el.textContent);

  var list = document.getElementById('work-list');
  if (!list) return;
  list.innerHTML = '';
  WORK.forEach(function(p) { list.appendChild(renderItem(p)); });
}

window.pageInits = {
  home: initHome,
  blog: initBlog,
  projects: initProjects,
  work: initWork,
  post: initPost,
};