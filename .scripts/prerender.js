/* prerender.js
   SPDX-License-Identifier: GPL-3.0-only
   Copyright (C) 2026 grayguava */

// prerender.js — emit clean-URL HTML for every post + page shells for the
// SPA routes. Runs after build.js; reads dist/ and adds dist/blog/<slug>/.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');
const dist = path.join(root, 'dist');

const marked = require(path.join(main, 'assets/vendor/marked.min.js'));
const hljs = require(path.join(main, 'assets/vendor/highlight.min.js'));
const { buildData, escHtml, sectionEnd } = require('./slugs.js');
const { loadConfig, loadSeo } = require('./config.js');
const site = loadConfig();
const seo = loadSeo();

const { discoverPosts } = require('./frontmatter.js');
const posts = discoverPosts();

// first readable paragraph, markdown stripped, clipped for meta tags
function excerpt(md) {
  const text = md.replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>\[\]()]/g, '')
    .replace(/\s+/g, ' ').trim();
  return clip(text, 160);
}

function clip(s, n) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n).lastIndexOf(' ');
  return (cut > 0 ? t.slice(0, cut) : t.slice(0, n)) + '…';
}

// one meta/OG/Twitter/canonical block per file — skipped entirely when
// no seo.url is set (SEO off). each file is tagged exactly once.
function applySeo(file, meta) {
  if (!seo.url) return;
  const base = seo.url;
  const tags = [
    '<meta name="description" content="' + escHtml(meta.description) + '">',
    '<link rel="canonical" href="' + base + meta.path + '">',
    '<meta property="og:title" content="' + escHtml(meta.title) + '">',
    '<meta property="og:description" content="' + escHtml(meta.description) + '">',
    '<meta property="og:type" content="' + meta.type + '">',
    '<meta property="og:url" content="' + base + meta.path + '">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="' + escHtml(meta.title) + '">',
    '<meta name="twitter:description" content="' + escHtml(meta.description) + '">',
  ];
  if (meta.published) tags.push('<meta property="article:published_time" content="' + meta.published + '">');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('</head>', tags.join('\n') + '\n</head>');
  fs.writeFileSync(file, html);
}

function emitSitemap() {
  if (!seo.url) return;
  const base = seo.url;
  const urls = ['<url><loc>' + base + '/</loc></url>'];
  for (const p of site.enabled) urls.push('<url><loc>' + base + '/' + p + '/</loc></url>');
  if (site.pages.blog) {
    for (const p of posts) {
      if (!p.hasFrontmatter) continue;
      const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? '<lastmod>' + p.date + '</lastmod>' : '';
      urls.push('<url><loc>' + base + '/blog/' + p.slug + '/</loc>' + lastmod + '</url>');
    }
  }
  fs.writeFileSync(path.join(dist, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n');
  fs.writeFileSync(path.join(dist, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: ' + base + '/sitemap.xml\n');
}

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

// post-process anchors: open external links in a new tab, wrap text
// links in .link-text so the hover underline works (image links
// stay unwrapped, no underline)
function fixupLinks(html) {
  return html.replace(/<a\s([^>]*)>([\s\S]*?)<\/a>/g, (m, attrs, inner) => {
    const hm = attrs.match(/\bhref="([^"]*)"/);
    if (!hm) return m;
    let href = hm[1];

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
    '<h1>' + escHtml(post.title) + '</h1>' +
    '<p class="post-meta">' +
      '<time>' + escHtml(post.dateDisplay) + '</time>' +
      '<span class="reading-time">· ' + readTime + ' min read</span>' +
    '</p>' +
    html;

  let out = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  out = out
    .replace(/<title>([^<]*)<\/title>/, (m, t) => '<title>' + escHtml(post.title) + ' · ' + t + '</title>')
    .replace('<body>', '<body>\n<script>window.__prerenderedPost = true;</script>')
    .replace('<section id="page-home" class="page">', '<section id="page-home" class="page" style="display:none">')
    .replace('<section id="page-post" class="page" style="display:none">', '<section id="page-post" class="page">')
    .replace('<article id="post-content"></article>', '<article id="post-content" data-prerendered="1">' + article + '</article>');

  out = keepOnlySection(out, 'page-post');

  const dir = path.join(dist, 'blog', post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  applySeo(path.join(dir, 'index.html'), {
    title: post.title + ' · ' + site.site.name,
    description: excerpt(post.body),
    path: '/blog/' + post.slug + '/',
    type: 'article',
    published: post.date,
  });
}

if (site.pages.blog) {
  for (const p of posts) prerenderPost(p);
}

// twin renderers — pages.js builds the same markup in the browser, the
// shells above carry it as static HTML
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

function logRowHTML(p) {
  var iso = p.date || '';
  return '<li><a class="log-row" href="/blog/' + escHtml(p.slug) + '/">' +
    '<time class="log-date" datetime="' + escHtml(iso) + '">' + escHtml(iso) + '</time>' +
    '<span class="log-title">' + escHtml(p.title) + '</span>' +
  '</a></li>';
}

var LOG_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

function logHTML(list) {
  var html = '<ul class="log">';
  var group = '';
  list.forEach(function(p) {
    var iso = p.date || '';
    var g = iso.slice(0, 7);
    var label = LOG_MONTHS[+iso.slice(5, 7) - 1];
    if (label && g !== group) {
      group = g;
      html += '<li class="log-group">' + label + '</li>';
    }
    html += logRowHTML(p);
  });
  return html + '</ul>';
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

function emitPage(route, pageId, containerId, innerHTML, seo) {
  let out = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  out = out
    .replace('<section id="page-home" class="page">', '<section id="page-home" class="page" style="display:none">')
    .replace('<section id="' + pageId + '" class="page" style="display:none">', '<section id="' + pageId + '" class="page">')
    .replace(' id="' + containerId + '"></div>', ' id="' + containerId + '">' + innerHTML + '</div>');
  out = keepOnlySection(out, pageId);
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  applySeo(path.join(dir, 'index.html'), seo);
}

// same object build.js inlines into index.html — the shells carry live lists
const { projects, skills, work, profile } = buildData();

if (site.pages.blog) emitPage('blog', 'page-blog', 'blog-list', logHTML(posts), { title: site.site.name, description: site.subtitles.blog, path: '/blog/', type: 'website' });
if (site.pages.projects) emitPage('projects', 'page-projects', 'projects-list', rowsHTML(projects, false), { title: site.site.name, description: site.subtitles.projects, path: '/projects/', type: 'website' });
if (site.pages.skills) emitPage('skills', 'page-skills', 'skills-list', skillsHTML(skills), { title: site.site.name, description: site.subtitles.skills, path: '/skills/', type: 'website' });
if (site.pages.work) emitPage('work', 'page-work', 'work-list', rowsHTML(work, true), { title: site.site.name, description: site.subtitles.work, path: '/work/', type: 'website' });

applySeo(path.join(dist, 'index.html'), {
  title: site.site.name,
  description: clip(profile.bio, 160),
  path: '/',
  type: 'website',
});
emitSitemap();
