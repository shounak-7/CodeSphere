# CodeSphere Hardened Interactive GCC Sandbox Container
FROM alpine:3.20

# Install GCC toolchain, standard C library, musl-dev, make, and Node.js runtime
RUN apk add --no-cache gcc musl-dev make nodejs npm

# Create two isolated Linux users:
# 1. serviceuser (UID 1001) - Runs the Node.js API server & holds configuration
# 2. sandboxuser (UID 1002) - Unprivileged user with no shell that executes student binaries
RUN addgroup -g 1001 servicegroup && \
    adduser -u 1001 -S serviceuser -G servicegroup -h /app && \
    addgroup -g 1002 sandboxgroup && \
    adduser -u 1002 -S -H -s /sbin/nologin sandboxuser -G sandboxgroup

WORKDIR /app

COPY package.json ./
COPY src ./src

# Lock down /app permissions: readable/executable by serviceuser
RUN chown -R serviceuser:servicegroup /app && \
    chmod 750 /app && \
    chmod -R 750 /app/src

# Ensure /tmp has sticky bit and is writable by both users
RUN chmod 1777 /tmp

USER serviceuser

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
