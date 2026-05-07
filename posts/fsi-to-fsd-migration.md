# From `fsi` to `fsd`: rebuilding formseal-decrypt

**May 7, 2026**

A few weeks ago, I wrote about [moving formseal to a GitHub organization](/#blog?p=moving-formseal-to-a-github-org). That post covered the big-picture migration — renaming repos, setting up org structure, and the PyPI naming situation.

But there was another migration hiding inside that one: renaming the CLI tool itself from `fsi` to `fsd`, and making it modular in the process.

This post is about that refactor.

---

## The context

If you read the earlier post, you know that `formseal-inbox` (the CLI) was originally named with the "inbox" idea in mind. I imagined it becoming some kind of terminal inbox — messages, viewing, maybe even a TUI.

But that never happened.

The tool was always just a decryptor:

```text
ciphertexts.jsonl → decrypted data
```

Nothing more.

And at some point, "inbox" started feeling wrong. The name implied features that didn't exist. So I renamed it:

```text
formseal-inbox → formseal-decrypt
fsi            → fsd
```

But the rename was more than just a name change. While I was at it, I rebuilt the output system to be modular — so adding new formats (CSV, table, JSON) would be straightforward.

---

## What the refactor actually looked like

Here's what changed:

### 1. Package renamed

```text
fsi/ → fsd/
fsi/fsi.py → fsd/fsd.py
```

Every import in the codebase shifted from `from fsi.ui import ...` to `from fsd.ui import ...`. A bit tedious, but clean.

### 2. Output formats became modular

This was the main architectural change.

Originally, decrypt just wrote JSONL:

```python
with open(dest, 'w') as f:
    for msg in decrypted:
        f.write(json.dumps(msg) + '\n')
```

Now there's a format system:

```python
# formats/formatter.py
class Formatter(ABC):
    name: str = ""
    extension: str = ""

    @abstractmethod
    def write(self, data: list[dict], path: Path):
        pass
```

Each format is its own file:

```
formats/
├── formatter.py   # base class
├── jsonl.py       # JSON Lines formatter
└── json.py        # Pretty JSON formatter
```

And the formatter tells you its name and file extension:

```python
class JsonFormatter(Formatter):
    name = "JSON"
    extension = "json"
```

This way, adding CSV or table formats later just means dropping in a new file.

![](/api/assets/fsd-flow.svg)


### 3. Connect changed

The connect flow now asks for output format:

```
Source File (ciphertexts): formseal.ct.jsonl
Destination Directory: ./output
Output Format [JSON Lines, JSON]: json
Private Key: <your-key>
```

The format gets saved in config.json:

```json
{
  "source": "...",
  "destination": "...",
  "format": "json"
}
```

### 4. Decrypt uses the formatter

Now decrypt just does:

```python
formatter = get_formatter(output_format)
formatter.write(decrypted, dest_path)
```

No more hardcoded JSONL logic.

---

## Why this mattered

The biggest reason was future-proofing.

Right now we have two formats. But I've already thought about:

- CSV output for Excel users
- Table output for terminal-friendly viewing
- Maybe JSON with a specific schema

With the old code, each new format would have meant more if/else in the decrypt command. Now it's just: add a file, register it in `__init__.py`, done.

The second reason was clarity. The old name (`fsi`) didn't tell you what the tool did. The new name (`fsd`) is still short, but `decrypt` is explicit. And having `json` vs `jsonl` in the format prompt is way clearer than `pretty` was originally.

### Before / After

```bash
# Before
fsi decrypt (jsonl default)

# After
fsd decrypt --format json
```

Same tool, simpler name, explicit intent.

---

## The issues I hit

### 1. Workflow files

The GitHub Actions workflows still pointed to the old `fsi/` directory. The inject-version workflow was trying to update `fsi/commands/general/version.py` which no longer existed. Quick fix, but easy to miss.

### 2. Empty __init__.py files

There were a bunch of empty `__init__.py` files scattered around — `security/__init__.py`, `commands/__init__.py`, etc. They're unnecessary when you explicitly list packages in `pyproject.toml`. I deleted the empty ones but kept `formats/__init__.py` and `ui/__init__.py` because they have actual imports.

### 3. Documentation references

The README, CONTRIBUTING.md, and SECURITY.md all had old references. The repo moved from `grayguava/formseal-inbox` to `useFormseal/decrypt`, and the CLI changed from `fsi` to `fsd`. Updating docs took more time than expected.

---

## What stayed the same

Core decryption logic stayed untouched — NaCl sealed boxes, base64url handling, error flows. Only output handling changed.

---

## Version bump

One small detail: the old `formseal-inbox` was at v0.1.0. Since this is a new repo and a meaningful refactor, I bumped to v0.2.0.

In the new repo, I can create a v0.1.0 tag that references the old `formseal-inbox` for completeness.

---

## Where this leaves us

The formseal ecosystem now looks like:

| Tool             | Status    |
| ---------------- | --------- |
| formseal-embed   | active   |
| formseal-fetch   | active   |
| formseal-decrypt | active   |
| formseal-inbox   | archived |

And `formseal-decrypt` (fsd) is more extensible than before, without adding complexity to the core decrypt command.

---

## What I learned

### 1. Renames are more than renames

Moving from `fsi` to `fsd` forced me to think about what the tool actually is. The answer was simple: just a decryptor. And that simplicity is worth preserving.

### 2. Modularity pays off

Even with just two formats, having them in separate files is cleaner than one big formatter class. It makes the codebase easier to navigate and easier to extend.

### 3. Docs need love too

I spent more time than expected on README, CONTRIBUTING, and SECURITY docs. But it's worth it — good docs are part of the tool.

---

## Next

Now that the format system is in place, adding new outputs should be straightforward. If someone wants CSV, they add `formats/csv.py`, implement `write()`, and it's done.

The CLI is sharper now. More intentional. Less confused about what it's supposed to be.
