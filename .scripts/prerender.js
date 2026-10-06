// prerender.js — emit clean-URL HTML for every post + page shells for the
// SPA routes. Runs after build.js; reads dist/ and adds dist/blog/<slug>/.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');
const dist = path.join(root, 'dist');

const marked = require(path.join(main, 'assets/vendor/marked.min.js'));
const hljs = require(path.join(main, 'assets/vendor/highlight.min.js'));
const { loadData } = require('./slugs.js');
const { discoverPosts } = require('./frontmatter.js');
const posts = discoverPosts();

// marked escapes code contents; hljs wants the raw text back
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&'); // last, so &amp;lt; decodes correctly
}

// bake syntax highlighting into the prerendered HTML — no client-side hljs
function highlightCodeBlocks(html) {
  return html.replace(
    /<pre><code class="language-([A-Za-z0-9_+-]+)">([\s\S]*?)<\/code><\/pre>/g,
    (m, lang, inner) => {
      if (lang === 'plaintext' || lang === 'nohighlight') return m;
      if (!hljs.getLanguage(lang)) return m; // e.g. ```tree stays plain
      const out = hljs.highlight(decodeEntities(inner), { language: lang, ignoreIllegals: true });
      return '<pre><code class="language-' + lang + ' hljs">' + out.value + '</code></pre>';
    }
  );
}

// post-process anchors: rewrite legacy hash-router links to clean URLs,
// open external links in a new tab, wrap text links in .link-text so the
// hover underline works (image links stay unwrapped, no underline)
function fixupLinks(html) {
  return html.replace(/<a\s([^>]*)>([\s\S]*?)<\/a>/g, (m, attrs, inner) => {
    const hm = attrs.match(/\bhref="([^"]*)"/);
    if (!hm) return m;
    let href = hm[1];

    const legacy = href.match(/^\/?#blog\?p=([^&]+)/); // /#blog?p=slug -> /blog/slug/
    if (legacy) {
      href = '/blog/' + decodeURIComponent(legacy[1]) + '/';
      attrs = attrs.replace(/\bhref="[^"]*"/, 'href="' + href + '"');
    }

    if (/^https?:\/\//.test(href) && !/\btarget=/.test(attrs)) {
      attrs += ' target="_blank" rel="noopener noreferrer"';
    }

    if (/<img\b/.test(inner)) return '<a ' + attrs + '>' + inner + '</a>';
    return '<a ' + attrs + '><span class="link-text">' + inner + '</span></a>';
  });
}

function prerenderPost(post) {
  const md = post.body;
  if (!post.hasFrontmatter) { console.warn('skip (no frontmatter): ' + post.slug); return; }

  const plainText = md.replace(/```[\s\S]*?```/g, '').replace(/[#*_`\[\]()]/g, '').replace(/\n/g, ' ');
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
  const codeBlocks = (md.match(/```/g) || []).length / 2;
  const readTime = Math.max(1, Math.ceil(wordCount / 220 + codeBlocks * 0.3));

  let html = marked.parse(md);
  html = highlightCodeBlocks(html);
  html = html.replace(/^(\s*<h1[^>]*>[\s\S]*?<\/h1>)(\s*<p><strong>[^<]*<\/strong><\/p>)?/i, '');
  html = fixupLinks(html);

  const article =
    '<h1>' + post.title + '</h1>' +
    '<p class="post-meta">' +
      '<time>' + post.dateDisplay + '</time>' +
      '<span class="reading-time">· ' + readTime + ' min read</span>' +
    '</p>' +
    html;

  let out = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  out = out
    .replace('<title>grayguava</title>', '<title>' + post.title + ' · grayguava</title>')
    .replace('<body>', '<body>\n<script>window.__prerenderedPost = true;</script>')
    .replace('<section id="page-home" class="page">', '<section id="page-home" class="page" style="display:none">')
    .replace('<section id="page-post" class="page" style="display:none">', '<section id="page-post" class="page">')
    .replace('<article id="post-content"></article>', '<article id="post-content" data-prerendered="1">' + article + '</article>');

  out = keepOnlySection(out, 'page-post');

  const dir = path.join(dist, 'blog', post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  console.log('blog/' + post.slug + '/ (' + (out.length / 1024).toFixed(1) + ' kB)');
}

for (const p of posts) prerenderPost(p);

function itemHTML(p) {
  var hasLink = !!p.href;
  var tagsHtml = '';
  if (p.tags && p.tags.length) {
    tagsHtml = '<div class="item-tags">' + p.tags.map(function(t) {
      return '<span class="item-tag">' + t + '</span>';
    }).join('') + '</div>';
  }
  return '<a' + (hasLink ? ' class="item" href="' + p.href + '" target="_blank" rel="noopener"' : ' class="item"') + '>' +
    '<div class="item-body">' +
      '<div class="item-title">' + p.title + '</div>' +
      '<div class="item-meta">' + (p.role || '') + '</div>' +
      '<div class="item-desc">' + (p.description || '') + '</div>' +
      tagsHtml +
    '</div>' +
    (hasLink ? '<div class="item-arrow">↗</div>' : '') +
  '</a>';
}

function blogItemHTML(p) {
  return '<a class="blog-item" href="/blog/' + p.slug + '/" data-slug="' + p.slug + '">' +
    '<span class="blog-date">' + p.dateDisplay + '</span>' +
    '<span class="blog-title">' + p.title + '</span>' +
    '<span class="blog-arrow">↗</span>' +
  '</a>';
}

function buildSkillsHTML(SKILLS) {
  var categories = [], seen = {};
  SKILLS.forEach(function(s) { if (!seen[s.category]) { seen[s.category] = true; categories.push(s.category); } });
  return categories.map(function(cat) {
    var items = SKILLS.filter(function(s) { return s.category === cat; });
    var inner = items.map(function(s) {
      return s.href
        ? '<a href="' + s.href + '" target="_blank" rel="noopener">' + s.name + '</a>'
        : '<span>' + s.name + '</span>';
    }).join(' · ');
    return '<details><summary>' + cat + '</summary><div class="skills-content">' + inner + '</div></details>';
  }).join('');
}

// keep only the page <section> this shell serves (drop the other hidden ones)
function keepOnlySection(html, keepId) {
  const opener = /<section id="(page-[a-z-]+)" class="page"[^>]*>/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = opener.exec(html)) !== null) {
    if (m[1] === keepId) continue;
    const start = m.index;
    const end = sectionEnd(html, opener.lastIndex);
    out += html.slice(last, start);
    last = end;
    opener.lastIndex = end;
  }
  return out + html.slice(last);
}

// index just past the matching </section>
function sectionEnd(html, from) {
  const tags = /<section\b|<\/section>/g;
  tags.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = tags.exec(html)) !== null) {
    if (m[0] === '</section>') {
      depth--;
      if (depth === 0) return tags.lastIndex;
    } else {
      depth++;
    }
  }
  return html.length;
}

function emitPage(route, pageId, containerId, innerHTML) {
  let out = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  out = out
    .replace('<section id="page-home" class="page">', '<section id="page-home" class="page" style="display:none">')
    .replace('<section id="' + pageId + '" class="page" style="display:none">', '<section id="' + pageId + '" class="page">')
    .replace(' id="' + containerId + '"></div>', ' id="' + containerId + '">' + innerHTML + '</div>');
  out = keepOnlySection(out, pageId);
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  console.log(route + '/');
}

const { projects, skills, work } = loadData();

emitPage('blog', 'page-blog', 'blog-list', posts.map(blogItemHTML).join(''));
emitPage('projects', 'page-projects', 'projects-list', projects.map(itemHTML).join(''));
emitPage('skills', 'page-skills', 'skills-list', buildSkillsHTML(skills));
emitPage('work', 'page-work', 'work-list', work.map(itemHTML).join(''));
