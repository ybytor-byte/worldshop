FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma
RUN pnpm install --frozen-lockfile --filter @worldshop/backend
COPY backend/tsconfig*.json ./backend/
COPY backend/src ./backend/src
RUN pnpm --filter @worldshop/backend run build

FROM node:22-alpine
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
