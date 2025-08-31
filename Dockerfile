###############################################
# Dependencies stage
###############################################
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

###############################################
# Build stage
###############################################
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install all dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_APP_NAME="Homeland"
ARG NEXT_PUBLIC_APP_VERSION="1.0.0"
ARG DATABASE_URL
ARG WATCHDOG_HOST
ARG WATCHDOG_PORT
ARG WATCHDOG_TIMEOUT
ARG SKIP_TESTS="false"

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

# Run code quality checks (unless skipped)
RUN if [ "$SKIP_TESTS" != "true" ]; then \
        echo "🔍 运行代码质量检查..."; \
        pnpm type-check; \
        pnpm lint; \
        echo "✅ 代码质量检查通过"; \
    else \
        echo "⚠️ 跳过代码质量检查"; \
    fi

# Build Next.js application
RUN pnpm build

###############################################
# Production runtime stage
###############################################
FROM node:20-alpine AS runner
RUN apk add --no-cache curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production dependencies from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for potential runtime operations
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Expose port
EXPOSE 3000

# Environment defaults (can be overridden at runtime)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]