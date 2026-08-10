#!/usr/bin/env python3
"""Create a consistent SQLite backup without copying a live database file."""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: backup_sqlite.py SOURCE DESTINATION", file=sys.stderr)
        return 64

    source = Path(sys.argv[1]).resolve()
    destination = Path(sys.argv[2]).resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)

    source_uri = f"file:{source}?mode=ro"
    with sqlite3.connect(source_uri, uri=True, timeout=30) as source_db:
        with sqlite3.connect(destination) as destination_db:
            source_db.backup(destination_db)
            result = destination_db.execute("PRAGMA integrity_check").fetchone()

    if result != ("ok",):
        destination.unlink(missing_ok=True)
        print("backup integrity check failed", file=sys.stderr)
        return 1

    destination.chmod(0o600)
    print(f"sqlite backup verified: {destination.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
