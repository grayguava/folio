# Getting started

Fork this repo and make it yours. Node 18+ is the only prerequisite.

## Install

```
git clone https://github.com/grayguava/folio.git my-site
cd my-site
cd .scripts && npm install
cd ..
```

## Build

From the repo root:

```
build.bat        :: Windows
./build.sh       :: macOS / Linux
```

A green build looks like this:

```
> Validating...
✓ Site config:
     Enabled pages: blog, projects
     Bootloader: off
     Default theme: dark
     Site name: John Doe
     Site URL: (seo off)
✓ 4 md files auto-discovered, frontmatter valid
✓ Slug data builds (4 posts, 3 projects, 14 skills, 1 work)
✨ Validation passed!

> Minifying assets...
✓ Slugs: 5 files inlined into index.html (3.3 kB)
✓ JS:     19.3 kB -> 11.5 kB
✓ CSS:    22.8 kB -> 15.3 kB
✨ Minify and build done!

✨ Total site size: 282.7 kB
```

If anything is off — a post missing frontmatter, a bad date, a slug
file missing a field — the build fails before touching `dist/` and
tells you the file and the field. See "keep the build green" in
[README.md](../README.md).

## Serve

Open `dist/index.html` directly, or serve `dist/` statically:

```
npx serve dist
```

## Deploy

`dist/` is the whole site. It works on any static host, as long as
the host serves directories as clean URLs (`/blog/<slug>/` from
`dist/blog/<slug>/index.html`):

- **Cloudflare Pages:** `wrangler pages deploy dist --branch=<your-production-branch>`
  (`pages deploy` on its own only ever makes a *preview* deployment -
  production is whatever the latest deploy on your production branch
  is, so name it explicitly). `_headers` in `dist/` is picked up
  automatically for cache rules.
- **anything else:** upload `dist/` to Netlify, Vercel, GitHub Pages,
  nginx, an S3 bucket. No server code, no redirect rules needed.

What gets served per route is in [README.md](../README.md#deploying).

## Make it yours

Everything personal lives in two places:

- `posts/*.md` - one file per post, filename is the slug.
  Frontmatter holds `title:` and an ISO `date:`.
- `main/slugs/` - five plain INI files: `meta/projects`,
  `meta/work`, `profile/about`, `profile/skills`,
  `profile/socials`. About holds your name, sub, and bio;
  socials holds links with inline svgs.

Swap the placeholder (John Doe) content for your own, rebuild, and
the whole site - home, lists, prerendered posts - follows. What
markdown posts support is in [markdown.md](markdown.md), sitewide
behavior in [features.md](features.md).

## Site config

What gets built is driven by `config.json` - bootloader screen,
first-visit theme, site name, home preview counts, page subtitles,
and which pages ship at all. `seo.json` drives the SEO output
(meta tags, share cards, `sitemap.xml`); an empty `url` turns it
all off. The full key reference lives in [config.md](config.md).

One rule of thumb: fill in `main/slugs/` first, and only then flip
a page to `true` in `config.json`. A page with no data behind it
builds fine but renders empty lists - data first, switch second.
