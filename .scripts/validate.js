// validate.js — pre-deploy data integrity gate.
// Every failure mode from notes.md becomes a build error at your desk.
// Usage: node validate.js   (exit 1 on any error)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');
const blogsDir = path.join(root, 'files', 'blogs');

// ── pull the real parsers out of the shipped frontend code ──
const iniSrc = fs.readFileSync(path.join(main, 'assets/js/ini.js'), 'utf8');
const mod = {};
new Function('module', 'exports', 'window', iniSrc + '\nmodule.exports = { parseSlug, parseSlugsMin };')(mod, mod.exports, {});
const { parseSlug, parseSlugsMin } = mod.exports;

const SLUG_FILES = [
  ['meta/posts', 'slugs/meta/posts.ini'],
  ['meta/projects', 'slugs/meta/projects.ini'],
  ['profile/skills', 'slugs/profile/skills.ini'],
  ['meta/work', 'slugs/meta/work.ini'],
  ['profile/about', 'slugs/profile/about.ini'],
  ['profile/socials', 'slugs/profile/socials.ini'],
  ['meta/pages', 'slugs/meta/pages.ini'],
];

let errors = 0;
function fail(msg) { console.log('✗ ' + msg); errors++; }
function note(msg) { console.log('✗ ' + msg); }
function ok(msg) { console.log('✓ ' + msg); }

console.log('> Validating...');

function hasBadValue(v) { return /\t|\n/.test(v); }

// same merging logic as build.js minifySlugs
function buildMerged() {
  const out = [];
  for (const [gpath, rel] of SLUG_FILES) {
    const text = fs.readFileSync(path.join(main, rel), 'utf8').replace(/^\uFEFF/, '');
    const d = parseSlug(text);

    // group-level kv tab/newline check (build gap #8)
    for (const k of Object.keys(d.kv)) {
      if (hasBadValue(d.kv[k])) fail(rel + ': group-level kv "' + k + '" contains tab/newline');
      if (k.includes(']') || d.kv[k].includes('\t')) {}
    }

    out.push('[m:' + gpath + ']');
    for (const k of Object.keys(d.kv)) {
      if (hasBadValue(d.kv[k])) fail(rel + ': kv "' + k + '" contains tab/newline');
      out.push(k + '=' + d.kv[k]);
    }
    for (const s of d.sections) {
      if (s.section.indexOf(']') !== -1) fail(rel + ': section name contains "]": ' + s.section);
      const parts = [];
      for (const k of Object.keys(s.kv)) {
        if (hasBadValue(s.kv[k])) fail(rel + ' [' + s.section + '] ' + k + ' contains tab/newline');
        parts.push(k + '=' + s.kv[k]);
      }
      out.push('[' + s.section + ']' + parts.concat(s.items).join('\t'));
    }
  }
  return out.join('\n');
}

const postsText = fs.readFileSync(path.join(main, 'slugs/meta/posts.ini'), 'utf8').replace(/^\uFEFF/, '');
const posts = parseSlug(postsText);

// 1. slug uniqueness across posts.ini (#10)
const seen = new Set();
for (const s of posts.sections) {
  if (seen.has(s.section)) fail('duplicate slug in posts.ini: ' + s.section);
  seen.add(s.section);
}
ok(posts.sections.length + ' post slugs, all unique');

// 2. slug ↔ md sync, both directions (kills bug #2)
const mdSlugs = new Set(
  fs.existsSync(blogsDir)
    ? fs.readdirSync(blogsDir).filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'))
    : []
);
const missingIniEntry = [];
const missingMd = [];
for (const slug of seen) {
  if (!mdSlugs.has(slug)) missingMd.push(slug + '.md');
}
for (const slug of mdSlugs) {
  if (!seen.has(slug)) missingIniEntry.push(slug + '.md');
}
if (missingIniEntry.length) {
  note(missingIniEntry.length + ' md file(s) have no posts.ini entry: ' + missingIniEntry.join(', '));
}
if (missingMd.length) {
  note(missingMd.length + ' posts.ini entr(y/ies) have no md file: ' + missingMd.join(', '));
}
if (missingIniEntry.length || missingMd.length) {
  fail(mdSlugs.size + ' md files, ' + (missingIniEntry.length + missingMd.length) + ' file(s) not synced with posts.ini');
} else {
  ok(mdSlugs.size + ' md files, synced with posts.ini');
}

// 3. merged-merge dry run: prove parseSlugsMin reads back what we built
const merged = buildMerged();
const groups = parseSlugsMin(merged);
const builtPosts = (groups['meta/posts'] || {}).sections || [];
if (builtPosts.length !== posts.sections.length) {
  fail('parseSlugsMin round-trip: expected ' + posts.sections.length + ' post sections, got ' + builtPosts.length);
} else {
  ok('parseSlugsMin round-trip OK');
}

if (errors) {
  console.error('\n> Validation failed with ' + errors + ' error(s)');
  process.exit(1);
}
console.log('> Validation passed!');
