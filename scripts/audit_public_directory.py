#!/usr/bin/env python3
"""Check Node Atlas against Hapa Awesome's canonical public registry."""

from __future__ import annotations

import json
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "index.html"
README_PATH = ROOT / "README.md"
DEFAULT_REGISTRY = "https://raw.githubusercontent.com/calderwong/hapa-awesome/main/data/nodes.json"
SCROLL_DEMO = "https://calderwong.github.io/hapa-scroll-site/"


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self.links.add(href.rstrip("/"))


def load_registry(source: str) -> dict:
    path = Path(source)
    if path.exists():
        return json.loads(path.read_text())
    request = urllib.request.Request(source, headers={"User-Agent": "hapa-node-atlas-audit"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def main() -> int:
    source = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_REGISTRY
    registry = load_registry(source)
    expected = {entry["url"].rstrip("/") for entry in registry["nodes"]}
    entries_by_name = {entry["name"]: entry for entry in registry["nodes"]}

    parser = LinkParser()
    index = INDEX_PATH.read_text()
    parser.feed(index)
    actual = {
        link
        for link in parser.links
        if link.startswith("https://github.com/calderwong/")
    }
    readme = README_PATH.read_text()

    errors: list[str] = []
    if actual != expected:
        errors.append(
            f"registry mismatch: missing={sorted(expected - actual)} extra={sorted(actual - expected)}"
        )
    if len(expected) != 50:
        errors.append(f"expected audited 50-repository checkpoint, got {len(expected)}")
    if "50 public repos mapped" not in index:
        errors.append("visible Atlas count is not synchronized to 50")
    if SCROLL_DEMO.rstrip("/") not in parser.links:
        errors.append("Atlas HTML is missing the Hapa Scroll Site live entry point")
    if entries_by_name.get("hapa-scroll-site", {}).get("demoUrl") != SCROLL_DEMO:
        errors.append("canonical registry does not expose the Hapa Scroll Site demoUrl")
    if SCROLL_DEMO not in readme:
        errors.append("README is missing the Hapa Scroll Site live entry point")

    result = {
        "ok": not errors,
        "registry_source": source,
        "registry_schema": registry.get("schemaVersion"),
        "expected_repositories": len(expected),
        "atlas_repositories": len(actual),
        "scroll_site_entry_point": SCROLL_DEMO,
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
