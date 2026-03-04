FROM node:20-alpine AS base

# Install ffmpeg directly via apk
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build the application
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
