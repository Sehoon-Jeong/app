#!/usr/bin/env python3
"""Capture normalized SKN Figma nodes and frame renders for incremental comparison."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


API_ORIGIN = "https://api.figma.com"
DEFAULT_FILE_KEY = "0vA4tVGkiS1Us0Tvf7rNDF"
DEFAULT_NODE_IDS = ("245:3870", "245:3890")
KST = dt.timezone(dt.timedelta(hours=9))
SCRIPT_DIR = Path(__file__).resolve().parent
SNAPSHOT_ROOT = SCRIPT_DIR.parent / "snapshots"
KEPT_FIELDS = (
    "id", "name", "type", "visible", "locked", "componentId", "componentProperties",
    "absoluteBoundingBox", "absoluteRenderBounds", "constraints", "layoutMode",
    "primaryAxisAlignItems", "counterAxisAlignItems", "primaryAxisSizingMode",
    "counterAxisSizingMode", "layoutSizingHorizontal", "layoutSizingVertical",
    "layoutAlign", "layoutGrow", "itemSpacing", "counterAxisSpacing", "paddingLeft",
    "paddingRight", "paddingTop", "paddingBottom", "clipsContent", "opacity", "blendMode",
    "cornerRadius", "rectangleCornerRadii", "fills", "strokes", "strokeWeight",
    "strokeAlign", "effects", "characters", "style", "textAlignHorizontal",
    "textAlignVertical", "textAutoResize", "characterStyleOverrides", "styleOverrideTable",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file-key", default=DEFAULT_FILE_KEY)
    parser.add_argument("--node-id", action="append", dest="node_ids")
    parser.add_argument("--label", help="Snapshot directory name; defaults to current KST time")
    parser.add_argument("--no-renders", action="store_true")
    return parser.parse_args()


def api_json(path: str, token: str) -> dict[str, Any]:
    request = urllib.request.Request(
        API_ORIGIN + path,
        headers={"Accept": "application/json", "X-Figma-Token": token},
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        sys.stderr.buffer.write(error.read())
        raise


def normalize_value(value: Any) -> Any:
    if isinstance(value, float):
        return round(value, 4)
    if isinstance(value, list):
        return [normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: normalize_value(value[key]) for key in sorted(value)}
    return value


def normalize_node(node: dict[str, Any]) -> dict[str, Any]:
    normalized = {
        field: normalize_value(node[field])
        for field in KEPT_FIELDS
        if field in node
    }
    children = node.get("children")
    if children:
        normalized["children"] = [normalize_node(child) for child in children]
    return normalized


def flatten(node: dict[str, Any], path: tuple[str, ...] = ()) -> dict[str, dict[str, Any]]:
    current_path = path + (f'{node.get("name", "unnamed")} [{node["id"]}]',)
    entry = {key: value for key, value in node.items() if key != "children"}
    entry["nodePath"] = " / ".join(current_path)
    result = {node["id"]: entry}
    for child in node.get("children", []):
        result.update(flatten(child, current_path))
    return result


def changed_paths(before: Any, after: Any, prefix: str = "") -> list[str]:
    if type(before) is not type(after):
        return [prefix or "value"]
    if isinstance(before, dict):
        paths: list[str] = []
        for key in sorted(set(before) | set(after)):
            path = f"{prefix}.{key}" if prefix else key
            if key not in before or key not in after:
                paths.append(path)
            else:
                paths.extend(changed_paths(before[key], after[key], path))
        return paths
    if isinstance(before, list):
        if before == after:
            return []
        return [prefix or "value"]
    return [] if before == after else [prefix or "value"]


def previous_snapshot(current_dir: Path) -> Path | None:
    candidates = sorted(
        path for path in SNAPSHOT_ROOT.iterdir()
        if path.is_dir() and path != current_dir and (path / "snapshot.json").exists()
    ) if SNAPSHOT_ROOT.exists() else []
    return candidates[-1] if candidates else None


def write_diff(current: dict[str, Any], previous_path: Path | None, destination: Path) -> None:
    lines = ["# Figma snapshot diff", ""]
    if previous_path is None:
        lines.extend(["이전 스냅샷이 없어 현재 상태를 기준선으로 저장했습니다.", ""])
        destination.write_text("\n".join(lines), encoding="utf-8")
        return

    previous = json.loads((previous_path / "snapshot.json").read_text(encoding="utf-8"))
    before_nodes: dict[str, dict[str, Any]] = {}
    after_nodes: dict[str, dict[str, Any]] = {}
    for document in previous["documents"].values():
        before_nodes.update(flatten(document))
    for document in current["documents"].values():
        after_nodes.update(flatten(document))

    added = sorted(set(after_nodes) - set(before_nodes))
    removed = sorted(set(before_nodes) - set(after_nodes))
    changed = []
    for node_id in sorted(set(before_nodes) & set(after_nodes)):
        paths = changed_paths(before_nodes[node_id], after_nodes[node_id])
        if paths:
            changed.append((node_id, after_nodes[node_id]["nodePath"], paths))

    lines.extend([
        f"- 이전 스냅샷: `{previous_path.name}`",
        f"- 추가 노드: {len(added)}",
        f"- 삭제 노드: {len(removed)}",
        f"- 변경 노드: {len(changed)}",
        "",
    ])
    if added:
        lines.extend(["## 추가된 노드", ""] + [f'- `{node_id}` {after_nodes[node_id]["nodePath"]}' for node_id in added] + [""])
    if removed:
        lines.extend(["## 삭제된 노드", ""] + [f'- `{node_id}` {before_nodes[node_id]["nodePath"]}' for node_id in removed] + [""])
    if changed:
        lines.extend(["## 변경된 노드", ""])
        for node_id, node_path, paths in changed:
            summary = ", ".join(f"`{path}`" for path in paths[:16])
            if len(paths) > 16:
                summary += f", 외 {len(paths) - 16}개"
            lines.append(f"- `{node_id}` {node_path}: {summary}")
        lines.append("")
    if not (added or removed or changed):
        lines.extend(["노드 구조와 구현 관련 속성에 변경이 없습니다.", ""])
    destination.write_text("\n".join(lines), encoding="utf-8")


def safe_name(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z._-]+", "-", value).strip("-") or "frame"


def download_renders(file_key: str, documents: dict[str, Any], token: str, output_dir: Path) -> None:
    frames: list[dict[str, str]] = []
    for section_id, document in documents.items():
        for child in document.get("children", []):
            if child.get("type") == "FRAME":
                frames.append({"id": child["id"], "name": child.get("name", "frame"), "section": section_id})
    if not frames:
        return
    ids = ",".join(frame["id"] for frame in frames)
    encoded_ids = urllib.parse.quote(ids, safe=",")
    response = api_json(f"/v1/images/{file_key}?ids={encoded_ids}&format=png&scale=1&use_absolute_bounds=true", token)
    output_dir.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(frames, 1):
        url = response.get("images", {}).get(frame["id"])
        if not url:
            continue
        filename = f'{index:02d}-{frame["id"].replace(":", "-")}-{safe_name(frame["name"])}.png'
        with urllib.request.urlopen(url) as image_response:
            (output_dir / filename).write_bytes(image_response.read())


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def main() -> int:
    args = parse_args()
    token = os.environ.get("FIGMA_ACCESS_TOKEN")
    if not token:
        print("FIGMA_ACCESS_TOKEN is not set; use with_figma_token.sh", file=sys.stderr)
        return 78
    node_ids = tuple(args.node_ids or DEFAULT_NODE_IDS)
    label = args.label or dt.datetime.now(KST).strftime("%Y%m%dT%H%M%S+0900")
    snapshot_dir = SNAPSHOT_ROOT / label
    if snapshot_dir.exists():
        print(f"snapshot already exists: {snapshot_dir}", file=sys.stderr)
        return 73
    snapshot_dir.mkdir(parents=True)

    encoded_ids = urllib.parse.quote(",".join(node_ids), safe=",")
    payload = api_json(f"/v1/files/{args.file_key}/nodes?ids={encoded_ids}&depth=20", token)
    documents = {
        node_id: normalize_node(payload["nodes"][node_id]["document"])
        for node_id in node_ids
    }
    captured_at = dt.datetime.now(KST).isoformat(timespec="seconds")
    snapshot = {
        "schemaVersion": 1,
        "capturedAt": captured_at,
        "fileKey": args.file_key,
        "fileName": payload.get("name"),
        "lastModified": payload.get("lastModified"),
        "version": payload.get("version"),
        "nodeIds": list(node_ids),
        "documents": documents,
    }
    snapshot_path = snapshot_dir / "snapshot.json"
    snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_diff(snapshot, previous_snapshot(snapshot_dir), snapshot_dir / "diff-from-previous.md")
    if not args.no_renders:
        download_renders(args.file_key, documents, token, snapshot_dir / "renders")

    manifest_files = sorted(
        path for path in snapshot_dir.rglob("*")
        if path.is_file() and path.name != "manifest.json"
    )
    manifest = {
        "capturedAt": captured_at,
        "files": {
            str(path.relative_to(snapshot_dir)): {"sha256": sha256(path), "bytes": path.stat().st_size}
            for path in manifest_files
        },
    }
    (snapshot_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(snapshot_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
