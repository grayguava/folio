# Config

`config.json` at the repo root decides what gets built. The build
reads it three times over - `validate.js` gates it, `build.js`
applies it, `prerender.js` obeys it - and fails on a missing file,
bad JSON, unknown keys, or wrong types. Fix the message it gives
you and rebuild.

`seo.json` (optional) sits next to it and holds the SEO fields.
Missing file or empty `url` means SEO off.

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
  "url": "https://example.com",
  "twitter": "@handle",
  "locale": "en_US",
  "jsonLd": true,
  "rss": true
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
  switch: empty means no meta/OG tags, no sitemap, no robots, no
  feed. Set it and every page gets a description, canonical link,
  title, text-only share card, JSON-LD, and `sitemap.xml` /
  `robots.txt`; `feed.xml` is emitted when `rss` is on.
- `twitter` (string, optional) - one handle for
  `twitter:site` / `twitter:creator`. `@handle` or `handle`;
  empty omits them.
- `locale` (string) - Open Graph locale and JSON-LD language,
  `en_US` format. Defaults to `en_US`.
- `jsonLd` (bool) - emit `WebSite`, `Person`, `BlogPosting`,
  `CollectionPage` and `BreadcrumbList`. Defaults to `true`.
- `rss` (bool) - emit `/feed.xml` and the alternate link.
  Defaults to `true`.

There is deliberately no image field: cards use
`twitter:card=summary` and omit `og:image`, so share previews are
text-only. Unknown keys or wrong types fail the build.

Kept out of `config.json` so SEO can grow without crowding the
build config. A `site.url` still in `config.json` fails the
build - move the value here. A missing `seo.json` behaves like
an empty `url` (SEO off).

## Pages

- `blog` / `projects` / `skills` / `work` (bool) - `false` drops
  the page from the shell, the home directory row, the keyboard
  shortcuts, the prefetch list and the prerender, as if it never
  existed. Omitted pages default to on. Turning `blog` off also
  drops every `/blog/<slug>/` page and skips post validation.

## Subtitles

- One non-empty string per page - the tagline under each page
  heading, HTML-escaped at build time. Every enabled page needs
  one; a disabled page doesn't. Unknown page keys fail the build.
