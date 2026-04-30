# Designing CLI tools that feel right

**Apr 30, 2026**

there's something special about a well-crafted cli tool. it's not just about functionality — it's about the experience. how it feels when you type a command, how the output reads, how intuitive the flags are.

## What makes a CLI feel good

the best cli tools share a few traits:

1. **sensible defaults** — do the right thing without flags
2. **clear output** — colors, spacing, brevity when needed
3. **helpful errors** — tell you what's wrong, not just "error"
4. **consistent patterns** — similar commands behave similarly

## The little things

small details matter:

```
# bad
tool: option -o requires argument

# good
tool: error: -o flag requires a value
```

or:

```
# bad
processing... done

# good
[✓] processing complete (0.3s)
```

## Take formseal for example

[formseal](https://github.com/polymercistern/formseal) started as a simple form backend. but the cli experience was important:

- `fsf submit` — one command to submit
- clear success/error states
- json output when you need it, quiet when you don't

## The goal

every cli should feel like it was designed by someone who actually uses it. not a wrapper around an api, but a tool that solves a problem elegantly.

if you're building one, ask: "would i enjoy using this every day?"

---

> because the best tools don't just work — they feel right.