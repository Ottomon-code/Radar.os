# Multi-stage production Dockerfile for TALENT_RADAR.OS on Google Cloud Run
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build client assets
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/README.md ./README.md
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Install tsx globally or locally for running TypeScript server in production
RUN npm install -g tsx

EXPOSE 3000

# Start server
CMD ["tsx", "server.ts"]
