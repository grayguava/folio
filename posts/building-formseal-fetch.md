# Building formseal-fetch — a CLI tool for encrypted forms

**May 2, 2026**

I built formseal-fetch because I needed a way to pull encrypted form submissions down to my machine. the formseal ecosystem already had the encryption part handled — formseal-embed handles client-side encryption, and the backend stores opaque ciphertexts. what was missing was a simple way to get that data out.

## the problem

when you run a form with formseal-embed, submissions come in encrypted. the server never sees the actual data — just blobs that look like:

```
formseal.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

the backend (cloudflare kv, supabase, redis, whatever) just stores these blobs. that's by design. but then how do you get them out?

I could have just written a one-off script. but I wanted something:
- that others could use
- with a clean cli experience
- that supports multiple backends

so I built a cli tool.

## the architecture

### providers are the key

I didn't want to hardcode cloudflare or supabase into the core. instead, I made a provider system:

```
fsf/providers/
├── __init__.py      # base class + discovery
├── cloudflare/
│   ├── config.json
│   ├── __init__.py
│   └── engine.py
└── supabase/
    ├── config.json
    ├── __init__.py
    └── engine.py
```

each provider is its own folder. drop a new folder in there, and it auto-discovers. the core doesn't know about specific backends — it just calls `provider.fetch(config)` and gets back a dict of ciphertexts.

### what config.json looks like

```json
{
  "display_name": "⚡️ Supabase",
  "storage_type": "PostgreSQL",
  "token_label": "Service Role Key",
  "inputs": [
    { "name": "project_ref", "description": "Project Reference", "required": true },
    { "name": "table", "description": "Table name", "required": true }
  ]
}
```

no code needed to register a provider. just add the folder. that's the goal.

### credentials the right way

tokens go to the OS keychain — windows credential manager, macos keychain, or linux secret service. there's a fallback to a json file, but it's clearly marked as not secure.

I learned this the hard way: don't store tokens in plaintext config files.

## what I've learned

### 1. cli tools need good errors

"connection failed" is useless. "unable to connect — possible causes: vpn blocking port 6379, firewall, network" is useful.

I added a `--debug` flag that shows full tracebacks. users can run `fsf fetch --debug` when something breaks and see exactly what happened.

### 2. drop-in should actually work

I wanted contributors to be able to add providers without touching core code. the current 3-file setup (config.json, __init__.py, engine.py) does that. you fork, add a folder, and you're done.

### 3. security needs honesty

the fallback credential storage is base64-encoded json. that's not secure. I wrote that explicitly in the security policy instead of hiding it.

> "⚠️ This fallback is NOT secure. Base64 encoding is not encryption."

better to be clear than to pretend.

## what's next

the provider system is solid. next I want to:
- add more providers (maybe s3? sql?)
- make the output format configurable
- maybe come up with a better credential fallback idea?

## the point

formseal-fetch isn't trying to be complex. it's a single-purpose tool: get encrypted data from your backend to your machine. everything else — the provider system, the cli design, the error messages — exists to make that one thing feel good to use.

> because the best tools don't just work — they feel right.
