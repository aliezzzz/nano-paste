#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-nanopaste}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKERFILE="${DOCKERFILE:-build/Dockerfile}"

echo "Building image: ${IMAGE_NAME}:${IMAGE_TAG}"
docker build \
  -f "${REPO_ROOT}/${DOCKERFILE}" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  "${REPO_ROOT}"

echo "Done: ${IMAGE_NAME}:${IMAGE_TAG}"
