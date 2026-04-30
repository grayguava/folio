# From forking to static — my site journey

**Apr 29, 2026**

I started building this site the way most people do — grabbed someone else's and tried to make it mine. forked [nexxel.dev's portfolio](https://github.com/nexxeln/nexxel.dev), cloned it down, and figured i'd just swap in my content. how hard could it be?

## The starting point

next.js. tailwind. mdx blog. the works. it looked clean, had keyboard shortcuts, dark mode, all the things I wanted. I thought i'd just:

- replace the content in the data files
- swap the projects and posts
- deploy and done

I was wrong.

## The problems

### Routing hell

the first thing that broke was routing. next.js app router does its own thing with paths, and when I tried to add client-side routing for smooth transitions, things got messy. i'd click a link and either get a 404 or the server would redirect `.html` to no-extension or vice versa. nothing quite resolved.

### The fetch loops

I tried to add a json + markdown system for posts. thought i'd fetch `.md` files on the client, parse them with marked, show them inline. simple enough, right?

```javascript
// what I tried
function loadPost(slug) {
  fetch(`/posts/${slug}.md`)
    .then(r => r.text())
    .then(md => {
      document.getElementById('content').innerHTML = marked.parse(md);
    });
}
```

wrong. the fetches kept looping — the router would intercept, try to load, fail, redirect, and trigger again. I watched the network tab spiral into infinity. memory caches, pre-fetching, nothing helped. the architecture just didn't want to play nice.

### Overengineered for what I needed

the thing is, I didn't need most of it. I wanted:
- a homepage with my projects
- a blog section
- dark mode
- keyboard nav

I didn't need:
- server-side rendering
- dynamic routes
- build pipelines
- mdx with components

every time I tried to simplify, something else broke. the framework kept pulling me back in.

| what I wanted | what the framework gave me |
|---------------|---------------------------|
| simple nav    | 12 different routing modes |
| dark mode     | theme provider with context |
| fast load     | hydration, pre-rendering |
| easy deploy   | build scripts, node server |

## The realization

at some point I sat back and asked myself: why am I fighting the framework to make it do less?

a static site with client-side routing can do everything I need. one html file, a little js, hash-based navigation. no server, no build, no routing conflicts. just files in a folder.

## The switch

I rebuilt everything from scratch:

### Syntax highlighting

code blocks now have syntax highlighting via highlight.js. I picked colors that match the site's dark theme — bright orange for keywords, green for strings, blue for functions.

```javascript
var ROUTES = {
  'blog': 'blog',
  'projects': 'projects',
  // ...
};
```

each code block also gets a copy button — click to copy the contents to clipboard.

### Style separation

I split markdown/article styles into their own `markdown.css` file. keeps things organized — components.css for UI elements, markdown.css for prose.

### 404 page

added a dedicated 404 page that's centered and clean. pressing h takes you home.

### Default dark theme

the site now defaults to dark theme on first load. if you've visited before, it remembers your choice in localStorage.

### No back button

kept the post view clean — no back button, just the content. navigate with h/b/p/w or the nav.

### Single html, hash routing

everything lives in one `index.html`. each "page" is a `<section>` that's shown or hidden based on the hash — simple, intentional architecture:

```
#home      → homepage
#blog      → blog list
#blog?p=x  → individual post (query param points to md file)
#projects  → projects
#work      → work experience
```

no server needed. no `.htaccess` tricks. no redirects. the hash is the entire routing layer.

### The router

```javascript
var ROUTES = {
  '': 'home',
  'blog': 'blog',
  'projects': 'projects',
  'work': 'work',
};

function route() {
  var hash = window.location.hash.slice(1) || '';
  var pageKey = ROUTES[hash] || 'home';

  // show the right section
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = p.id === 'page-' + pageKey ? '' : 'none';
  });

  // run page init
  if (window.pageInits[pageKey]) {
    window.pageInits[pageKey]();
  }
}
```

### Content modularization

I split the data into `content/`:
- `projects.js` — project list with tags
- `work.js` — work experience
- `posts.js` — post metadata (slug, title, date)

the actual post content lives in `posts/*.md`. when you open a post, we fetch the md file, parse it with marked, and render it:

```javascript
function initPost(query) {
  var slug = query.p;
  fetch('posts/' + slug + '.md')
    .then(r => r.text())
    .then(md => {
      var html = marked.parse(md);
      document.getElementById('post-content').innerHTML = html;
    });
}
```

### Keyboard shortcuts

pressing h/b/p/w navigates. t toggles theme. it's snappy and works offline after first load.

```javascript
document.addEventListener('keydown', e => {
  var map = { h: '#home', b: '#blog', p: '#projects', w: '#work' };
  if (map[e.key]) window.location.hash = map[e.key];
});
```

### Clean URLs

homepage has no hash — `yoursite.com` stays `yoursite.com`. other pages get hashes — `yoursite.com#blog`. i used `history.pushState` to strip the hash when going home so the urlbar stays clean.

## What I learned

1. **less is more** — the best code is the code you don't write. I didn't need a framework; I needed a few functions.

2. **hash routing is underrated** — for a static site, it's the simplest way to do SPAF-style navigation without server config.

3. **content should be portable** — keeping posts as markdown and data as js files means no cms lock-in. edit locally, refresh, done.

4. **deployment should be boring** — `cp -r` to a folder and done. no builds, no pipelines.

## Where I am now

the site does exactly what I want:

| feature | how it works |
|---------|--------------|
| fast load | single html, no framework |
| offline | works after first load |
| easy update | edit js or add md file |
| privacy | no tracking, no analytics |
| deploy | just copy files |

the original fork pulled in multiple MBs of dependencies — building locally pulled around ~177 MB of node_modules. the final version ships at roughly 300 KB total. that's the difference between fighting a framework and owning your stack.

after a day of fighting routing issues, I realized I was solving the wrong problem. now I have something simpler, faster, and entirely mine.

> if you're building a personal site and you just want something that works — try static first. you might be surprised how far a single html file can take you.