// slugs
var POSTS = [
  { slug: 'site-updates', title: 'Site updates — final polishes', date: 'Apr 30, 2026' },
  { slug: 'designing-cli-tools', title: 'Designing CLI tools that feel right', date: 'Apr 30, 2026' },
  { slug: 'site-journey', title: 'From forking to static — my site journey', date: 'Apr 29, 2026' },
];











// functions
function renderBlogItem(post) {
  var el = document.createElement('a');
  el.className = 'blog-item';
  el.href = '#blog?p=' + post.slug;
  el.setAttribute('data-slug', post.slug);
  el.innerHTML =
    '<span class="blog-date">' + post.date + '</span>' +
    '<span class="blog-title">' + post.title + '</span>' +
    '<span class="blog-arrow">↗</span>';
  return el;
}

function addCopyButtons() {
  document.querySelectorAll('#post-content pre').forEach(function(pre) {
    if (pre.dataset.copyBtnAdded) return;
    pre.dataset.copyBtnAdded = 'true';

    var wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    btn.title = 'copy';
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var code = pre.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent);
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        btn.title = 'copied';
        setTimeout(function() {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
          btn.title = 'copy';
        }, 1000);
      }
    });
    wrapper.appendChild(btn);
  });
}

function initPost(query) {
  var slug = query.p;
  if (!slug) return;

  var post = POSTS.find(function(p) { return p.slug === slug; });
  if (!post) return;

  setTitle(post.title);

  var content = document.getElementById('post-content');
  if (content) {
    content.innerHTML = '<p class="loading">loading...</p>';
    fetch('posts/' + slug + '.md')
      .then(function(r) { return r.text(); })
      .then(function(md) {
        var plainText = md.replace(/[#*_`\[\]()]/g, '').replace(/\n/g, ' ');
        var wordCount = plainText.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
        var codeBlocks = (md.match(/```/g) || []).length / 2;
        var readTime = Math.max(1, Math.ceil((wordCount / 220) + (codeBlocks * 0.3)));
        var meta = post.date + ' · ' + readTime + ' min read';

        var html = marked.parse(md);
        html = html.replace(/<h1>.*?<\/h1>/i, '').replace(/<p><strong>.*?<\/strong><\/p>/i, '');
        content.innerHTML = '<h1>' + post.title + '</h1><p class="post-meta">' + meta + '</p>' + html;
        document.querySelectorAll('#post-content pre code').forEach(function(block) {
          hljs.highlightElement(block);
        });
        addCopyButtons();
      });
  }
}