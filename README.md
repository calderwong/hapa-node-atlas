# Hapa Node Atlas

Static Atlas for the public Hapa ecosystem: a local-first AI and worldbuilding protocol made of cooperating nodes. It embeds public node surfaces, the 2D and 3D graph views, and the wider public Hapa source map.

Current state: **First Pass / Prototype Stage**. The static Pages experience and linked repositories are public discovery surfaces, not guarantees of stability, compatibility, uptime, production support, fitness, partnership, or licensing. A narrower maturity statement applies only to the capability and evidence named by its owning repository.

Use the Atlas as one surface in Hapa's artist kit: apps and nodes are prepared paints and work surfaces, Cards are reusable swatches and recipes, agents are paintbrushes, and protocols preserve attribution, custody, and reversibility. Pick a nearby repository as a jump-off point, inspect its status and authority, adapt it to the new problem, verify the result, and preserve useful evidence.

## Continue exploring

- [Hapa Awesome](https://github.com/calderwong/hapa-awesome) — canonical public repository directory and first-entry guide.
- [Human-readable public catalog](https://github.com/calderwong/hapa-awesome/blob/main/docs/NODES.md) — roles and routing for every public Hapa repository.
- [Machine-readable public registry](https://github.com/calderwong/hapa-awesome/blob/main/data/nodes.json) — complete registry for agents and tools.
- [Public repository scope](https://github.com/calderwong/hapa-awesome/blob/main/docs/REPOSITORY_SCOPE.md) — account-wide inclusion, support, and exclusion boundary.
- [Hapa front door](https://github.com/calderwong/hapa) — architecture, Node Space, and local operating model.
- [Hapa Graphify](https://github.com/calderwong/hapa-graphify) — bounded relationship exploration across the ecosystem.
- [Hapa Scroll Site live demo](https://calderwong.github.io/hapa-scroll-site/) — cinematic, scroll-driven ecosystem and Hapa Card tour ([source](https://github.com/calderwong/hapa-scroll-site)).

## Demo

[View the GitHub Pages demo](https://calderwong.github.io/hapa-node-atlas/)

## Included Nodes

- Hapa Character Sheet
- Hapa Second Brain
- Hapa Dev Proto
- Overwatch Kanban board atlas with ecosystem and node-specific board snapshots
- Hapa Node Space 3D graph and flow playback
- Complete 50-repository public Hapa index, synchronized with Hapa Awesome

## Participation

For-profit and nonprofit teams may suggest a bounded, attributable presence, connector, public-interest pilot, or future decentralized-commerce experiment through the [Hapa participation guidance](https://github.com/calderwong/hapa/blob/main/docs/ECOSYSTEM_STAGE_AND_PARTICIPATION.md). The open invite is not itself acceptance, partnership, endorsement, integration proof, funding, or commercial terms.

## Directory verification

With a sibling checkout of Hapa Awesome:

```sh
python3 scripts/audit_public_directory.py ../hapa-awesome-public/data/nodes.json
```

Without a sibling checkout, omit the argument to audit against Hapa Awesome's published registry.

## Local Preview

```sh
python3 -m http.server 8127 --bind 127.0.0.1
```

Then open [http://127.0.0.1:8127/](http://127.0.0.1:8127/).
