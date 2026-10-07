// slugs.js — single source of truth for slug data.
//
// Sources (INI, edited by hand):
//   slugs/meta/projects.ini   [title] role= description= href= tags=a|b
//   slugs/meta/work.ini       [title] role= description=
//   slugs/profile/skills.ini  [category] bare items or name=href
//   slugs/profile/about.ini   group-level kv: name= sub= bio=
//   slugs/profile/socials.ini [name] href= svg=
//
// meta/posts comes from post frontmatter (frontmatter.js), same as before.
//
// build.js inlines buildData() into dist/index.html as a <script> that sets
// window.POSTS / PROJECTS / SKILLS / WORK / PROFILE — no slug file is
// emitted to dist/, nothing is fetched or parsed in the browser.
// validate.js and prerender.js consume buildData() too.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = path.join(root, 'main');

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

function readIni(rel) {
  return parseIni(fs.readFileSync(path.join(main, rel), 'utf8').replace(/^\uFEFF/, ''));
}

// same shapes the runtime always consumed (POSTS/PROJECTS/SKILLS/WORK/PROFILE)
function buildData() {
  const { discoverPosts } = require('./frontmatter.js');

  const posts = discoverPosts().map((p) => ({ slug: p.slug, title: p.title, date: p.dateDisplay }));

  const projects = readIni('slugs/meta/projects.ini').sections.map((s) => ({
    title: s.section,
    role: s.kv.role || '',
    description: s.kv.description || '',
    href: s.kv.href || '',
    tags: s.kv.tags ? s.kv.tags.split('|').map((x) => x.trim()) : [],
  }));

  const skills = [];
  readIni('slugs/profile/skills.ini').sections.forEach((s) => {
    for (const k in s.kv) skills.push({ name: k, category: s.section, href: s.kv[k] });
    s.items.forEach((i) => skills.push({ name: i, category: s.section }));
  });

  const work = readIni('slugs/meta/work.ini').sections.map((s) => ({
    title: s.section,
    role: s.kv.role || '',
    description: s.kv.description || '',
  }));

  const about = readIni('slugs/profile/about.ini').kv;
  const socials = readIni('slugs/profile/socials.ini').sections.map((s) => ({
    name: s.section,
    href: s.kv.href || '',
    svg: s.kv.svg || '',
  }));

  return {
    posts,
    projects,
    skills,
    work,
    profile: {
      name: about.name || 'grayguava',
      sub: about.sub || '',
      bio: about.bio || '',
      socials,
    },
  };
}

// JSON is valid JS, but a literal </script> inside a value would close the
// tag early — escape every </ as <\/ (identical string once parsed)
function js(v) {
  return JSON.stringify(v).replace(/<\//g, '<\\/');
}

function inlineScript() {
  const d = buildData();
  return '<script id="slug-data">' +
    'window.POSTS=' + js(d.posts) + ';' +
    'window.PROJECTS=' + js(d.projects) + ';' +
    'window.SKILLS=' + js(d.skills) + ';' +
    'window.WORK=' + js(d.work) + ';' +
    'window.PROFILE=' + js(d.profile) + ';' +
    '</script>';
}

module.exports = { root, main, parseIni, readIni, buildData, inlineScript };
