# 使用Node.js 18 Alpine镜像
FROM node:18.18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package文件
COPY package*.json pnpm-lock.yaml* ./

# 安装依赖阶段
FROM base AS deps
# 使用BuildKit cache mount for pnpm store
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile

# 构建阶段
FROM base AS builder
# 定义构建时参数
ARG NODE_ENV=production
ARG PORT=4235
ARG HOSTNAME=0.0.0.0

# 设置环境变量（构建阶段使用假的数据库连接）
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV HOSTNAME=$HOSTNAME

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端
RUN pnpm prisma generate

# 构建应用
RUN pnpm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

# 定义运行时参数
ARG DATABASE_URL
ARG NODE_ENV=production
ARG PORT=4235
ARG HOSTNAME=0.0.0.0

# 设置环境变量
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV HOSTNAME=$HOSTNAME

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 复制pnpm的Prisma客户端（路径与npm不同）
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.pnpm/prisma*/node_modules/prisma ./node_modules/prisma

EXPOSE 4235

CMD ["node", "server.js"] 