#!/usr/bin/env bash
set -euo pipefail

echo "Checking changed files between this build and default branch..."

DEFAULT_BRANCH="${CIRCLE_BRANCH:-main}"

git fetch origin ${DEFAULT_BRANCH} --depth=1
CHANGED=$(git diff --name-only origin/${DEFAULT_BRANCH}...HEAD || true)

echo "Changed files:"
echo "${CHANGED}"

# No changes at all → run full build
if [ -z "$CHANGED" ]; then
  echo "No changes detected; continuing with full build."
  exit 0
fi

# Identify code-related changes
CODE_CHANGES=$(echo "$CHANGED" | grep -E '(^app/|^Dockerfile|^requirements.txt|^tests/|^scripts/|^\.circleci/)') || true

if [ -z "$CODE_CHANGES" ]; then
  echo "Only non-code/doc changes detected → SAFE TO SKIP image build."
  exit 2   # or exit 0 with a SKIP signal
else
  echo "Code changes detected → MUST run full image build."
  exit 0
fi

