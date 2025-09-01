###############################################
# Dependencies stage
###############################################
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm globally for better performance
RUN npm install -g pnpm@latest

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with optimizations
RUN pnpm install --frozen-lockfile --prod --prefer-offline --no-optional

###############################################
# Build stage
###############################################
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies with optimizations
RUN pnpm install --frozen-lockfile --prefer-offline --no-optional

# Copy source code (exclude node_modules for better performance)
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
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for potential runtime operations
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/api/health || exit 1

# Expose ports
EXPOSE 30010
EXPOSE 50051

# Environment defaults (can be overridden at runtime)
ENV PORT=30010
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]