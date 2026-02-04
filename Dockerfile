# ------------------------
# Build stage
# ------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm prune --production

# ------------------------
# Production stage
# ------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./

EXPOSE 5000

CMD ["node", "src/server.js"]
