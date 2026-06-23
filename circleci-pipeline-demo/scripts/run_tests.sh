#!/usr/bin/env bash
set -euo pipefail

mkdir -p test-results

pytest \
  --junitxml=test-results/junit.xml \
  --cov=app.app \
  --cov-report=xml:test-results/coverage.xml \
  app/test_app.py
