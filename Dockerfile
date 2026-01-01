FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy source and generate prisma
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bunx prisma generate

# Final release image
FROM base AS release
COPY --from=prerelease /app/node_modules node_modules
COPY --from=prerelease /app/src src
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/prisma prisma
COPY --from=prerelease /app/prisma.config.ts .

# Fix permissions for docker compose watch
RUN chown -R bun:bun /app

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]