# Build stage
FROM node:22.13-alpine AS build

WORKDIR /app

RUN npm install -g pnpm@10.11.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production stage
FROM node:22.13-alpine AS production
WORKDIR /app

ARG PORT=3000
ARG KEEP_ALIVE_TIMEOUT=0
ARG HEADERS_TIMEOUT=30000
ARG TIMEOUT=60000
ARG REQUEST_TIMEOUT=30000
ARG MAX_CONNECTIONS=1000
ARG MAX_HEADERS_COUNT=1000

ENV PORT=${PORT} \
    KEEP_ALIVE_TIMEOUT=${KEEP_ALIVE_TIMEOUT} \
    HEADERS_TIMEOUT=${HEADERS_TIMEOUT} \
    TIMEOUT=${TIMEOUT} \
    REQUEST_TIMEOUT=${REQUEST_TIMEOUT} \
    MAX_CONNECTIONS=${MAX_CONNECTIONS} \
    MAX_HEADERS_COUNT=${MAX_HEADERS_COUNT}

RUN npm install -g pnpm@10.11.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/build ./build

EXPOSE ${PORT}

# Start the application
ENTRYPOINT ["node", "--trace-warnings", "build/app"]
