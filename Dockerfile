# CodeSphere Interactive GCC Compiler Engine
FROM alpine:3.20

# Install GCC toolchain, standard C library, musl-dev, make, and Node.js runtime
RUN apk add --no-cache gcc musl-dev make nodejs npm

# Create isolated serviceuser (UID 1001) with clean environment
RUN addgroup -g 1001 servicegroup && \
    adduser -u 1001 -S serviceuser -G servicegroup -h /app

WORKDIR /app

# Universal context copy (handles both repo root and compiler-service subdirectory)
COPY . /tmp/build/
RUN if [ -f /tmp/build/compiler-service/package.json ]; then \
        cp /tmp/build/compiler-service/package.json /app/package.json && \
        cp -r /tmp/build/compiler-service/src /app/src; \
    else \
        cp /tmp/build/package.json /app/package.json && \
        cp -r /tmp/build/src /app/src; \
    fi && \
    rm -rf /tmp/build

# Install dependencies (ws)
RUN npm install --omit=dev

# Lock down /app permissions
RUN chown -R serviceuser:servicegroup /app && \
    chmod 750 /app && \
    chmod -R 750 /app/src

# Ensure /tmp has sticky bit and is writable
RUN chmod 1777 /tmp

USER serviceuser

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
