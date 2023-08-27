FROM node:lts-slim AS base

RUN npm install -g pnpm

FROM base as builder

ENV SKIP_ENV_VALIDATION 1

WORKDIR /mm-t3
COPY . .

RUN pnpm install
RUN pnpm build --filter=nextjs

FROM base AS runner
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /mm-t3

ENV NODE_ENV production

# Automatically leverage output traces to reduce image size 
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Some things are not allowed (see https://github.com/vercel/next.js/issues/38119#issuecomment-1172099259)
COPY --from=builder --chown=node:node /mm-t3/app/.next/standalone ./
COPY --from=builder --chown=node:node /mm-t3/app/.next/static ./app/.next/static
COPY --from=builder /mm-t3/app/public ./app/public

EXPOSE 3000

ENV PORT 3000

HEALTHCHECK CMD curl --fail "http://localhost:3000/api/trpc/health.check" || exit 1     

WORKDIR /mm-t3/app
CMD ["node", "server.js"]
