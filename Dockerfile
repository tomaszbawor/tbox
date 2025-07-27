# Single stage build with Bun
FROM oven/bun:1.2.19-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY patches ./patches

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port (adjust if needed)
EXPOSE 3000

# Start the application directly with Bun
CMD ["bun", "run", "src/index.ts"]