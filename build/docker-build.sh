#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-nanopaste}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKERFILE="${DOCKERFILE:-build/Dockerfile}"
PLATFORM="${PLATFORM:-linux/amd64}"
OUTPUT_TAR="${OUTPUT_TAR:-${REPO_ROOT}/build/${IMAGE_NAME//\//_}_${IMAGE_TAG}.tar}"

echo "Building image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "Target platform: ${PLATFORM}"
docker build \
  --platform "${PLATFORM}" \
  -f "${REPO_ROOT}/${DOCKERFILE}" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  "${REPO_ROOT}"

echo "Saving image to: ${OUTPUT_TAR}"
mkdir -p "$(dirname "${OUTPUT_TAR}")"
docker save -o "${OUTPUT_TAR}" "${IMAGE_NAME}:${IMAGE_TAG}"

echo "Done: ${IMAGE_NAME}:${IMAGE_TAG}"
