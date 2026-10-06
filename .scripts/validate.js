// validate.js — pre-deploy data integrity gate.
// Every failure mode from notes.md becomes a build error at your desk.
// Usage: node validate.js   (exit 1 on any error)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');

let errors = 0;
function fail(msg) { console.log('✗ ' + msg); errors++; }
function ok(msg) { console.log('✓ ' + msg); }

console.log('> Validating...');

function hasBadValue(v) { return /\t|\n/.test(v); }

// 1. every md file is auto-discovered with valid frontmatter — the filename
//    IS the slug, there is no posts.json to keep in sync
const { discoverPosts, parseIso } = require('./frontmatter.js');
const posts = discoverPosts();
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

// 2. the JSON slug sources parse and carry the fields every renderer reads
const { readJSON, loadData, toJSONL } = require('./slugs.js');
const REQUIRED = {
  'slugs/meta/projects.json': { array: true, fields: ['title', 'role', 'description', 'href', 'tags'] },
  'slugs/meta/work.json': { array: true, fields: ['title', 'role', 'description'] },
  'slugs/profile/skills.json': { array: true, fields: ['category', 'items'] },
  'slugs/profile/about.json': { array: false, fields: ['name', 'sub', 'bio'] },
  'slugs/profile/socials.json': { array: true, fields: ['name', 'href', 'svg'] },
};
for (const [rel, spec] of Object.entries(REQUIRED)) {
  let data;
  try { data = readJSON(rel); } catch (e) { fail(rel + ': ' + e.message); continue; }
  if (spec.array && !Array.isArray(data)) { fail(rel + ': expected a JSON array'); continue; }
  const rows = spec.array ? data : [data];
  if (spec.array && !data.length) fail(rel + ': empty');
  for (const row of rows) {
    for (const field of spec.fields) {
      if (row[field] === undefined || row[field] === '') fail(rel + ': an entry is missing "' + field + '"');
    }
  }
  if (rel === 'slugs/profile/skills.json') {
    for (const s of data) {
      if (!Array.isArray(s.items) || !s.items.length) fail(rel + ' [' + s.category + ']: items missing/empty');
      else for (const it of s.items) if (!it || !it.name) fail(rel + ' [' + s.category + ']: an item is missing "name"');
    }
  }
}
ok('slug JSON sources valid');

// 3. merged-merge dry run: prove JSON.parse reads back every record we emit
const data = loadData();
const merged = toJSONL(data);
let lineNo = 0;
let builtPosts = 0;
for (const line of merged.split('\n')) {
  lineNo++;
  if (!line.trim()) continue;
  let rec;
  try { rec = JSON.parse(line); } catch (e) { fail('slugs.jsonl line ' + lineNo + ': ' + e.message); continue; }
  if (rec.t === 'post') builtPosts++;
}
if (builtPosts !== posts.length) {
  fail('slugs.jsonl round-trip: expected ' + posts.length + ' post records, got ' + builtPosts);
} else {
  ok('slugs.jsonl round-trip OK');
}

if (errors) {
  console.error('\n> Validation failed with ' + errors + ' error(s)');
  process.exit(1);
}
console.log('> Validation passed!');