FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz

RUN printf '#!/bin/sh\nexec /usr/bin/chromium --no-sandbox "$@"\n' \
    > /usr/local/bin/chromium-ci \
    && chmod +x /usr/local/bin/chromium-ci

ENV CHROME_BIN=/usr/local/bin/chromium-ci