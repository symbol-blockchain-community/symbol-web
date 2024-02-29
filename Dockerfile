FROM node:20-bookworm-slim as build

WORKDIR /app
COPY . /app

RUN npm ci && \
    npm run build

RUN rm -rf src && rm package-lock.json

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]