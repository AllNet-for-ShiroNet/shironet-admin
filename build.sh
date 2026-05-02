#!/bin/bash

set -e

export DOCKER_BUILDKIT=1

# 仓库账号
username='robot$shironet-build-shell'
# 仓库密码（脚本内固定）
password="p3NIrVWuklCad3nYHxI4wnRBaN1Bn1jZ"
# 仓库地址
hubAddr="reg.starivercs.com"
# 命名空间
namePlace="shironet"
# 项目名
projectName="shironet-admin-dashboard"
# 以时间为标签
tag=$(date "+%Y%m%d%H%M%S")

CACHE_BUST_VAL="${CACHE_BUST:-${tag}}"
BUILD_ARGS=(-t "${hubAddr}/${namePlace}/${projectName}:${tag}")
BUILD_ARGS+=(--build-arg "CACHE_BUST=${CACHE_BUST_VAL}")
BUILD_ARGS+=(--build-arg "IMAGE_TAG=${tag}")
BUILD_ARGS+=(--label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)")

# 可选：NO_CACHE=1 / PULL_BASE=1
[[ "${NO_CACHE:-0}" == "1" ]] && BUILD_ARGS+=(--no-cache)
[[ "${PULL_BASE:-0}" == "1" ]] && BUILD_ARGS+=(--pull)

echo "$password" | docker login --username="$username" --password-stdin "$hubAddr"
docker build "${BUILD_ARGS[@]}" .

docker push "${hubAddr}/${namePlace}/${projectName}:${tag}"
docker rmi "${hubAddr}/${namePlace}/${projectName}:${tag}" || true
docker logout "$hubAddr"

echo "build image success to ${hubAddr}/${namePlace}/${projectName}:${tag} (CACHE_BUST=${CACHE_BUST_VAL})"
