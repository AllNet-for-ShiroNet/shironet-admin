# 经由镜像仓库拉取 Docker Hub 官方镜像（按需替换 tag）
ARG NODE_IMAGE=cr.starivercs.com/docker.io/library/node:20-bookworm-slim

# —— 前端：Vue 3 + Vite ——
FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /web
COPY .npmrc ./
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts uno.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY components.d.ts auto-imports.d.ts ./
COPY public ./public
COPY src ./src

# 与 build.sh 传入的镜像 tag（或 CI 的 commit_sha）对齐；计入本层命令，可避免误用上一次构建的 RUN npm run build 缓存。
ARG CACHE_BUST=0
ARG VITE_API_URL=/api
ARG VITE_API_BASE_URL=/api
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN printf '[frontend-build] CACHE_BUST=%s\n' "${CACHE_BUST}" && npm run build

# —— 后端：NestJS ——
FROM ${NODE_IMAGE} AS backend-build
WORKDIR /app

ARG CACHE_BUST=0

COPY .npmrc ./
COPY shironetadmin-backend/package.json shironetadmin-backend/package-lock.json ./
RUN npm ci
COPY shironetadmin-backend/ ./
RUN printf '[backend-build] CACHE_BUST=%s\n' "${CACHE_BUST}" && npm run build && npm prune --omit=dev

# —— 运行镜像 ——
FROM ${NODE_IMAGE} AS production
WORKDIR /app

ARG CACHE_BUST=0
ARG IMAGE_TAG=local
LABEL shironet.build.cache-bust="${CACHE_BUST}"
LABEL org.opencontainers.image.revision="${CACHE_BUST}"
LABEL org.opencontainers.image.version="${IMAGE_TAG}"

ENV NODE_ENV=production
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /web/dist ./public
EXPOSE 3000
CMD ["node", "dist/main.js"]
