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
# Jenkins环境下不使用cache mount
RUN pnpm i --frozen-lockfile

# 构建阶段
FROM base AS builder
# 定义构建时参数
ARG DATABASE_URL
ARG NODE_ENV=production
ARG PORT=4235
ARG HOSTNAME=0.0.0.0

# 设置环境变量（构建时使用临时数据库URL）
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

# 运行数据库迁移（在构建完成后）
RUN pnpm prisma db push || echo "数据库迁移失败，继续构建..."

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
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 创建必要目录并复制文件
RUN mkdir -p ./public

# 复制Prisma客户端（仅用于应用运行）
RUN mkdir -p ./node_modules/@prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client ./node_modules/@prisma/client

# 确保用户权限
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4235

CMD ["node", "server.js"] 