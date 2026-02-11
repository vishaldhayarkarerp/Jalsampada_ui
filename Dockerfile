# Use the official Bun image
FROM oven/bun:1-slim AS base
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json bun.lockb* ./

# Install dependencies (cached if package.json unchanged)
RUN bun install --frozen-lockfile

# Copy source code (only when files change)
COPY . .

# Build application (cached if source unchanged)
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production
WORKDIR /app

# Copy built application
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/public ./
COPY --from=base /app/.next/static ./.next/

# Environment variables
ENV NODE_ENV=production
ENV PORT=2225
ENV HOSTNAME=0.0.0.0

EXPOSE 2225

# Run the standalone server
CMD ["bun", "server.js"]
