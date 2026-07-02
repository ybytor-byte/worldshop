FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY backend/package.json ./
COPY backend/prisma ./prisma
RUN npm install --ignore-scripts
RUN npx prisma generate
COPY backend/tsconfig*.json ./
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
