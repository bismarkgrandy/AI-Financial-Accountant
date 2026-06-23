# ─────────────────────────────────────────────────────────────
# Stage 1: deps — install ALL dependencies (incl. dev, for build)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci --ignore-scripts


# ─────────────────────────────────────────────────────────────
# Stage 2: builder — generate Prisma client + compile TypeScript
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build


# ─────────────────────────────────────────────────────────────
# Stage 3: runner — minimal production image
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy with --chown so the node user owns these files
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/dist ./dist

# Make the entire /app (incl. npm-installed node_modules) owned by node
# so Prisma can write its engine files at runtime
RUN chown -R node:node /app

USER node
EXPOSE 3000

CMD ["npm", "run", "start:migrate"]