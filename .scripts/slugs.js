// slugs.js — load the site's index data from main/slugs/**/*.json and
// serialize it for the browser as typed JSON Lines.
//
// Source files:
//   slugs/profile/about.json    { name, sub, bio }
//   slugs/profile/socials.json  [{ name, href, svg }]
//   slugs/profile/skills.json   [{ category, items: [{ name, href? }] }]
//   slugs/meta/projects.json    [{ title, role, description, href, tags }]
//   slugs/meta/work.json        [{ title, role, description }]
//
// meta/posts is generated from post frontmatter (frontmatter.js).
//
// Consumed by build.js, validate.js and prerender.js.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');

function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(main, rel), 'utf8').replace(/^\uFEFF/, ''));
}

function loadData() {
  const { discoverPosts } = require('./frontmatter.js');

  const posts = discoverPosts().map((p) => ({ slug: p.slug, title: p.title, date: p.dateDisplay }));

  const projects = readJSON('slugs/meta/projects.json').map((p) => ({
    title: p.title,
    role: p.role || '',
    description: p.description || '',
    href: p.href || '',
    tags: p.tags || [],
  }));

  const skills = [];
  for (const cat of readJSON('slugs/profile/skills.json')) {
    for (const item of cat.items) {
      const s = { name: item.name, category: cat.category };
      if (item.href) s.href = item.href;
      skills.push(s);
    }
  }

  const work = readJSON('slugs/meta/work.json').map((w) => ({
    title: w.title,
    role: w.role || '',
    description: w.description || '',
  }));

  const about = readJSON('slugs/profile/about.json');
  const socials = readJSON('slugs/profile/socials.json').map((s) => ({
    name: s.name,
    href: s.href || '',
    svg: s.svg || '',
  }));

  return {
    posts,
    projects,
    skills,
    work,
    profile: { name: about.name || 'grayguava', sub: about.sub || '', bio: about.bio || '' },
    socials,
  };
}

// typed JSON Lines — one record per line, streamed straight to JSON.parse
function toJSONL(d) {
  const lines = [];
  for (const p of d.posts) lines.push(JSON.stringify({ t: 'post', slug: p.slug, title: p.title, date: p.date }));
  for (const p of d.projects) lines.push(JSON.stringify({ t: 'project', title: p.title, role: p.role, description: p.description, href: p.href, tags: p.tags }));
  for (const s of d.skills) lines.push(JSON.stringify(s.href ? { t: 'skill', name: s.name, category: s.category, href: s.href } : { t: 'skill', name: s.name, category: s.category }));
  for (const w of d.work) lines.push(JSON.stringify({ t: 'work', title: w.title, role: w.role, description: w.description }));
  lines.push(JSON.stringify({ t: 'profile', name: d.profile.name, sub: d.profile.sub, bio: d.profile.bio }));
  for (const s of d.socials) lines.push(JSON.stringify({ t: 'social', name: s.name, href: s.href, svg: s.svg }));
  return lines.join('\n') + '\n';
}

module.exports = { root, main, readJSON, loadData, toJSONL };