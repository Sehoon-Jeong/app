#!/usr/bin/env python3
"""Call the Figma REST API without placing the token in command arguments."""

from __future__ import annotations

import argparse
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


API_ORIGIN = "https://api.figma.com"
ALLOWED_METHODS = ("GET", "POST", "PUT", "DELETE")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("method", choices=ALLOWED_METHODS)
    parser.add_argument("path", help="Figma API path beginning with /v1/")
    parser.add_argument("--data-file", type=Path, help="JSON request body file")
    return parser.parse_args()


def api_url(path: str) -> str:
    parsed = urllib.parse.urlsplit(path)
    if parsed.scheme or parsed.netloc or not parsed.path.startswith("/v1/"):
        raise ValueError("path must be a relative Figma API path beginning with /v1/")
    return API_ORIGIN + path


def main() -> int:
    args = parse_args()
    token = os.environ.get("FIGMA_ACCESS_TOKEN")
    if not token:
        print("FIGMA_ACCESS_TOKEN is not set; use with_figma_token.sh", file=sys.stderr)
        return 78

    try:
        url = api_url(args.path)
    except ValueError as error:
        print(error, file=sys.stderr)
        return 64

    body = args.data_file.read_bytes() if args.data_file else None
    headers = {"Accept": "application/json", "X-Figma-Token": token}
    if body is not None:
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=body, headers=headers, method=args.method)
    try:
        with urllib.request.urlopen(request) as response:
            sys.stdout.buffer.write(response.read())
    except urllib.error.HTTPError as error:
        sys.stderr.buffer.write(error.read())
        sys.stderr.write("\n")
        return 1
    except urllib.error.URLError as error:
        print(f"Figma API request failed: {error.reason}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
