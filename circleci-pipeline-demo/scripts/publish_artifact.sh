#!/usr/bin/env bash
# Runs only in the publish job, after aws-cli/setup has already exchanged
# the OIDC token for a short-lived AWS session — `aws` here is authenticated
# with no static keys involved. ARTIFACT_BUCKET comes from the
# aws-oidc-publish CircleCI context.
set -euo pipefail

# Short commit SHA versions the artifact so each build produces a uniquely
# named, traceable object in S3.
VERSION="${CIRCLE_SHA1:0:7}"
ARCHIVE="widget-service-${VERSION}.zip"

mkdir -p dist
zip -r "dist/${ARCHIVE}" app Dockerfile scripts -x '*.pyc' >/dev/null

aws s3 cp "dist/${ARCHIVE}" "s3://${ARTIFACT_BUCKET}/widget-service/${ARCHIVE}"

echo "published s3://${ARTIFACT_BUCKET}/widget-service/${ARCHIVE}"
