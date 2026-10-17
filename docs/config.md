# Config

`config.json` at the repo root decides what gets built. The build
reads it three times over - `validate.js` gates it, `build.js`
applies it, `prerender.js` obeys it - and fails on a missing file,
bad JSON, unknown keys, or wrong types. Fix the message it gives
you and rebuild.

`seo.json` (optional) sits next to it and holds the SEO fields -
today one: `url`. Missing file or empty `url` means SEO off.

```json
{
  "bootloader": {
    "loaderEnable": false,
    "defaultDuration": 1200
  },
  "theme": {
    "defaultTheme": "dark"
  },
  "site": {
    "name": "John Doe"
  },
  "homePreview": {
    "projects": 2,
    "posts": 4,
    "work": 2
  },
  "subtitles": {
    "blog": "occasional posts on systems, networking, and tooling",
    "projects": "things i've built"
  },
  "pages": {
    "blog": true,
    "projects": true,
    "skills": false,
    "work": false
  }
}
```

And `seo.json` beside it:

```json
{
  "url": "https://example.com"
}
```

## Bootloader

- `loaderEnable` (bool) - the `>_` boot screen on first visit.
  `false` removes its markup and script from the HTML entirely
  (the theme-restore script stays).
- `defaultDuration` (number, ms, >= 0) - minimum display time.

## Theme

- `defaultTheme` (`"dark"` or `"light"`) - what first-time
  visitors get, baked into `index.html` and `404.html` before
  first paint. A saved choice in `localStorage` always wins.

## Site

- `name` (non-empty string) - the site title everywhere: the tab,
  the 404 page, every `post · name` title, and the fallback when
  `about.ini` has no `name=`. Change this and your about `name=`
  together.

## SEO (`seo.json`)

- `url` (https URL, or empty) - the public domain, and the SEO
  switch: empty means no meta/OG tags, no sitemap, no robots.
  Set it and every page gets descriptions, canonical links and
  share cards, plus emitted `sitemap.xml` / `robots.txt`.

Kept out of `config.json` so SEO can grow without crowding the
build config. A `site.url` still in `config.json` fails the
build - move the value here. A missing `seo.json` behaves like
an empty `url` (SEO off).

## homePreview

- `projects` / `posts` / `work` (integer, >= 0) - how many of
  each the home page previews. `0` removes that block from the
  home page; the page itself stays.

## Pages

- `blog` / `projects` / `skills` / `work` (bool) - `false` drops
  the page from the nav, the shell, the home blocks, the keyboard
  shortcuts, the prefetch list and the prerender, as if it never
  existed. Omitted pages default to on. Turning `blog` off also
  drops every `/blog/<slug>/` page and skips post validation.

## Subtitles

- One non-empty string per page - the tagline under each page
  heading, HTML-escaped at build time. Every enabled page needs
  one; a disabled page doesn't. Unknown page keys fail the build.
