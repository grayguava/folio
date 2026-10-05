A zero-framework personal site: static HTML/CSS/JS in `main/`, one
bundling script, and no runtime dependencies on any host. Post markdown,
images, and other files are fetched over plain HTTP from whatever backend
you like — Dropbox, your own server, object storage, anything. Point the
`/api/...` fetches in `main/assets/js/posts.js` at it and go.

No React, no npm build deps beyond esbuild, no lockfile voodoo. For the
extra markdown features the renderer supports (callouts, image sizing
flags, ASCII-table handling, copy buttons, etc.) see [features.md](features.md).

## Layout

```
site/
├── main/               # the site source, edited and linted by hand
│   ├── index.html      # 5 pages, one hash router
│   ├── 404.html
│   ├── assets/
│   │   ├── css/        # theme, base, markdown, skills, hljs
│   │   ├── js/         # ini parser, loader, posts, pages, app
│   │   ├── vendor/     # marked + highlight.js, vendored
│   │   └── fonts/      # JetBrains Mono woff2
│   └── slugs/          # all content data (INI-like files)
│       ├── meta/       # posts.ini, projects.ini, work.ini, pages.ini
│       └── profile/    # about.ini, skills.ini, socials.ini
├── .scripts/           # validate.js + build.js + esbuild (npm)
├── files/blogs/        # post markdown, one file per slug
├── dist/               # build output — deploy this directory
├── .gitignore
├── build.bat           # Windows entry point
├── build.sh            # macOS / Linux entry point
└── README.md
```

## Quick start

```bat
git clone <repo> site
cd site
cd .scripts && npm install && cd ..
:: add your content:
::   files/blogs/<slug>.md   one markdown file per post
::   main/slugs/**/*.ini     metadata for posts, projects, skills, work, about, socials
build.bat      :: Windows
./build.sh     :: macOS / Linux
:: deploy dist/ to any static host
```

## What the build does, in order

1. **validate.js** — fails the build on any data problem:
   - duplicate slug in `posts.ini`
   - a `[slug]` with no `files/blogs/<slug>.md` (or vice versa)
   - tab/newline inside any INI value, including group-level pairs
   - `]` inside a section name
   - a `parseSlugsMin` dry-run that doesn't round-trip identically
2. esbuild bundles `assets/css/*.css` → `dist/assets/guava.min.css` and
   `assets/js/*.js` → `dist/assets/guava.min.js`, both minified.
3. All `main/slugs/**/*.ini` merge into one minified
   `dist/assets/slugs.min.ini`; the raw `slugs/` tree never ships.
4. `index.html` / `404.html` are rewritten so every `assets/{css,js}/...`
   reference collapses to the two bundled files. The rewrite hard-fails
   if any old asset reference would have survived.

## Content format

`main/slugs/meta/posts.ini` — one section per post, slug = filename:

```ini
[20260901001]
title=Hello from the demo site
date=Sep 01, 2026
```

Post body lives in `files/blogs/20260901001.md`.

`main/slugs/meta/projects.ini` sections become cards, with `role`,
`description`, `href`, and a `|`-separated `tags` field:

```ini
[demo-cli]
role=creator
description=A fictional command-line helper used purely as sample data.
href=https://example.com/demo-cli
tags=python|cli
```

`main/slugs/profile/about.ini` holds group-level `key=value` pairs
(`name`, `sub`, `bio`). `profile/socials.ini` holds one section per
social with an `href` and an inline `svg`. `meta/pages.ini` supplies the
blurb under each page heading. `meta/work.ini` mirrors `projects.ini`
minus the link. `profile/skills.ini` groups `[category]` sections; each
line is either `Name` or `Name=https://link`.

The safest way to edit any of these is to copy an existing section and
change it — `validate.js` will refuse to build if anything fails to
parse, so a typo costs you one command, not a live bug.

## Assets

Post bodies, diagrams, archives, and screenshots are plain files served
from anywhere. The stock code fetches them at `/api/markdown/<slug>.md`,
`/api/diagrams/*`, etc. — if you have a different backend, change those
URL prefixes in `main/assets/js/posts.js`. Nothing else in the site
cares where they come from.

## Requirements

- **Node.js** on your PATH.
- **esbuild**, installed locally in `.scripts/`:

  ```bash
  cd .scripts
  npm install
  ```

  `node_modules/` is gitignored, so this is the one post-clone step.
  Without it, `build.bat`/`build.sh` fails with
  `Cannot find module 'esbuild'`.

## Deploying

1. `build.bat` (or `./build.sh`)
2. Upload `dist/` to any static host — Netlify, GitHub Pages, S3, nginx,
   a plain USB stick. The output is fully self-contained: no runtime,
   no functions, no platform config.

## Keep the build green

- A `[slug]` in `posts.ini` ⇔ a `files/blogs/<slug>.md` must exist.
  Build fails otherwise.
- No tabs/newlines inside INI values; no `]` in section names.
- Never hand-edit `dist/` — it is regenerated on every build.
