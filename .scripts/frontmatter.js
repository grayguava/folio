// frontmatter.js — auto-discover blog posts from posts/*.md.
//
// The filename is the slug — any URL-safe name works:
//   20260708001.md  -> /blog/20260708001/
//   how-i-met-your-mother.md -> /blog/how-i-met-your-mother/
//
// Metadata lives in a leading frontmatter block:
//
//   ---
//   title: How this site works
//   date: 2026-07-08        <- raw ISO (yyyy-mm-dd), sorts as text
//   ---
//   <body only>
//
// This module owns date conversion: raw ISO in, "Jul 08, 2026" display
// string out (what lists and post pages render), and newest-first sorting.
//
// Consumed by validate.js, build.js and prerender.js.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const postsDir = path.join(root, 'posts');

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-07-08" -> "20260708" (sortable key), null if not a real ISO date
function parseIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  return m[1] + m[2] + m[3];
}

// "2026-07-08" -> "Jul 08, 2026", '' if invalid
function formatDate(raw) {
  const key = parseIso(raw);
  if (!key) return '';
  return MONTHS[+key.slice(4, 6) - 1] + ' ' + key.slice(6, 8) + ', ' + key.slice(0, 4);
}

// returns { fm, body } or null when no/invalid frontmatter block
function parseFrontmatter(src) {
  const text = src.replace(/^\uFEFF/, '');
  const m = text.match(FM_RE);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const i = line.indexOf(':');
    if (i === -1) return null; // malformed line — treat as no frontmatter
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: text.slice(m[0].length).replace(/^\r?\n/, '') };
}

// newest first — date decides, not the filename
function discoverPosts() {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = path.basename(f, '.md');
      const raw = fs.readFileSync(path.join(postsDir, f), 'utf8');
      const parsed = parseFrontmatter(raw);
      return {
        slug,
        title: (parsed && parsed.fm.title) || '',
        date: (parsed && parsed.fm.date) || '', // raw ISO as written
        dateDisplay: formatDate(parsed && parsed.fm.date), // what the site renders
        dateKey: parseIso(parsed && parsed.fm.date) || '', // sortable
        body: parsed ? parsed.body : '',
        hasFrontmatter: !!parsed,
        raw,
      };
    })
    .sort((a, b) =>
      (b.dateKey.localeCompare(a.dateKey)) || b.slug.localeCompare(a.slug));
}

// posts.ini-shaped text so the merged slugs.min.ini keeps the same meta/posts group
function postsIniText(posts) {
  const out = [];
  for (const p of posts) {
    out.push('[' + p.slug + ']', 'title=' + p.title, 'date=' + p.dateDisplay, '');
  }
  return out.join('\n');
}

module.exports = { root, postsDir, parseIso, formatDate, parseFrontmatter, discoverPosts, postsIniText };
