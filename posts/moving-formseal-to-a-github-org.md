# Why I moved formseal to a GitHub organization

**May 6, 2026**

At first, formseal lived entirely under my personal GitHub account.

That worked when it was just one project.

Then it became three.

And eventually I realized I wasn't maintaining a single repository anymore — I was maintaining a small ecosystem:

* `formseal-embed`
* `formseal-fetch`
* `formseal-decrypt`

Each one had a separate responsibility. Each one evolved independently. And slowly, my personal account stopped making sense as the home for all of it.

So I moved everything into a GitHub organization.

This post isn't a dramatic "startup journey" story. It's mostly about architecture, naming mistakes, release pipelines, and realizing that infrastructure projects need a different kind of structure than regular side projects.

---

## The beginning

formseal didn't start as a product idea.

It started as a trust problem.

I wanted encrypted form submissions where:

* the browser encrypts before sending
* the backend only stores ciphertext
* decryption happens locally
* storage provider doesn't matter

Over time, this turned into a pipeline problem:

![formseal pipeline](/api/assets/formseal-pipeline.svg)

Each tool did one thing.

That separation became the entire philosophy of the ecosystem.

---

## Why the personal account stopped making sense

At first, everything being under my own GitHub username felt fine.

But several problems started appearing.

### 1. The projects stopped feeling independent

A repo under a personal account often feels like:

> "random side project"

Even if the code is serious.

Once the tools became interconnected, I wanted:

* a shared identity
* shared documentation
* shared issue tracking philosophy
* a single place for releases and references

An organization solved that naturally.

---

### 2. The ecosystem became clearer than the tools themselves

This was the biggest realization.

Originally I thought:

> "formseal is the CLI"

Then later:

> "formseal is the pipeline"

Then eventually:

> "formseal is really just a payload format and workflow"

The tools are reference implementations.

The actual system is:

```text
browser → encrypted payload → storage → fetch → decrypt
```

At that point, keeping everything tied to a personal profile felt wrong.

---

### 3. Separation improved clarity

![useFormseal](/api/assets/useFormseal.webp)

After moving to an org, the structure became cleaner:

```text
useFormseal/
├── embed
├── fetch
├── decrypt
├── inbox (archived)
└── .github
```

Now each repo has:

* a focused purpose
* isolated releases
* cleaner READMEs
* clearer issue boundaries

Instead of:

> "one developer account with several random repos"

it became:

> "one system with separate components"

That distinction matters.

---

## The naming problem

This migration exposed one thing I hadn't fully realized:

> naming mistakes compound over time.

The biggest example was `formseal-inbox`.

Originally, I imagined the decryptor tool becoming a sort of terminal inbox:

```text
fsi inbox
```

But eventually I killed that idea entirely.

The decryptor wasn't supposed to:

* manage messages
* become a UI
* become a viewer
* become a mini database

Its actual job was much simpler:

```text
ciphertext → structured output
```

So `inbox` stopped making sense.

I renamed it to:

```text
formseal-decrypt
fsd
```

And honestly:

that one rename clarified the entire architecture.

---

## The PyPI issue

This was one of the annoying parts.

I had already published:

```text
formseal-inbox
```

on PyPI.

Then I realized:

> PyPI package names are permanent.

You can't just rename them later.

At first I considered deleting the package entirely.

Bad idea.

Deleting packages:

* breaks old installs
* creates naming holes
* removes history
* creates ecosystem confusion

So instead I decided:

* keep `formseal-inbox`
* mark it deprecated
* archive the repo
* create `formseal-decrypt`
* move forward cleanly

That ended up being the correct decision.

Infrastructure tooling should preserve history, not rewrite it.

---

## Migrating GitHub Actions

The org move also broke publishing workflows.

GitHub Actions + PyPI trusted publishing are tied to:

```text
owner/repository/workflow
```

Once ownership changes:

* old trusted publishers stop working
* release workflows fail
* publishing breaks silently

I had to:

* update trusted publisher configuration
* point PyPI to the org instead of my personal account
* verify OIDC permissions still worked
* re-check release workflows

Thankfully GitHub repo transfers preserve most history automatically.

Stars, issues, PRs, and redirects survived.

The actual migration was easier than expected.

---

## Why I didn't build a full UI

During all this, I also reconsidered another idea:

> should the decryptor have a full inbox-style TUI or dashboard?

At first it sounded cool.

Then I realized it completely conflicted with the philosophy of the system.

The pipeline already works perfectly with existing tools:

```bash
fsd > data.jsonl
fsd --format csv > data.csv
```

Users can:

* open CSV in Excel
* pipe JSONL into jq
* automate workflows with cron or Task Scheduler
* build their own viewers

So why should formseal become:

* a spreadsheet app
* a terminal dashboard
* a database browser

?

It shouldn't.

The decryptor's job is:

```text
decrypt → output structured data
```

Nothing else.

That realization killed a lot of unnecessary feature ideas.

---

## The flexibility problem

One thing I kept questioning during the migration was:

> Did I give developers too much freedom?

formseal is intentionally flexible.

Developers can:

* use their own backend
* write their own fetchers
* manually edit config
* bypass the CLI entirely
* integrate the runtime however they want

At first that worried me.

I thought:

> maybe I should have locked things down harder.

But eventually I realized the real issue wasn't flexibility.

The real issue was:

> defining the core contract clearly.

As long as:

* payload structure stays stable
* metadata format stays stable
* decryption output stays stable

then flexibility at the edges is fine.

That became a major architectural realization for me.

---

## What the org actually represents

The organization isn't:

* a startup
* a company
* a big team

Right now it's literally just me.

But creating an org changed the framing of the project.

It forced me to think about:

* long-term structure
* release consistency
* naming stability
* ecosystem boundaries
* specification vs implementation

And honestly:

that was probably overdue.

---

## What I learned

### 1. Small systems still need structure

formseal isn't a giant project.

But once multiple tools start interacting:

* naming matters
* boundaries matter
* release consistency matters
* contracts matter

A lot.

---

### 2. Infrastructure projects should stay boring

The more I worked on formseal, the more I realized:

boring is good.

Good infrastructure:

* behaves predictably
* avoids magic
* composes with existing tools
* doesn't try to own the workflow

That's the direction I want to keep.

---

### 3. Feature creep is easy to justify

A lot of the ideas I killed sounded reasonable:

* inbox UI
* filters
* search
* viewer systems
* interactive dashboards

But every one of them slowly pushed the project away from:

```text
simple encrypted pipeline
```

and toward:

```text
overengineered data application
```

Killing those ideas early was important.

---

### 4. Naming is architecture

I underestimated this badly.

`inbox` vs `decrypt` wasn't cosmetic.

It changed:

* user expectations
* future scope
* mental model
* design direction

A bad name quietly creates bad architecture.

---

## Where formseal is now

The ecosystem currently looks like this:

| Tool             | Responsibility          |
| ---------------- | ----------------------- |
| formseal-embed   | browser-side encryption |
| formseal-fetch   | fetch ciphertexts       |
| formseal-decrypt | decrypt locally         |

And honestly?

That's enough.

The goal isn't to build:

* a platform
* a hosted service
* a giant framework

The goal is much smaller:

> encrypted form handling with minimal trust assumptions.

Nothing more.

---

## Final thoughts

Moving everything into an org wasn't just cleanup.

It forced me to:

* rethink boundaries
* rethink naming
* rethink responsibility
* rethink what formseal actually is

And weirdly enough, that ended up clarifying the project more than any feature work did.

The system feels sharper now.

More intentional.

Less confused.

And honestly, that's probably more valuable than adding another feature.

> good infrastructure disappears into the workflow.
> that's the direction I want formseal to keep moving toward.
