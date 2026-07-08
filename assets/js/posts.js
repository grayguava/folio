// ── blog post rendering ──

// ── module state ──

var postCache = {};
var _prefetchInstalled = false;

// ── blog item renderer ──

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

// ── copy button SVGs ──

var COPY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
var CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

// ── add copy buttons to code blocks ──

function addCopyButtons() {
  document.querySelectorAll('#post-content pre').forEach(function(pre) {
    if (pre.dataset.copyBtnAdded) return;
    pre.dataset.copyBtnAdded = 'true';

    var wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';

    var code = pre.querySelector('code');
    if (code) {
      var langMatch = code.className.match(/language-(\S+)/);
      var lang = langMatch ? langMatch[1] : null;
      if (lang && lang !== 'plaintext' && lang !== 'nohighlight') {
        wrapper.setAttribute('data-lang', lang);
      }
    }

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

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
      });
    });

    wrapper.appendChild(btn);
  });
}

// ── upgrade task lists ──

function upgradeTaskLists() {
  document.querySelectorAll('#post-content ul').forEach(function(ul) {
    var inputs = ul.querySelectorAll('input[type="checkbox"]');
    if (!inputs.length) return;
    inputs.forEach(function(input) {
      input.removeAttribute('disabled');
    });
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

// ── upgrade lead paragraphs ──

function upgradeLeadParagraphs() {
  document.querySelectorAll('#post-content p').forEach(function(p) {
    if (p.innerHTML.trimEnd().endsWith('{: .lead}')) {
      p.innerHTML = p.innerHTML.replace(/\{:\s*\.lead\}\s*$/, '').trimEnd();
    }
  });
}

// ── lazy-load script utility ──

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.onload = resolve;
    s.onerror = reject;
    s.src = src;
    document.head.appendChild(s);
  });
}

// ── load post dependencies ──

function loadPostDependencies(md) {
  var chain = [];

  if (!window.marked) {
    chain.push(loadScript('assets/vendor/marked.min.js'));
  }

  if (!window.hljs && md && md.includes('```')) {
    chain.push(loadScript('assets/vendor/highlight.min.js').catch(function() {}));
  }

  return Promise.all(chain).then(function() { return md; });
}

// ── prefetch blog posts on hover ──

window.installBlogHoverPrefetch = function installBlogHoverPrefetch() {
  if (_prefetchInstalled) return;
  _prefetchInstalled = true;

  ['assets/vendor/marked.min.js', 'assets/vendor/highlight.min.js'].forEach(function(src) {
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  });

  var lists = document.querySelectorAll('#blog-list, #home-posts');
  var timer = null;
  lists.forEach(function(list) {
    list.addEventListener('mouseover', function(e) {
      var item = e.target.closest('.blog-item');
      if (!item) return;
      var slug = item.getAttribute('data-slug');
      if (!slug || postCache[slug]) return;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fetch('/api/markdown/' + slug + '.md').then(function(r) {
          if (r.ok) return r.text();
        }).then(function(md) {
          if (md) postCache[slug] = md;
        }).catch(function() {});
      }, 100);
    });
  });
}

// ── main post initializer ──

function initPost(query) {
  var slug = query.p;
  if (!slug) return;

  var post = POSTS.find(function(p) { return p.slug === slug; });
  if (!post) return;

  setTitle(post.title);

  var content = document.getElementById('post-content');
  if (!content) return;

  content.innerHTML = '<p class="loading">loading...</p>';

  var fetchPromise = postCache[slug]
    ? Promise.resolve(postCache[slug])
    : fetch('/api/markdown/' + slug + '.md').then(function(r) {
        if (!r.ok) throw new Error('not found');
        return r.text();
      });

  fetchPromise
    .then(loadPostDependencies)
    .then(function(md) {
      var plainText = md.replace(/```[\s\S]*?```/g, '').replace(/[#*_`\[\]()]/g, '').replace(/\n/g, ' ');
      var wordCount = plainText.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
      var codeBlocks = (md.match(/```/g) || []).length / 2;
      var readTime = Math.max(1, Math.ceil((wordCount / 220) + (codeBlocks * 0.3)));

      var html = marked.parse(md);

      html = html.replace(/^(\s*<h1[^>]*>[\s\S]*?<\/h1>)(\s*<p><strong>[^<]*<\/strong><\/p>)?/i, '');

      content.innerHTML =
        '<h1>' + post.title + '</h1>' +
        '<p class="post-meta">' +
          '<time>' + post.date + '</time>' +
          '<span class="reading-time">· ' + readTime + ' min read</span>' +
        '</p>' +
        html;

      if (window.hljs) {
        hljs.configure({ languages: [] });
        content.querySelectorAll('pre code').forEach(function(block) {
          var hasExplicitLang = Array.from(block.classList).some(function(c) {
            return c.startsWith('language-') && c !== 'language-plaintext' && c !== 'language-nohighlight';
          });
          if (hasExplicitLang) {
            hljs.highlightElement(block);
          } else {
            block.classList.add('language-plaintext');
          }
        });
      }

      addCopyButtons();
      upgradeTaskLists();
      upgradeCallouts();
      upgradeImages();
      upgradeLeadParagraphs();

      content.querySelectorAll('a[href]').forEach(function(a) {
        var href = a.getAttribute('href');
        if (href && (href.startsWith('https://') || href.startsWith('http://'))) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      });
    })
    .catch(function(err) {
      var msg = err && err.message === 'not found'
        ? 'post not found.'
        : 'could not render post.';
      content.innerHTML = '<p>' + msg + '</p>';

    });
}
