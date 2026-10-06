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

function parseIni(text) {
  const d = { sections: [], kv: {} };
  let current = null;
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (!l || l.charAt(0) === ';') continue;
    if (l.charAt(0) === '[') {
      const close = l.indexOf(']');
      if (close === -1) continue;
      current = { section: l.slice(1, close).trim(), kv: {}, items: [] };
      d.sections.push(current);
    } else if (current) {
      const eq = l.indexOf('=');
      if (eq !== -1) current.kv[l.slice(0, eq).trim()] = l.slice(eq + 1).trim();
      else current.items.push(l);
    } else {
      const eq = l.indexOf('=');
      if (eq !== -1) d.kv[l.slice(0, eq).trim()] = l.slice(eq + 1).trim();
    }
  }
  return d;
}

function minifySlugs() {
  const { discoverPosts, postsIniText } = require('./frontmatter.js');
  // meta/posts is generated from md frontmatter — there is no posts.ini anymore
  const generated = { 'meta/posts': postsIniText(discoverPosts()) };
  const files = [
    ['meta/posts', null],
    ['meta/projects', 'slugs/meta/projects.ini'],
    ['profile/skills', 'slugs/profile/skills.ini'],
    ['meta/work', 'slugs/meta/work.ini'],
    ['profile/about', 'slugs/profile/about.ini'],
    ['profile/socials', 'slugs/profile/socials.ini'],
    ['meta/pages', 'slugs/meta/pages.ini'],
  ];
  const out = [];
  let rawSize = 0;
  for (const [gpath, rel] of files) {
    const text = rel === null
      ? generated[gpath]
      : fs.readFileSync(path.join(main, rel), 'utf8').replace(/^\uFEFF/, '');
    rawSize += Buffer.byteLength(text);
    const d = parseIni(text);
    out.push('[m:' + gpath + ']');
    for (const k of Object.keys(d.kv)) out.push(k + '=' + d.kv[k]);
    for (const s of d.sections) {
      if (s.section.indexOf(']') !== -1) throw new Error('section name contains "]" in ' + gpath + ': ' + s.section);
      const parts = [];
      for (const k of Object.keys(s.kv)) {
        const v = s.kv[k];
        if (v.indexOf('\t') !== -1 || v.indexOf('\n') !== -1) {
          throw new Error('value contains tab/newline in ' + gpath + ' [' + s.section + '] ' + k);
        }
        parts.push(k + '=' + v);
      }
      out.push('[' + s.section + ']' + parts.concat(s.items).join('\t'));
    }
  }
  const dest = path.join(dist, 'assets/slugs.min.ini');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out.join('\n'));
  fs.rmSync(path.join(dist, 'slugs'), { recursive: true, force: true });

  return { dest, rawSize, size: fs.statSync(dest).size };
}

async function build() {
  // data integrity gate first — fail before touching dist/
  require('./validate.js');

  console.log('\n> Minifying assets...');
  cleanDir(dist);
  copyDir(main, dist);

  const cssFiles = ['theme.css', 'skills.css', 'base.css', 'markdown.css', 'hljs.css']
    .map((f) => path.join(main, 'assets/css', f));
  const jsFiles = ['ini.js', 'loader.js', 'posts.js', 'pages.js', 'app.js']
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

  const slugsOut = minifySlugs();
  console.log(`✓ Slugs:  ${(slugsOut.rawSize / 1024).toFixed(1)} kB -> ${(slugsOut.size / 1024).toFixed(1)} kB`);

  console.log('\n> Prerendering clean URLs...');
  require('./prerender.js');

  // remove only the bundled source files — leave any non-bundled asset
  // (future fonts, extra css, etc.) intact in dist/
  // remove the source bundles; future non-bundled files in these dirs stay
  for (const f of ['theme.css', 'skills.css', 'base.css', 'markdown.css', 'hljs.css']) {
    fs.rmSync(path.join(dist, 'assets/css', f), { force: true });
  }
  for (const f of ['ini.js', 'loader.js', 'posts.js', 'pages.js', 'app.js']) {
    fs.rmSync(path.join(dist, 'assets/js', f), { force: true });
  }
  // rmdir fails when a future file was dropped in — that file staying is the point
  try { fs.rmdirSync(path.join(dist, 'assets/css')); } catch (_) {}
  try { fs.rmdirSync(path.join(dist, 'assets/js')); } catch (_) {}

  const cssOld = cssFiles.reduce((n, f) => n + fs.statSync(f).size, 0);
  const jsOld = jsFiles.reduce((n, f) => n + fs.statSync(f).size, 0);
  console.log(`✓ CSS:    ${(cssOld / 1024).toFixed(1)} kB -> ${(fs.statSync(cssOut).size / 1024).toFixed(1)} kB`);
  console.log(`✓ JS:     ${(jsOld / 1024).toFixed(1)} kB -> ${(fs.statSync(jsOut).size / 1024).toFixed(1)} kB`);
  console.log('> Minify and build done!');
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