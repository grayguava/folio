// validate.js — pre-deploy data integrity gate.
// Every failure mode from notes.md becomes a build error at your desk.
// Usage: node validate.js   (exit 1 on any error)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');

// ── pull the real parsers out of the shipped frontend code ──
const iniSrc = fs.readFileSync(path.join(main, 'assets/js/ini.js'), 'utf8');
const mod = {};
new Function('module', 'exports', 'window', iniSrc + '\nmodule.exports = { parseSlug, parseSlugsMin };')(mod, mod.exports, {});
const { parseSlug, parseSlugsMin } = mod.exports;

const SLUG_FILES = [
  ['meta/posts', null], // generated from md frontmatter — no posts.ini
  ['meta/projects', 'slugs/meta/projects.ini'],
  ['profile/skills', 'slugs/profile/skills.ini'],
  ['meta/work', 'slugs/meta/work.ini'],
  ['profile/about', 'slugs/profile/about.ini'],
  ['profile/socials', 'slugs/profile/socials.ini'],
];

let errors = 0;
function fail(msg) { console.log('✗ ' + msg); errors++; }
function ok(msg) { console.log('✓ ' + msg); }

console.log('> Validating...');

function hasBadValue(v) { return /\t|\n/.test(v); }

// same merging logic as build.js minifySlugs
const { discoverPosts, postsIniText, parseIso } = require('./frontmatter.js');
const posts = discoverPosts();

// meta/posts is generated from md frontmatter — there is no posts.ini anymore
const generated = { 'meta/posts': postsIniText(posts) };
function groupText(rel) {
  return rel === null ? generated['meta/posts'] : fs.readFileSync(path.join(main, rel), 'utf8').replace(/^\uFEFF/, '');
}

function buildMerged() {
  const out = [];
  for (const [gpath, rel] of SLUG_FILES) {
    const text = groupText(rel);
    const d = parseSlug(text);

    // group-level kv tab/newline check (build gap #8)
    for (const k of Object.keys(d.kv)) {
      if (hasBadValue(d.kv[k])) fail((rel || gpath) + ': group-level kv "' + k + '" contains tab/newline');
      if (k.includes(']') || d.kv[k].includes('\t')) {}
    }

    out.push('[m:' + gpath + ']');
    for (const k of Object.keys(d.kv)) {
      if (hasBadValue(d.kv[k])) fail((rel || gpath) + ': kv "' + k + '" contains tab/newline');
      out.push(k + '=' + d.kv[k]);
    }
    for (const s of d.sections) {
      if (s.section.indexOf(']') !== -1) fail((rel || gpath) + ': section name contains "]": ' + s.section);
      const parts = [];
      for (const k of Object.keys(s.kv)) {
        if (hasBadValue(s.kv[k])) fail((rel || gpath) + ' [' + s.section + '] ' + k + ' contains tab/newline');
        parts.push(k + '=' + s.kv[k]);
      }
      out.push('[' + s.section + ']' + parts.concat(s.items).join('\t'));
    }
  }
  return out.join('\n');
}

// 1. every md file is auto-discovered with valid frontmatter — there is
//    no posts.ini left to keep in sync, the filename IS the slug
if (!posts.length) fail('no .md files found in posts/');
for (const p of posts) {
  const where = p.slug + '.md';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) {
    fail(where + ': filename must be a URL-safe slug (lowercase letters, digits, hyphens)');
  }
  if (!p.hasFrontmatter) { fail(where + ': missing frontmatter block (--- / title / date / ---)'); continue; }
  if (!p.title) fail(where + ': frontmatter title missing/empty');
  if (!p.date) fail(where + ': frontmatter date missing/empty');
  if (p.title && hasBadValue(p.title)) fail(where + ': title contains tab/newline');
  if (p.date && hasBadValue(p.date)) fail(where + ': date contains tab/newline');
  if (p.date && !parseIso(p.date)) fail(where + ': date "' + p.date + '" is not a real ISO date (yyyy-mm-dd)');
}
if (posts.length) ok(posts.length + ' md files auto-discovered, frontmatter valid');

// 2. merged-merge dry run: prove parseSlugsMin reads back what we built
const merged = buildMerged();
const groups = parseSlugsMin(merged);
const builtPosts = (groups['meta/posts'] || {}).sections || [];
if (builtPosts.length !== posts.length) {
  fail('parseSlugsMin round-trip: expected ' + posts.length + ' post sections, got ' + builtPosts.length);
} else {
  ok('parseSlugsMin round-trip OK');
}

if (errors) {
  console.error('\n> Validation failed with ' + errors + ' error(s)');
  process.exit(1);
}
console.log('> Validation passed!');
