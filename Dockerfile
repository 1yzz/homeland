###############################################
# Build stage: Vite SPA build
###############################################
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable || true && npm i -g pnpm

# Copy manifests and install deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

###############################################
# Runtime stage: Nginx to serve static files
###############################################
FROM nginx:1.27-alpine AS runtime

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Basic SPA fallback config
RUN printf '\
server {\n\
  listen 80;\n\
  server_name _;\n\
  root   /usr/share/nginx/html;\n\
  index  index.html;\n\
  location / {\n\
    try_files $uri /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]