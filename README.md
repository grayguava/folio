A zero-framework static personal site. no router lib, no runtime deps.
posts are markdown in `posts/`, prerendered to clean urls at build time.

a post is a file: `posts/<slug>.md` -> `/blog/<slug>/`.
the filename is the slug. metadata lives in frontmatter, not in an ini.

```
---
title: Hello from the demo site
date: 2026-09-01
---

body goes here...
```

- `title:` rendered as the post `<h1>` and `<title>`.
- `date:` raw ISO `yyyy-mm-dd`. the build renders it as `Jul 08, 2026`.
- slug filenames must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- newest first by date, ties broken by slug.

## v1 vs v2

the old architecture is preserved on the [`v1` branch](https://github.com/grayguava/folio/tree/v1)
— browse it there if you want the fast-and-minimal variant.

| | [v1](https://github.com/grayguava/folio/tree/v1) | v2 (this branch) |
| --- | --- | --- |
| urls | `/#blog?p=slug` hash routing | clean `/blog/<slug>/` paths |
| rendering | client-side, markdown fetched at runtime | prerendered at build time |
| speed | faster to build, instant first paint | slightly slower build/first load |
| seo | crawlers see an empty shell | full content in the html |
| post metadata | `posts.ini` by hand | frontmatter, filename is the slug |
| runtime deps | marked + highlight.js loaded in browser | none — bundled html/css/js |

the data in this repo is placeholder (john doe, demo posts) so the
build stays green with no personal content in it. see `markdown.md`
for what markdown the post bodies support, and `features.md` for
the sitewide features (router, keyboard nav, theme, slugs).

## layout

```
build.bat / build.sh   entry points, run from repo root
.scripts/              build tooling (node, dev-only)
  build.js             pipeline: validate -> bundle -> slugs -> prerender
  validate.js          data gate, fails the build on bad data
  frontmatter.js       discovers posts/*.md, parses frontmatter
  prerender.js         renders markdown to dist/blog/<slug>/
  package.json         devDeps only: esbuild
main/                  source of the site
  index.html           shell with all page sections
  404.html             plain 404, also bundled
  _headers             cache headers, copied to dist/
  favicon.ico
  assets/css/          theme, skills, base, markdown, hljs
  assets/js/           ini, loader, posts, pages, app
  assets/fonts/
  assets/vendor/       marked + highlight.js, build-time only
  slugs/               5 ini files (no posts.ini, see below)
    meta/projects
    meta/work
    profile/about
    profile/skills
    profile/socials
posts/                 *.md, filename is the slug
dist/                  generated output, deploy this
vendor.md              vendored lib versions + hashes
README.md              this file — layout + build
features.md            sitewide features (router, nav, theme)
markdown.md            post markdown reference
```

`meta/posts` is generated at build time from frontmatter by
`.scripts/frontmatter.js` — there is no `posts.ini` to edit.
`files/` is gitignored personal data, not part of the layout.

## quick start

```
cd .scripts && npm install
```

then from the repo root:

```
build.bat        :: windows
./build.sh       :: macos / linux
```

open `dist/index.html`, or serve `dist/` statically.

## what the build does, in order

1. `validate.js` — data gate. checks every `posts/*.md` has
   frontmatter with a non-empty title and a real ISO date, slug
   filenames are url-safe, no tabs/newlines in values, no `]` in
   section names, and the merged slugs round-trip through
   `parseSlugsMin`. fails before touching `dist/`.
2. copy `main/` -> `dist/`, then esbuild bundles css/js to
   `assets/guava.min.css` / `assets/guava.min.js` and rewrites
   `index.html` + `404.html` to reference only the bundles.
3. minify slugs to `assets/slugs.min.ini`. `meta/posts` comes from
   frontmatter, the other 6 groups from `main/slugs/`. the raw
   `slugs/` dir is removed from `dist/`.
4. `prerender.js` — marked + highlight.js run at build time.
   emits `dist/blog/<slug>/index.html` per post (highlighted code,
   `.link-text` wrapping, external links get `target="_blank"`,
   legacy `/#blog?p=slug` links rewritten to `/blog/slug/`) plus
   static shells for `/blog/`, `/projects/`, `/skills/`, `/work/`.
5. strip the unbundled sources from `dist/` (the 5 css + 5 js
   files). anything else dropped in those dirs stays.

runtime deps: none. `marked` + `highlight.js` are vendored under
`main/assets/vendor/` for the build only — never shipped in `dist/`
(`dist/assets/` holds just the two bundles, `slugs.min.ini`, fonts).

## keep the build green

- one post = one `posts/*.md`. lowercase letters, digits, hyphens.
- every post needs the `---` block with `title:` and `date:`.
  `date:` must be a real `yyyy-mm-dd` (`2026-13-40` fails).
- values can't contain tabs or newlines; section names can't
  contain `]`. the validator tells you the file and the field.
- post lists and the post meta row read title/date from
  frontmatter (via generated `meta/posts`), not from any ini.
- code fences: unknown languages and `plaintext` / `nohighlight`
  stay unhighlighted, that is on purpose, not a bug.

## deploying

`dist/` is the site. serve it as static files with clean urls
(`./build.sh` output works on any static host):

- `/` home, `/blog/`, `/projects/`, `/skills/`, `/work/`
- `/blog/<slug>/` one dir per post, fully prerendered
- `/assets/guava.min.css`, `/assets/guava.min.js`, `/assets/slugs.min.ini`

client js is a pathname router (`app.js`): internal `/...` links
are fetched and swapped in, everything else does a full load.
on a prerendered post page it leaves the inlined html alone and
just runs the runtime chrome (copy buttons, callouts, images).
