# AGENTS.md

## Repository role

`hapa-node-atlas` is a public visual directory and brochure for Hapa. It embeds selected static app surfaces and must provide a direct route to every repository in Hapa Awesome's canonical public registry. It does not own the runtime, maturity, permissions, records, or license of a linked capability.

## Truth and stage rules

- Treat Hapa and this Atlas as **First Pass / Prototype Stage** unless an owning repository names a narrower, evidence-backed state.
- Public discovery and an embedded preview do not prove runtime health, stability, compatibility, production support, partnership, endorsement, commerce, or a license grant.
- Apps and nodes are prepared paint/work surfaces, Cards are reusable swatches and recipes, agents are paintbrushes, and protocols preserve custody, attribution, and reversibility. A jump-off point still needs inspection and verification.
- Preserve upstream attribution and distinguish a supporting source or fork from a Hapa-owned node.
- The open participation invitation is permission to propose a bounded exploration, not an accepted integration or commercial agreement.

## Source truth and directory sync

- Hapa Awesome `data/nodes.json` owns the public Hapa repository set.
- `index.html` owns the crawler- and no-JavaScript-readable Atlas cards and public entry-point links.
- `README.md` owns repository-level orientation, demo links, stage language, and local preview instructions.
- `scripts/audit_public_directory.py` checks the Atlas against the canonical registry and requires the live Scroll Site entry point.

When the canonical public registry changes, update the Atlas card grid and its displayed count in the same change. Do not add every public account repository: use Hapa Awesome's scope ledger to distinguish Hapa nodes, supporting inputs, and repositories not asserted as Hapa.

## Editing and verification

- Inspect existing files and `git status` before editing; preserve unrelated work.
- Keep public copy in served HTML for crawlers and no-JavaScript readers.
- Prefer existing media and explicit text/glyph fallbacks; do not invent product screenshots.
- Verify the directory against a sibling Hapa Awesome checkout:

```bash
python3 scripts/audit_public_directory.py ../hapa-awesome-public/data/nodes.json
```

- Also serve the site over loopback and inspect the desktop and narrow layouts, keyboard navigation, missing assets, and browser console.
