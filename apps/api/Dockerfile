# Multistage build for NestJS API with monorepo context
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install dependencies
RUN npm ci

# Generate prisma client
WORKDIR /usr/src/app/apps/api
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build projects
WORKDIR /usr/src/app
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/api/src/prisma ./apps/api/src/prisma

# Install production dependencies only
RUN npm ci --only=production

COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

WORKDIR /usr/src/app/apps/api
CMD ["node", "dist/main"]
