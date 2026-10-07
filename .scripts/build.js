const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');
const dist = path.join(root, 'dist');

const EXCLUDE = new Set(['.wrangler', 'node_modules', 'temp', '.gitignore', 'dist', 'wrangler.toml', 'vendor']);

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const keep = new Set(['.wrangler', 'wrangler.toml']);
  for (const e of fs.readdirSync(dir)) {
    if (keep.has(e)) continue;
    fs.rmSync(path.join(dir, e), { recursive: true, force: true });
  }
}

function copyDir(src, dst) {
  fs.cpSync(src, dst, {
    recursive: true,
    filter: (s) => !EXCLUDE.has(path.basename(s)),
  });
}

function concat(files) {
  return files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
}

// drop disabled pages from the shell: nav link, page section, home blocks,
// regenerated hints; bootloader block per config. runs on dist/index.html
// after rewriteHtml, before prerender (shells inherit the result)
function applySiteConfig() {
  const { loadConfig } = require('./config.js');
  const site = loadConfig();
  const file = path.join(dist, 'index.html');
  let html = fs.readFileSync(file, 'utf8');

  const HOME_BLOCKS = { blog: 'home-posts', projects: 'home-projects', work: 'home-work' };
  for (const p of ['blog', 'projects', 'skills', 'work']) {
    if (site.pages[p]) continue;
    html = html.replace(new RegExp('<a\\b[^>]*data-nav="' + p + '"[^>]*>[\\s\\S]*?<\\/a>', 'g'), '');
    html = dropSection(html, 'page-' + p);
    if (HOME_BLOCKS[p]) html = dropHomeBlock(html, HOME_BLOCKS[p]);
  }

  // a zero preview removes the home block but keeps the page itself
  if (site.pages.projects && site.homePreview.projects === 0) html = dropHomeBlock(html, 'home-projects');
  if (site.pages.blog && site.homePreview.posts === 0) html = dropHomeBlock(html, 'home-posts');
  if (site.pages.work && site.homePreview.work === 0) html = dropHomeBlock(html, 'home-work');

  // hints list only the keys that actually work
  const letters = ['h'].concat(site.enabled.map((p) => KEY_LETTERS[p]));
  const hint = '<p class="hint">press ' + letters.map((l) => '<kbd>' + l + '</kbd>').join(' ') + ' to navigate · <kbd>t</kbd> theme</p>';
  html = html.replace(/<p class="hint">[\s\S]*?<\/p>/g, hint);

  // page subtitles come from config, not markup
  for (const p of site.enabled) {
    if (site.subtitles[p] === undefined) continue;
    html = html.replace(
      new RegExp('(<p class="sub" id="' + p + '-sub">)[\\s\\S]*?(</p>)'),
      function (m, open, close) { return open + escHtml(site.subtitles[p]) + close; }
    );
  }

  if (!site.bootloader.loaderEnable) {
    html = html.replace(/<div id="site-loader">[\s\S]*?<\/div>/, '');
    html = html.replace(/<script id="boot-loader">[\s\S]*?<\/script>/, '');
  } else {
    html = html.replace('/*__BOOT_MS__*/1200', String(site.bootloader.defaultDuration));
  }

  html = html.replace("/*__THEME_DEFAULT__*/'dark'", "'" + site.theme.defaultTheme + "'");
  html = html.replace('/*__SITE_NAME__*/grayguava', site.site.name);

  fs.writeFileSync(file, html);

  const notFound = path.join(dist, '404.html');
  if (fs.existsSync(notFound)) {
    let nf = fs.readFileSync(notFound, 'utf8');
    nf = nf.replace("/*__THEME_DEFAULT__*/'dark'", "'" + site.theme.defaultTheme + "'");
    nf = nf.replace('/*__SITE_NAME__*/grayguava', site.site.name);
    fs.writeFileSync(notFound, nf);
  }
}

// runtime page list for app.js — read before the bundle runs
function injectSiteConfig() {
  const { loadConfig } = require('./config.js');
  const site = loadConfig();
  const script = '<script id="site-config">window.SITE=' + JSON.stringify({ pages: site.enabled, theme: site.theme.defaultTheme, name: site.site.name, homePreview: site.homePreview }) + ';</script>';
  const file = path.join(dist, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const bundleTag = '<script src="/assets/guava.min.js"></script>';
  if (!html.includes(bundleTag)) throw new Error('injectSiteConfig: bundle tag not found in dist/index.html');
  fs.writeFileSync(file, html.replace(bundleTag, script + '\n' + bundleTag));
}

// remove one page <section>...</section> by id
function dropSection(html, id) {
  const m = new RegExp('<section id="' + id + '" class="page"[^>]*>').exec(html);
  if (!m) return html;
  return html.slice(0, m.index) + html.slice(sectionEnd(html, m.index + m[0].length));
}

// remove the inner home <section> wrapping a preview block
function dropHomeBlock(html, innerId) {
  const idx = html.indexOf('id="' + innerId + '"');
  if (idx === -1) return html;
  const start = html.lastIndexOf('<section', idx);
  if (start === -1) return html;
  return html.slice(0, start) + html.slice(sectionEnd(html, html.indexOf('>', start) + 1));
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

var KEY_LETTERS = { blog: 'b', projects: 'p', skills: 's', work: 'w' };

// subtitles land in element text — escape markup characters
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inlineSlugData() {
  const { inlineScript, SLUG_FILES } = require('./slugs.js');
  const script = inlineScript();
  const file = path.join(dist, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const bundleTag = '<script src="/assets/guava.min.js"></script>';
  if (!html.includes(bundleTag)) throw new Error('inlineSlugData: bundle tag not found in dist/index.html');
  html = html.replace(bundleTag, script + '\n' + bundleTag);
  fs.writeFileSync(file, html);
  fs.rmSync(path.join(dist, 'slugs'), { recursive: true, force: true });
  return { bytes: Buffer.byteLength(script), files: Object.keys(SLUG_FILES).length };
}

// .wrangler is local deploy state and vendor/ never ships —
// neither is served, so neither counts toward the total
function distSize() {
  let n = 0;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(dist, p);
      if (e.isDirectory()) {
        if (rel === '.wrangler' || rel === path.join('assets', 'vendor')) continue;
        walk(p);
      } else {
        n += fs.statSync(p).size;
      }
    }
  })(dist);
  return n;
}

function fmtSize(n) {
  const kb = n / 1024;
  return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb.toFixed(1) + ' kB';
}

async function build() {
  // data integrity gate first — fail before touching dist/
  require('./validate.js');

  console.log('\n> Minifying assets...');
  cleanDir(dist);
  copyDir(main, dist);

  const cssFiles = ['theme.css', 'skills.css', 'base.css', 'markdown.css', 'hljs.css']
    .map((f) => path.join(main, 'assets/css', f));
  const jsFiles = ['posts.js', 'pages.js', 'app.js']
    .map((f) => path.join(main, 'assets/js', f));

  const cssOut = path.join(dist, 'assets/guava.min.css');
  const jsOut = path.join(dist, 'assets/guava.min.js');

  await esbuild.build({
    stdin: { contents: concat(cssFiles), loader: 'css', resolveDir: path.join(main, 'assets/css') },
    outfile: cssOut,
    minify: true,
    bundle: false,
  });
  await esbuild.build({
    stdin: { contents: concat(jsFiles), loader: 'js', resolveDir: path.join(main, 'assets/js') },
    outfile: jsOut,
    minify: true,
    bundle: false,
  });

  rewriteHtml(path.join(dist, 'index.html'), '/');
  rewriteHtml(path.join(dist, '404.html'), '/');

  applySiteConfig();
  injectSiteConfig();

  const slugOut = inlineSlugData();
  console.log(`✓ Slugs: ${slugOut.files} files inlined into index.html (${(slugOut.bytes / 1024).toFixed(1)} kB)`);

  const cssOld = cssFiles.reduce((n, f) => n + fs.statSync(f).size, 0);
  const jsOld = jsFiles.reduce((n, f) => n + fs.statSync(f).size, 0);
  console.log(`✓ JS:     ${(jsOld / 1024).toFixed(1)} kB -> ${(fs.statSync(jsOut).size / 1024).toFixed(1)} kB`);
  console.log(`✓ CSS:    ${(cssOld / 1024).toFixed(1)} kB -> ${(fs.statSync(cssOut).size / 1024).toFixed(1)} kB`);

  require('./prerender.js');

  // remove only the bundled source files — leave any non-bundled asset
  // (future fonts, extra css, etc.) intact in dist/
  // remove the source bundles; future non-bundled files in these dirs stay
  for (const f of ['theme.css', 'skills.css', 'base.css', 'markdown.css', 'hljs.css']) {
    fs.rmSync(path.join(dist, 'assets/css', f), { force: true });
  }
  for (const f of ['posts.js', 'pages.js', 'app.js']) {
    fs.rmSync(path.join(dist, 'assets/js', f), { force: true });
  }
  // rmdir fails when a future file was dropped in — that file staying is the point
  try { fs.rmdirSync(path.join(dist, 'assets/css')); } catch (_) {}
  try { fs.rmdirSync(path.join(dist, 'assets/js')); } catch (_) {}

  console.log('✨ Minify and build done!');
  console.log(`\n✨ Total site size: ${fmtSize(distSize())}`);
}

function rewriteHtml(file, prefix) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(?:\s*<link rel="stylesheet" href="[^"]+\.css" \/>)+/g,
    `\n  <link rel="stylesheet" href="${prefix}assets/guava.min.css" />`);
  html = html.replace(/(?:\s*<script src="[^"]+\.js"><\/script>)+/g,
    `\n<script src="${prefix}assets/guava.min.js"></script>`);

  // hard assert: no unbundled asset references may survive a rewrite
  if (/<link[^>]+href="\/?assets\/css\//.test(html) || /<script[^>]+src="\/?assets\/js\//.test(html)) {
    console.error(`rewriteHtml: unbundled asset reference survived in ${file}`);
    process.exit(1);
  }

  fs.writeFileSync(file, html);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
