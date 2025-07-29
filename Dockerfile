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
RUN pnpm ci --frozen-lockfile

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN pnpm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 设置权限
USER nextjs

EXPOSE 4235

ENV PORT 4235
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 