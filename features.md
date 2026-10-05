# Features

Everything the markdown pipeline and article chrome support, so post
authors don't have to grep `posts.js`. The markdown engine is
[marked](https://github.com/markedjs/marked) v15 with GFM enabled, code
highlighting via [highlight.js](https://highlightjs.org/) v11, and a
thin layer of upgrade hooks in `main/assets/js/posts.js`.

## Code blocks

Triple-backtick fences with an optional language get a copy button and a
small toolbar:

    ```go
    func main() {}
    ```

- The toolbar label shows the language.
- No language (or `plaintext`/`nohighlight`) = no highlighting, just a
  bare `<pre>` with the copy button.
- If a fence contains a known language, hljs highlights it at render
  time; otherwise the block stays as-is.

## Inline code

Backticks render as a `border`-outlined pill. Inside headings they
shrink to 85%.

## Callouts

A blockquote whose first paragraph starts with `[!NOTE]` upgrades to a
blue-left-border callout and strips the marker:

    > [!NOTE] Remember to validate before deploying.

## Images

`![alt](src)` plus optional pipe flags for layout and size:

```md
![diagram of the pipeline|center|large](/api/diagrams/pipeline.svg)
```

| Position flag | Effect |
| --- | --- |
| `left` | floated left, text wraps |
| `right` | floated right, text wraps |
| `center` | centered, no wrap |
| (none) | block, natural width |

| Size flag | Max box |
| --- | --- |
| `small` | 200×200 |
| `medium` | 380×320 |
| `large` | 560×460 |
| `full` | 100% width, uncapped height |

Every image is wrapped in a clickable link that opens the original in a
new tab. Floated images collapse to a single column under ~600px.

## Tables

GFM pipe tables just work, and get the styled zebra/hover treatment from
`markdown.css`:

| Path | Policy |
| --- | --- |
| `/assets/*` | `no-cache` |

If you need an ASCII-table block for monospace layout, wrap it in
`<div class="table-ascii">` — the renderer escapes it, allows links and
`**bold**` inside, and lets it scroll horizontally.

## Links

Inside article text, external-looking links get an auto-appended `↗`
that drifts up on hover, plus `target="_blank"` and
`rel="noopener noreferrer"` set automatically. The underline animates
in on the text span only.

## Details / summary

Native collapsibles are styled as bordered cards with a rotating `▶`:

    <details>
    <summary>More</summary>

    Hidden content.
    </details>

## Lists & typography

- Unordered markers are accent-colored; ordered markers are muted.
- `<dl>` definitions render muted `<dd>` blocks.
- Headings get `scroll-margin-top` so anchor links don't clip under the
  fixed header.
- Reading time and word count are estimated from the raw markdown and
  shown next to the date on every post.

## Keyboard navigation

While reading (or anywhere on the site):

| Key | Action |
| --- | --- |
| `h` | home |
| `b` | blog |
| `p` | projects |
| `s` | skills |
| `w` | work |
| `t` | toggle light/dark theme (persisted in `localStorage`) |

## Post page chrome

The rendered body is wrapped in a `.post-meta` row — title pulled from
the slug section, then date chip and `n min read` chip. Scripts and
styles needed for a given post (marked, highlight.js) are lazy-loaded on
first visit, not fetched on every page.
