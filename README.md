A zero-framework static personal site. No router lib, no runtime deps.
Posts are markdown in `posts/`, prerendered to clean URLs at build time.

A post is a file: `posts/<slug>.md` -> `/blog/<slug>/`.
The filename is the slug. Metadata lives in frontmatter, not in an INI.

```
---
title: Hello from the demo site
date: 2026-09-01
---

body goes here...
```

- `title:` rendered as the post `<h1>` and `<title>`.
- `date:` raw ISO `yyyy-mm-dd`. The build renders it as `Jul 08, 2026`.
- Slug filenames must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- Newest first by date, ties broken by slug.

The data in this repo is placeholder (John Doe, demo posts) so the
build stays green with no personal content in it. See
[docs/markdown.md](docs/markdown.md) for what markdown the post
bodies support, [docs/features.md](docs/features.md) for the
sitewide features (router, keyboard nav, theme, slugs), and
[docs/getting-started.md](docs/getting-started.md) to fork it
and deploy one of your own.

## Layout

```
build.bat / build.sh   entry points, run from repo root
config.json            site toggles: bootloader, theme, which pages ship
.scripts/              build tooling (node, dev-only)
  build.js             pipeline: validate -> bundle -> inline slugs -> prerender
  validate.js          data gate, fails the build on bad data
  frontmatter.js       discovers posts/*.md, parses frontmatter
  slugs.js             loads main/slugs/*.ini, builds the inlined data object
  config.js            loads config.json, fails the build when it is wrong
  prerender.js         renders markdown to dist/blog/<slug>/
  package.json         devDeps only: esbuild
main/                  source of the site
  index.html           shell with all page sections
  404.html             plain 404, also bundled
  _headers             cache headers, copied to dist/
  favicon.ico
  assets/css/          theme, base, markdown, hljs
  assets/js/           posts, pages, app (no runtime data loader)
  assets/fonts/
  assets/vendor/       marked + highlight.js, build-time only
  slugs/               5 INI files (see below)
    meta/projects
    meta/work
    profile/about
    profile/skills
    profile/socials
posts/                 *.md, filename is the slug
dist/                  generated output, deploy this
docs/                  guides: getting-started, config, features, markdown, vendor
README.md              this file - layout + build
```

`meta/posts` is generated at build time from frontmatter by
`.scripts/frontmatter.js`.
`files/` is gitignored personal data, not part of the layout.

## Quick start

To run your own copy, follow [docs/getting-started.md](docs/getting-started.md)
- Install, build, and deploy from zero to served in a few commands.

## What the build does, in order

1. `validate.js` - data gate. Checks every `posts/*.md` has
   frontmatter with a non-empty title and a real ISO date, slug
   filenames are URL-safe, and the slug `.ini` sources build into
   a valid data object (required fields present). Fails before
   touching `dist/`.
2. Copy `main/` -> `dist/`, then esbuild bundles CSS/JS to
   `assets/guava.min.css` / `assets/guava.min.js` and rewrites
   `index.html` + `404.html` to reference only the bundles.
3. Inline slugs into `index.html` as `<script id="slug-data">`
   setting `window.POSTS / PROJECTS / SKILLS / WORK / PROFILE`.
   `meta/posts` comes from frontmatter, the rest from
   `main/slugs/*.ini`. No slug file is emitted and the raw
   `slugs/` dir is removed from `dist/`.
4. `prerender.js` - marked + highlight.js run at build time.
   Emits `dist/blog/<slug>/index.html` per post (highlighted code,
   `.link-text` wrapping, external links get `target="_blank"`)
   plus static shells for `/blog/`, `/projects/`, `/skills/`, `/work/`.
5. Strip the unbundled sources from `dist/` (the 4 CSS + 3 JS
   files). Anything else dropped in those dirs stays.

Runtime deps: none. `marked` + `highlight.js` are vendored under
`main/assets/vendor/` for the build only - never shipped in `dist/`
(`dist/assets/` holds just the two bundles, fonts).

## Keep the build green

- One post = one `posts/*.md`. Lowercase letters, digits, hyphens.
- Every post needs the `---` block with `title:` and `date:`.
  `date:` must be a real `yyyy-mm-dd` (`2026-13-40` fails).
- Values can't contain tabs or newlines. The validator tells you
  the file and the field.
- `config.json` gates the build too: unknown pages, wrong types,
  or a subtitle missing for an enabled page all fail before
  `dist/` is touched. Enabled pages and their subtitles are
  listed in [docs/config.md](docs/config.md).
- Post lists and the post meta row read title/date from
  frontmatter (via generated `meta/posts`), not from any ini.
- Code fences: unknown languages and `plaintext` / `nohighlight`
  stay unhighlighted, that is on purpose, not a bug.

## Deploying

`dist/` is the site - see [docs/getting-started.md](docs/getting-started.md#deploy)
for serving it locally and shipping it to Cloudflare Pages or any
static host:

- `/` home, `/blog/`, `/projects/`, `/skills/`, `/work/`
- `/blog/<slug>/` one dir per post, fully prerendered
- `/assets/guava.min.css`, `/assets/guava.min.js` (slug data is
  inlined in the HTML, no data file is fetched)

Client js is a pathname router (`app.js`): internal `/...` links
are fetched and swapped in, everything else does a full load.
On a prerendered post page it leaves the inlined HTML alone and
just runs the runtime chrome (copy buttons, callouts, images).

## License

[GPL-3.0-only](LICENSE). Demo content is [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/). Third-party
licenses: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
