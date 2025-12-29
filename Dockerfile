# ============================================
# 多阶段构建 - 前端 Vue 项目 Docker 部署
# ============================================

# 阶段1: 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建参数，可在构建时指定环境
ARG BUILD_MODE=prod
ENV BUILD_MODE=${BUILD_MODE}

# 构建项目
RUN pnpm build --mode ${BUILD_MODE}

# ============================================
# 阶段2: 生产阶段 - Nginx 静态托管
# ============================================
FROM nginx:alpine AS production

# 复制自定义 nginx 配置
COPY docker/nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
