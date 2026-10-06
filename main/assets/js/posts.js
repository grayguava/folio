// ── blog post rendering ──

// ── blog item renderer ──

function renderBlogItem(post) {
  var el = document.createElement('a');
  el.className = 'blog-item';
  el.href = '/blog/' + post.slug + '/';
  el.setAttribute('data-slug', post.slug);
  el.innerHTML =
    '<span class="blog-date">' + post.date + '</span>' +
    '<span class="blog-title">' + post.title + '</span>' +
    '<span class="blog-arrow">↗</span>';
  return el;
}

// ── copy button SVGs ──

var COPY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
var CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

// ── add copy buttons to code blocks ──

function addCopyButtons() {
  document.querySelectorAll('#post-content pre').forEach(function(pre) {
    if (pre.dataset.copyBtnAdded) return;
    pre.dataset.copyBtnAdded = 'true';

    var code = pre.querySelector('code');

    var lang = '';
    if (code) {
      var langMatch = code.className.match(/language-(\S+)/);
      lang = langMatch ? langMatch[1] : '';
      if (lang === 'plaintext' || lang === 'nohighlight') lang = '';
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    if (lang) wrapper.setAttribute('data-lang', lang);

    var bar = document.createElement('div');
    bar.className = 'code-bar';

    var langEl = document.createElement('span');
    langEl.className = 'code-lang';
    langEl.textContent = lang;
    bar.appendChild(langEl);

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = COPY_ICON;
    btn.title = 'copy';

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(function() {
        btn.innerHTML = CHECK_ICON;
        btn.title = 'copied!';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.innerHTML = COPY_ICON;
          btn.title = 'copy';
          btn.classList.remove('copied');
        }, 1500);
      }).catch(function() {
        btn.title = 'copy failed';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.title = 'copy';
          btn.classList.remove('copied');
        }, 1500);
      });
    });

    bar.appendChild(btn);

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(bar);
    wrapper.appendChild(pre);
  });
}

// ── upgrade callouts ──

function upgradeCallouts() {
  document.querySelectorAll('#post-content blockquote').forEach(function(bq) {
    var first = bq.querySelector('p:first-child');
    if (!first) return;
    var m = first.textContent.match(/^\[!NOTE\]/i);
    if (!m) return;
    bq.classList.add('callout-info');
    first.innerHTML = first.innerHTML.replace(/\[!NOTE\]\s*/i, '');
    if (!first.textContent.trim()) first.remove();
  });
}

// ── upgrade images with flag syntax ──

function upgradeImages() {
  var SIZE_MAP = {
    small:  'img-small',
    medium: 'img-medium',
    large:  'img-large',
    full:   'img-full',
  };
  var POS_MAP = {
    left:   'img-float-left',
    right:  'img-float-right',
    center: 'img-center',
  };

  document.querySelectorAll('#post-content img').forEach(function(img) {
    var raw = img.getAttribute('alt') || '';
    var parts = raw.split('|').map(function(s) { return s.trim(); });
    var alt = parts[0];
    var flags = parts.slice(1).map(function(s) { return s.toLowerCase(); });

    img.setAttribute('alt', alt);

    var link = document.createElement('a');
    link.href = img.getAttribute('src');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    img.parentNode.insertBefore(link, img);
    link.appendChild(img);

    if (!flags.length) return;

    var posClass = '';
    var sizeClass = '';

    flags.forEach(function(f) {
      if (POS_MAP[f])  posClass  = POS_MAP[f];
      if (SIZE_MAP[f]) sizeClass = SIZE_MAP[f];
    });

    var figure = document.createElement('figure');
    figure.className = ['img-wrap', posClass, sizeClass].filter(Boolean).join(' ');

    link.parentNode.insertBefore(figure, link);
    figure.appendChild(link);

    var parent = figure.parentNode;
    if (parent && parent.tagName === 'P' && parent.childNodes.length === 1) {
      parent.parentNode.insertBefore(figure, parent);
      parent.parentNode.removeChild(parent);
    }
  });

  document.querySelectorAll('#post-content h2, #post-content h3, #post-content h4, #post-content hr').forEach(function(el) {
    el.style.clear = 'both';
  });
}

// ── main post initializer ──

// Every post is prerendered into dist/blog/<slug>/index.html at build time,
// so the article HTML (including syntax highlighting and link chrome) is
// already in the page — only the interactive bits are added here.
function initPost() {
  var content = document.getElementById('post-content');
  if (!content || !content.getAttribute('data-prerendered')) return;

  addCopyButtons();
  upgradeCallouts();
  upgradeImages();
}
