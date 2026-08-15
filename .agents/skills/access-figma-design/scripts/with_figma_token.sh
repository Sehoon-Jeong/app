#!/bin/sh

set -eu

service_name='codex.figma.personal-access-token'
account_name="$(id -un)"

if [ "$#" -eq 0 ]; then
  echo 'usage: with_figma_token.sh <command> [args...]' >&2
  exit 64
fi

if ! figma_access_token="$(security find-generic-password -a "$account_name" -s "$service_name" -w 2>/dev/null)"; then
  echo "Figma token not found in the macOS Keychain service: $service_name" >&2
  exit 78
fi

if [ -z "$figma_access_token" ]; then
  echo "Figma token is empty in the macOS Keychain service: $service_name" >&2
  exit 78
fi

export FIGMA_ACCESS_TOKEN="$figma_access_token"
export FIGMA_TOKEN="$figma_access_token"
unset figma_access_token

exec "$@"
