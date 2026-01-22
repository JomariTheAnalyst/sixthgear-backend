# ============================================
# Dockerfile for Medusa v2 Backend (DEV MODE)
# ============================================
# This Dockerfile runs Medusa in development mode
# WITHOUT building the Admin UI (avoids Vite errors)
# Admin UI is served at runtime by Medusa dev server
# ============================================

FROM node:20-alpine

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Set working directory
WORKDIR /app

# Install system dependencies (required for some npm packages)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for dev mode)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Create symlink to fix Vite path resolution
# Vite looks for /src but files are in /app/src
RUN ln -s /app/src /src 2>/dev/null || true

# Expose Medusa port
EXPOSE 9000

# Set environment variables for runtime
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=9000

# Start Medusa in development mode (Admin UI served at runtime)
# This avoids the need to build the admin UI
CMD ["pnpm", "run", "dev"]
