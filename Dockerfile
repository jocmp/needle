FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Build CSS
FROM install AS build
COPY . .
RUN bun run build

# Production
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY . .

USER bun
EXPOSE 3000

CMD ["bun", "run", "src/index.tsx"]
