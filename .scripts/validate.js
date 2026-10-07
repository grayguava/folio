// validate.js — pre-deploy data integrity gate.
// Every failure mode from notes.md becomes a build error at your desk.
// Usage: node validate.js   (exit 1 on any error)

const { discoverPosts, parseIso } = require('./frontmatter.js');
const { buildData } = require('./slugs.js');
const { loadConfig } = require('./config.js');

let errors = 0;
function fail(msg) { console.log('✗ ' + msg); errors++; }
function ok(msg) { console.log('✓ ' + msg); }

console.log('> Validating...');

function hasBadValue(v) { return /\t|\n/.test(v); }

// 0. site config gates everything below — a missing file, bad JSON,
//    unknown pages or wrong types fail the build here
let site = null;
try {
  site = loadConfig();
  ok('site config: pages [' + (site.enabled.join(', ') || 'home only') + '], bootloader ' + (site.bootloader.loaderEnable ? 'on (' + site.bootloader.defaultDuration + 'ms)' : 'off') + ', theme ' + site.theme.defaultTheme);
} catch (e) {
  fail(e.message);
}

// 1. every md file is auto-discovered with valid frontmatter — there is
//    no posts.ini left to keep in sync, the filename IS the slug.
//    skipped when the blog page is disabled (no post routes to feed)
const posts = discoverPosts();
if (!site || site.pages.blog) {
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
}

// 2. the slug .ini sources build into the exact object inlined in index.html
let data = null;
try {
  data = buildData();
} catch (e) {
  fail('slugs: failed to build slug data — ' + e.message);
}
if (data) {
  if (data.posts.length !== posts.length) {
    fail('slugs: expected ' + posts.length + ' posts, got ' + data.posts.length);
  }
  if (!data.projects.length && !data.work.length && !data.skills.length) {
    fail('slugs: no projects, work or skills parsed');
  }
  for (const p of data.projects) {
    if (!p.title) fail('slugs/meta/projects.ini: a project is missing its title');
    if (!p.description) fail('slugs/meta/projects.ini: "' + p.title + '" is missing description');
    if (!p.href) fail('slugs/meta/projects.ini: "' + p.title + '" is missing href');
  }
  for (const w of data.work) {
    if (!w.title) fail('slugs/meta/work.ini: a work entry is missing its title');
    if (!w.description) fail('slugs/meta/work.ini: "' + w.title + '" is missing description');
  }
  for (const s of data.skills) {
    if (!s.name || !s.category) fail('slugs/profile/skills.ini: a skill is missing name/category');
  }
  if (!data.profile.name) fail('slugs/profile/about.ini: name missing');
  for (const s of data.profile.socials) {
    if (!s.name || !s.href) fail('slugs/profile/socials.ini: a social is missing name/href');
  }
  ok('Slug data builds (' + data.posts.length + ' posts, ' + data.projects.length + ' projects, ' + data.skills.length + ' skills, ' + data.work.length + ' work)');
}

if (errors) {
  console.error('\n> Validation failed with ' + errors + ' error(s)');
  process.exit(1);
}
console.log('✨ Validation passed!');
