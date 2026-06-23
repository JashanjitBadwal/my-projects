#!/usr/bin/env bash
set -euo pipefail

VERSION="${CIRCLE_SHA1:0:7}"
ARCHIVE="widget-service-${VERSION}.zip"

mkdir -p dist
zip -r "dist/${ARCHIVE}" app Dockerfile scripts -x '*.pyc' >/dev/null

aws s3 cp "dist/${ARCHIVE}" "s3://${ARTIFACT_BUCKET}/widget-service/${ARCHIVE}"

echo "published s3://${ARTIFACT_BUCKET}/widget-service/${ARCHIVE}"
