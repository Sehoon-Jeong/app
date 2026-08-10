#!/usr/bin/env python3
"""Validate and import static product guides written by sub-agents.

This command never calls an external service. It validates the complete
catalog before opening a write transaction, then replaces every product guide
as one atomic SQLite update.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, List


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "backend/data/skn.db"
DEFAULT_INPUT = ROOT / "backend/data/subagent-catalog"
STATIC_GENERATED_AT = "2026-08-11T00:00:00Z"
GUIDE_KEYS = {
    "summary",
    "routineStep",
    "usageType",
    "usageTiming",
    "usageInstructions",
    "highlights",
    "origin",
    "generatedAt",
}
DISALLOWED_TEXT = re.compile(
    r"확인\s*대기|미확인|정보\s*부족|카탈로그에|등록(?:된|되어|돼| 정보)|"
    r"진단|치료|완치|부작용이?\s*없|반드시\s*(?:맞|좋)|안전(?:한|해요|합니다)"
)


class StaticCatalogError(RuntimeError):
    pass


def text(value: Any, field: str, *, maximum: int = 300) -> str:
    if not isinstance(value, str) or not value.strip():
        raise StaticCatalogError(f"{field}: 비어 있지 않은 문자열이어야 합니다.")
    cleaned = value.strip()
    if len(cleaned) > maximum:
        raise StaticCatalogError(f"{field}: {maximum}자를 넘을 수 없습니다.")
    if DISALLOWED_TEXT.search(cleaned):
        raise StaticCatalogError(f"{field}: 사용자에게 노출하지 않을 표현이 있습니다: {cleaned}")
    return cleaned


def string_list(value: Any, field: str, *, minimum: int, maximum: int) -> List[str]:
    if not isinstance(value, list) or not minimum <= len(value) <= maximum:
        raise StaticCatalogError(f"{field}: {minimum}~{maximum}개 배열이어야 합니다.")
    items = [text(item, f"{field}[]") for item in value]
    if len(items) != len(set(items)):
        raise StaticCatalogError(f"{field}: 중복 문장이 있습니다.")
    return items


def validate_guide(product_id: int, product_name: str, value: Any) -> Dict[str, Any]:
    if not isinstance(value, dict) or set(value) != GUIDE_KEYS:
        actual = set(value) if isinstance(value, dict) else set()
        raise StaticCatalogError(
            f"product {product_id}: guide 필드가 다릅니다: {sorted(actual ^ GUIDE_KEYS)}"
        )
    summary = text(value["summary"], f"product {product_id}.summary", maximum=220)
    if re.match(rf"^{re.escape(product_name)}\s*[:：\-–—]", summary):
        raise StaticCatalogError(f"product {product_id}: 제품명 반복형 summary입니다.")
    if len(re.findall(r"[.!?](?=\s|$)", summary)) not in {1, 2, 3}:
        raise StaticCatalogError(f"product {product_id}: summary는 1~3문장이어야 합니다.")

    highlights = value["highlights"]
    if not isinstance(highlights, list) or not 2 <= len(highlights) <= 4:
        raise StaticCatalogError(f"product {product_id}: highlights는 2~4개여야 합니다.")
    normalized_highlights = []
    seen_highlights = set()
    for index, highlight in enumerate(highlights):
        if not isinstance(highlight, dict) or set(highlight) != {"title", "detail"}:
            raise StaticCatalogError(f"product {product_id}: highlight {index + 1} 계약 오류")
        item = {
            "title": text(highlight["title"], f"product {product_id}.highlight.title", maximum=30),
            "detail": text(highlight["detail"], f"product {product_id}.highlight.detail"),
        }
        pair = (item["title"], item["detail"])
        if pair in seen_highlights:
            raise StaticCatalogError(f"product {product_id}: 중복 highlight가 있습니다.")
        seen_highlights.add(pair)
        normalized_highlights.append(item)

    if value["origin"] != "EDITORIAL":
        raise StaticCatalogError(f"product {product_id}: 정적 데이터 origin은 EDITORIAL이어야 합니다.")
    if value["generatedAt"] != STATIC_GENERATED_AT:
        raise StaticCatalogError(f"product {product_id}: generatedAt이 정적 기준일과 다릅니다.")

    return {
        "summary": summary,
        "routineStep": text(value["routineStep"], f"product {product_id}.routineStep"),
        "usageType": text(value["usageType"], f"product {product_id}.usageType"),
        "usageTiming": string_list(
            value["usageTiming"], f"product {product_id}.usageTiming", minimum=1, maximum=3
        ),
        "usageInstructions": string_list(
            value["usageInstructions"],
            f"product {product_id}.usageInstructions",
            minimum=1,
            maximum=3,
        ),
        "highlights": normalized_highlights,
        "origin": "EDITORIAL",
        "generatedAt": STATIC_GENERATED_AT,
    }


def read_rows(paths: Iterable[Path]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for path in paths:
        for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not raw_line.strip():
                continue
            try:
                row = json.loads(raw_line)
            except json.JSONDecodeError as exc:
                raise StaticCatalogError(f"{path}:{line_number}: JSON 오류") from exc
            if not isinstance(row, dict) or set(row) != {"productId", "guide"}:
                raise StaticCatalogError(f"{path}:{line_number}: {{productId, guide}} 계약 오류")
            rows.append(row)
    return rows


def import_catalog(db_path: Path, input_dir: Path) -> None:
    paths = sorted(input_dir.glob("catalog-*.jsonl"))
    if len(paths) != 3:
        raise StaticCatalogError(f"분할 JSONL 3개가 필요합니다. 현재 {len(paths)}개")
    rows = read_rows(paths)

    connection = sqlite3.connect(db_path)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        products = {
            int(product_id): str(name)
            for product_id, name in connection.execute("SELECT id, name FROM product ORDER BY id")
        }
        row_ids = [int(row["productId"]) for row in rows]
        if len(row_ids) != len(set(row_ids)):
            raise StaticCatalogError("JSONL에 중복 productId가 있습니다.")
        missing = sorted(set(products) - set(row_ids))
        unknown = sorted(set(row_ids) - set(products))
        if missing or unknown:
            raise StaticCatalogError(f"전체 제품을 덮지 못했습니다. missing={missing[:20]}, unknown={unknown[:20]}")

        guides = [
            (product_id, validate_guide(product_id, products[product_id], row["guide"]))
            for row in rows
            for product_id in [int(row["productId"])]
        ]
        backup = db_path.with_suffix(".before-subagent-catalog.db")
        shutil.copy2(db_path, backup)
        with connection:
            connection.executemany(
                """
                INSERT INTO product_catalog_content(
                    product_id, summary, routine_step, usage_type,
                    usage_timing_json, usage_tips_json, observation_points_json,
                    origin, generated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(product_id) DO UPDATE SET
                    summary = excluded.summary,
                    routine_step = excluded.routine_step,
                    usage_type = excluded.usage_type,
                    usage_timing_json = excluded.usage_timing_json,
                    usage_tips_json = excluded.usage_tips_json,
                    observation_points_json = excluded.observation_points_json,
                    origin = excluded.origin,
                    generated_at = excluded.generated_at
                """,
                [
                    (
                        product_id,
                        guide["summary"],
                        guide["routineStep"],
                        guide["usageType"],
                        json.dumps(guide["usageTiming"], ensure_ascii=False),
                        json.dumps(guide["usageInstructions"], ensure_ascii=False),
                        json.dumps(guide["highlights"], ensure_ascii=False),
                        guide["origin"],
                        guide["generatedAt"],
                    )
                    for product_id, guide in guides
                ],
            )
        print(f"imported={len(guides)} backup={backup}")
    finally:
        connection.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT)
    args = parser.parse_args()
    import_catalog(args.db, args.input_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
