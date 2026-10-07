# config

`config.json` at the repo root decides what gets built. the build
reads it three times over — `validate.js` gates it, `build.js`
applies it, `prerender.js` obeys it — and fails on a missing file,
bad JSON, unknown keys, or wrong types. fix the message it gives
you and rebuild.

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

## bootloader

- `loaderEnable` (bool) — the `>_` boot screen on first visit.
  `false` removes its markup and script from the html entirely
  (the theme-restore script stays).
- `defaultDuration` (number, ms, >= 0) — minimum display time.

## theme

- `defaultTheme` (`"dark"` or `"light"`) — what first-time
  visitors get, baked into `index.html` and `404.html` before
  first paint. a saved choice in `localStorage` always wins.

## site

- `name` (non-empty string) — the site title everywhere: the tab,
  the 404 page, every `post · name` title, and the fallback when
  `about.ini` has no `name=`. change this and your about `name=`
  together.

## homePreview

- `projects` / `posts` / `work` (integer, >= 0) — how many of
  each the home page previews. `0` removes that block from the
  home page; the page itself stays.

## pages

- `blog` / `projects` / `skills` / `work` (bool) — `false` drops
  the page from the nav, the shell, the home blocks, the keyboard
  shortcuts, the prefetch list and the prerender, as if it never
  existed. omitted pages default to on. turning `blog` off also
  drops every `/blog/<slug>/` page and skips post validation.

## subtitles

- one non-empty string per page — the tagline under each page
  heading, HTML-escaped at build time. every enabled page needs
  one; a disabled page doesn't. unknown page keys fail the build.
