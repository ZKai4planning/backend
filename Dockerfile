# -------------------------------------------------------
# Stage 1 — Build Stage
# -------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Build Typescript
RUN npm run build


# -------------------------------------------------------
# Stage 2 — Production Runtime
# -------------------------------------------------------
FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

# Copy only required files
COPY package*.json ./

RUN npm ci --omit=dev

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Copy keys
COPY --from=builder /app/src/keys ./dist/keys

# Change ownership
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/server.js"]