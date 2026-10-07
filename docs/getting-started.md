# getting started

fork this repo and make it yours. node 18+ is the only prerequisite.

## install

```
git clone https://github.com/grayguava/folio.git my-site
cd my-site
cd .scripts && npm install
cd ..
```

## build

from the repo root:

```
build.bat        :: windows
./build.sh       :: macos / linux
```

a green build looks like this:

```
> Validating...
✓ 4 md files auto-discovered, frontmatter valid
✓ Slug data builds (4 posts, 3 projects, 14 skills, 1 work)
✨ Validation passed!

> Minifying assets...
✓ Slugs: 5 files inlined into index.html (3.3 kB)
✓ JS:     17.6 kB -> 10.4 kB
✓ CSS:    22.8 kB -> 15.3 kB
✨ Minify and build done!

✨ Total site size: 300.5 kB
```

if anything is off — a post missing frontmatter, a bad date, a slug
file missing a field — the build fails before touching `dist/` and
tells you the file and the field. see "keep the build green" in
[README.md](../README.md).

## serve

open `dist/index.html` directly, or serve `dist/` statically:

```
npx serve dist
```

## deploy

`dist/` is the whole site. it works on any static host, as long as
the host serves directories as clean urls (`/blog/<slug>/` from
`dist/blog/<slug>/index.html`):

- **cloudflare pages:** `wrangler pages deploy dist` — `_headers`
  in `dist/` is picked up automatically for cache rules.
- **anything else:** upload `dist/` to netlify, vercel, github pages,
  nginx, an s3 bucket. no server code, no redirect rules needed.

what gets served per route is in [README.md](../README.md#deploying).

## make it yours

everything personal lives in two places:

- `posts/*.md` — one file per post, filename is the slug.
  frontmatter holds `title:` and an ISO `date:`.
- `main/slugs/` — five plain ini files: `meta/projects`,
  `meta/work`, `profile/about`, `profile/skills`,
  `profile/socials`. about holds your name, sub, and bio;
  socials holds links with inline svgs.

swap the placeholder (john doe) content for your own, rebuild, and
the whole site — home, lists, prerendered posts — follows. what
markdown posts support is in [markdown.md](markdown.md), sitewide
behavior in [features.md](features.md).
