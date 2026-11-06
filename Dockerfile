# syntax=docker/dockerfile:1
#
# Swap & Top for our own server (Dokploy): the web app with the API inside
# it at /api, one container on port 3000. Steps in docs/HANDOFF.md
# ("Hosting on Dokploy").

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /repo

# Packages first, from the lock file alone, so a change to the code does
# not download them again.
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch --frozen-lockfile
COPY . .
RUN pnpm install --frozen-lockfile --offline

# Baked into the pages by Next, so they are needed while building.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
# The build reads the database to make the feed, listing and store pages
# ahead. Used only in this stage; the image that runs has none of them.
ARG DATABASE_URL
ARG SUPABASE_URL
ARG SUPABASE_PUBLISHABLE_KEY
ARG SUPABASE_SECRET_KEY
ARG SUPABASE_JWKS_URL
# Photos' public address, for the pages made ahead (their photos' links).
ARG R2_PUBLIC_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @snt/web build

# The image that runs: Node and the standalone server, nothing else.
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    APP_ENV=production \
    APP_HOST=Dokploy
# Which deploy is running, for the Staff console's Health page.
ARG COMMIT_SHA
ARG COMMIT_MESSAGE
ARG COMMIT_BRANCH
ENV COMMIT_SHA=$COMMIT_SHA \
    COMMIT_MESSAGE=$COMMIT_MESSAGE \
    COMMIT_BRANCH=$COMMIT_BRANCH
# Owned by node, so pages refreshed after the build can be written.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
