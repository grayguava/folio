# Features

What the site does as a whole - routing, pages, theme, chrome.
For what a post body supports, see [markdown.md](markdown.md);
for the build pipeline, see [README.md](../README.md).

## Clean URLs

Every page is a real path, prerendered into `dist/`:

```
/               home
/blog/          post list
/blog/<slug>/   one post, fully rendered html
/projects/      /skills/ /work/
```

No hash fragments, no query params. Each `dist/blog/<slug>/`
directory has its own `index.html` with the finished article
(bright content included), so the whole page arrives with zero
JavaScript.

## Client router

`main/assets/js/app.js` is a small pathname router on top of the
prerendered pages:

- Internal `/...` links are fetched and swapped in without a full
  reload; `history.pushState` keeps the URL honest.
- `popstate` walks back/forward through the same cache.
- Pages are prefetched after load (`_prefetchPages()`), so
  hopping between sections feels instant.
- External links, modified clicks (ctrl/meta/shift) and the 404
  page fall through to a normal full load.
- On a prerendered post path the router leaves the inlined HTML
  alone and just runs post chrome.

## Keyboard nav

There is no nav bar - the keys are the interface, and every page
carries a hint line with the bindings:

```
h home   b blog   p projects   s skills   w work   t theme
```

Keys exist only for the pages enabled in `config.json`. Ignored
while typing in an input/textarea, and with any modifier held.
On the 404 page only `h` works (plain full load).

## Theme

Light/dark toggle, persisted in `localStorage` and applied before
first paint (no flash). `t` is the shortcut.

## Boot loader

A terminal-style loader (`> _` with a blinking cursor) shows on
the first visit of a session, then stays out of the way —
later navigations in the same session skip it. This repo ships it
off (`bootloader.loaderEnable: false` in `config.json`).

## Home

A centered title card: the name types itself in on every page
load, then the intro and bio, a directory row with per-page counts
(`blog/ (4)  projects/ (3)`), and the social icons. Nothing else —
no nav, no footer, no chrome.

## Slugs

Site data lives in five plain INI files under `main/slugs/`:

```
meta/projects      meta/work
profile/about      profile/skills     profile/socials
```

At build they are baked into `index.html` as a `<script
id="slug-data">` setting `window.POSTS / PROJECTS / SKILLS / WORK /
PROFILE` — no slug file is emitted to `dist/`, nothing is fetched
or parsed in the browser. Post metadata is *not* here - it comes
from `posts/*.md` frontmatter (see [markdown.md](markdown.md)).

## Chrome upgrades

On post pages only, `posts.js` runs on top of the prerendered
HTML: copy-button toolbars, callouts, image flags. Lists, item
arrows (`↗`) and reading-time chips are all emitted at build
time, not assembled in the browser.

## Styling

- Single bundled `assets/guava.min.css` (+ `guava.min.js`),
  built by esbuild - no CSS/JS framework, no runtime deps.
- Accent-colored list markers, zebra/hover tables, bordered
  collapsibles, chip-style inline code (details in
  [markdown.md](markdown.md)).
- Geist Mono for the terminal-ish chrome; floated images
  collapse to one column under ~600px.

## Headers

`main/_headers` (copied to `dist/`): fonts get `immutable` caching,
everything else under `/assets/*` gets `no-cache` + `nosniff`.
