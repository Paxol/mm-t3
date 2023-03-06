FROM node:lts-slim AS base

RUN npm install -g pnpm

FROM base as builder

ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET

ENV DATABASE_URL $DATABASE_URL
ENV NEXTAUTH_URL $NEXTAUTH_URL
ENV NEXTAUTH_SECRET $NEXTAUTH_SECRET
ENV GOOGLE_CLIENT_ID $GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET $GOOGLE_CLIENT_SECRET

WORKDIR /mm-t3
COPY . .

RUN pnpm install
RUN pnpm build --filter=nextjs

FROM base AS runner
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

WORKDIR /mm-t3/app
CMD ["node", "server.js"]
