# features

what the site does as a whole — routing, pages, theme, chrome.
for what a post body supports, see [markdown.md](markdown.md);
for the build pipeline, see [README.md](README.md).

## clean urls

every page is a real path, prerendered into `dist/`:

```
/               home
/blog/          post list
/blog/<slug>/   one post, fully rendered html
/projects/      /skills/ /work/
```

no hash fragments, no query params. each `dist/blog/<slug>/`
directory has its own `index.html` with the finished article
(bright content included), so crawlers and feed readers get the
whole page with zero javascript.

## client router

`main/assets/js/app.js` is a small pathname router on top of the
prerendered pages:

- internal `/...` links are fetched and swapped in without a full
  reload; `history.pushState` keeps the url honest.
- `popstate` walks back/forward through the same cache.
- pages are prefetched after load (`_prefetchPages()`), so
  hopping between sections feels instant.
- external links, modified clicks (ctrl/meta/shift) and the 404
  page fall through to a normal full load.
- on a prerendered post path the router leaves the inlined html
  alone and just runs post chrome.

## keyboard nav

available on every page:

```
h home   b blog   p projects   s skills   w work   t theme
```

ignored while typing in an input/textarea, and with any modifier
held. on the 404 page only `h` works (plain full load).

## theme

light/dark toggle, persisted in `localStorage` and applied before
first paint (no flash). `t` is the shortcut.

## boot loader

a terminal-style loader (`> _` with a blinking cursor) shows on
the first visit of a session, then stays out of the way —
later navigations in the same session skip it.

## nav highlighting

the active section in the top nav is set from the current
pathname (`_sectionKey()`), including on direct loads and
refreshes of a prerendered `/blog/<slug>/` page — the post's
section key resolves to `blog`.

## slugs

site data lives in five plain JSON files under `main/slugs/`:

```
meta/projects      meta/work
profile/about      profile/skills     profile/socials
```

at build they are flattened into a single `assets/slugs.jsonl` —
one typed JSON record per line, parsed in the browser with plain
`JSON.parse` (round-trip checked by `validate.js`). post metadata
is *not* here — it comes from `posts/*.md` frontmatter (see
[markdown.md](markdown.md)).

## chrome upgrades

on post pages only, `posts.js` runs on top of the prerendered
html: copy-button toolbars, callouts, image flags. lists, item
arrows (`↗`) and reading-time chips are all emitted at build
time, not assembled in the browser.

## styling

- single bundled `assets/guava.min.css` (+ `guava.min.js`),
  built by esbuild — no css/js framework, no runtime deps.
- accent-colored list markers, zebra/hover tables, bordered
  collapsibles, chip-style inline code (details in
  [markdown.md](markdown.md)).
- JetBrains Mono for the terminal-ish chrome; floated images
  collapse to one column under ~600px.

## headers

`main/_headers` (copied to `dist/`): fonts and any vendored
asset get `immutable` caching, everything else under `/assets/*`
gets `no-cache` + `nosniff`.
