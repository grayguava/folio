# Blog markdown

One file in `posts/` is one post. Filename is the slug,
frontmatter carries the title and date:

```
---
title: Example: shipping with fake data
date: 2026-07-15
---
```

`date:` is raw ISO in the file, rendered as `Jul 08, 2026` on the
list and the post meta row. The body is everything after the
second `---`. Don't put an `# h1` in the body - the title from
frontmatter is the `<h1>`, and a leading `h1` (plus an optional
bold standfirst line) is stripped at build time.

Everything below is per-post-body markdown. Bodies are prerendered
at build time by `.scripts/prerender.js` (marked + highlight.js),
so what you write is what ships in `dist/blog/<slug>/index.html`.
`main/assets/js/posts.js` only adds runtime chrome on top:
copy buttons, callouts, image upgrades. No client-side markdown
parsing, no lazy-loaded libs.

## Code blocks

Fenced blocks get highlighted at build time. Unknown languages
stay plain (e.g. ` ```tree `), and so do these two on purpose:

    ```plaintext
    no highlighting here
    ```

    ```nohighlight
    no highlighting here either
    ```

At runtime each `pre` gets a toolbar: language label on the left,
copy button on the right (copies the raw code text, flips to a
check for 1.5s). `plaintext` / `nohighlight` blocks get the
toolbar with an empty label.

## Links

Text links are wrapped in `.link-text` at build time so only the
text underlines on hover:

```md
[example](https://example.com)
```

- External (`http(s)://`) links get `target="_blank"` +
  `rel="noopener noreferrer"`.
- Links wrapping an image stay unwrapped (no underline on images).
- Old hash-router links are rewritten: `/#blog?p=slug` becomes
  `/blog/slug/`.

Inline links never get an arrow. The `↗` you see on the blog and
project lists belongs to those list items, not to links in prose.

## Post page Chrome

The article HTML ships prerendered, including highlighting and
link chrome. At runtime `posts.js` only runs three upgrades on
`#post-content` (and only when `data-prerendered` is set):

1. `addCopyButtons()` - the code toolbar described above.
2. `upgradeCallouts()` - `> [!NOTE]` blockquotes.
3. `upgradeImages()` - image flags + click-through.

## Callouts

```md
> [!NOTE]
> this renders as a blue-accent callout, not a plain quote.
```

- The marker is case-insensitive, must be the first thing in the
  blockquote's first paragraph, and is removed from the output.
- An empty first paragraph after removal is dropped.
- Plain `>` quotes without the marker are untouched.

## Images

Every image is wrapped in a new-tab link at runtime. Sizing and
position come from pipe flags in the alt text:

```md
![a cat | small | right](cat.jpg)
```

- Sizes: `small` (200px), `medium` (380px), `large` (560px),
  `full` (100%). Default is natural size, max 500px tall.
- Positions: `left` / `right` (float, max 45% wide),
  `center` (shrink-wrapped, centered). Floats collapse to full
  width under 600px. `h2`–`h4` and `hr` clear floats.
- Flag order doesn't matter, unknown flags are ignored, the alt
  text keeps only the part before the first `|`.
- Flagged images get a `figure.img-wrap` wrapper; unflagged ones
  just get the link. A wrapping `<p>` with no other children is
  unwrapped.

## Tables

GitHub-style tables, rendered by marked, scroll horizontally on
narrow screens:

```md
| name | role |
| ---- | ---- |
| demo | test |
```

There is no ascii-table variant. The old `.table-ascii` CSS is
gone - plain ` ``` ` blocks stay as code, they are never
restyled into tables.

## Details / summary

Raw HTML passthrough, styled as collapsibles:

```html
<details>
<summary>click to open</summary>
<p>hidden content, markdown inside html blocks is not parsed.</p>
</details>
```

## Lists

- `ul` markers are accent-colored, `ol` markers are muted.
- Nesting works (`li > ul` gets tighter spacing).
- Definition lists (`dl` / `dt` / `dd`) are styled too.

## Inline code

Single backticks render as chips (tinted bg, bordered, no
ligatures). Heading code is scaled to `0.85em` so it doesn't
blow up the heading size.

## Reading time

Each post meta row shows `· N min read`, computed at build time:

```
max(1, ceil(words / 220 + codeBlocks * 0.3))
```

Code fences are excluded from the word count before dividing.
There is no client-side recount - the number is baked into the
prerendered HTML.
