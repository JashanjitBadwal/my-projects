#!/usr/bin/env bash
# Local-dev convenience wrapper for running the same test suite the CI test
# job runs, producing the same JUnit/coverage XML output format.
set -euo pipefail

mkdir -p test-results

pytest \
  --junitxml=test-results/junit.xml \
  --cov=app.app \
  --cov-report=xml:test-results/coverage.xml \
  app/test_app.py
