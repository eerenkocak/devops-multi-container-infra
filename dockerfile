# --- STAGE 1: Build and Dependency Resolution ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker layer caching
COPY app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application source code
COPY app/ ./

# --- STAGE 2: Final Production Runtime ---
FROM node:20-alpine

LABEL maintainer="infrastructure-team"
LABEL project="multi-container-orchestration"

ENV NODE_ENV=production
WORKDIR /app

# Copy entrypoint script and grant execution permissions before switching to non-root user
COPY --chown=node:node entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Secure execution: Run as non-root user for security hardening
USER node

# Copy optimized node_modules and source from the builder stage
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/server.js ./server.js

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
