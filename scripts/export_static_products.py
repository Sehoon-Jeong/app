#!/usr/bin/env python3
"""Export the local product table as a deterministic static JSONL catalog."""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "backend/data/skn.db"
DEFAULT_OUTPUT = ROOT / "backend/data/subagent-catalog/products.jsonl"
EXPECTED_COUNT = 2654


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    connection = sqlite3.connect(f"file:{args.db.resolve()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            """
            SELECT id, brand, name, category, volume, version_label,
                   description, texture, verified, facts_json, image_url
              FROM product
             ORDER BY id
            """
        ).fetchall()
    finally:
        connection.close()

    ids = [int(row["id"]) for row in rows]
    if len(rows) != EXPECTED_COUNT or ids != list(range(1, EXPECTED_COUNT + 1)):
        raise SystemExit(
            f"catalog coverage error: count={len(rows)} min={ids[0] if ids else None} "
            f"max={ids[-1] if ids else None}"
        )

    output_rows = []
    for row in rows:
        required = ("brand", "name", "category", "description", "texture", "image_url")
        missing = [key for key in required if not str(row[key] or "").strip()]
        if missing:
            raise SystemExit(f"product {row['id']}: missing {missing}")
        try:
            facts = json.loads(row["facts_json"] or "[]")
        except json.JSONDecodeError as exc:
            raise SystemExit(f"product {row['id']}: invalid facts_json") from exc
        if not isinstance(facts, list) or any(not isinstance(item, str) for item in facts):
            raise SystemExit(f"product {row['id']}: facts must be a string array")
        output_rows.append({
            "id": int(row["id"]),
            "brand": str(row["brand"]).strip(),
            "name": str(row["name"]).strip(),
            "category": str(row["category"]).strip(),
            "volume": str(row["volume"]).strip() if row["volume"] is not None else None,
            "versionLabel": str(row["version_label"]).strip() if row["version_label"] is not None else None,
            "description": str(row["description"]).strip(),
            "texture": str(row["texture"]).strip(),
            "verified": bool(row["verified"]),
            "facts": facts,
            "imageUrl": str(row["image_url"]).strip(),
        })

    args.output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{args.output.name}.", suffix=".tmp", dir=args.output.parent
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            for row in output_rows:
                handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
                handle.write("\n")
        os.replace(temporary_name, args.output)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise

    print(f"exported={len(output_rows)} output={args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
