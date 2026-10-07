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

// slug data is baked into dist/index.html — no slug file is emitted, and the
// raw slugs/ sources never reach dist/
function inlineSlugData() {
  const { inlineScript } = require('./slugs.js');
  const script = inlineScript();
  const file = path.join(dist, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const bundleTag = '<script src="/assets/guava.min.js"></script>';
  if (!html.includes(bundleTag)) throw new Error('inlineSlugData: bundle tag not found in dist/index.html');
  html = html.replace(bundleTag, script + '\n' + bundleTag);
  fs.writeFileSync(file, html);
  fs.rmSync(path.join(dist, 'slugs'), { recursive: true, force: true });
  return Buffer.byteLength(script);
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

  const inlineSize = inlineSlugData();
  console.log(`✓ Slugs:  inlined into index.html (${(inlineSize / 1024).toFixed(1)} kB, 0 files)`);

  console.log('\n> Prerendering clean URLs...');
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
