FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY src ./src
EXPOSE 4000
# Runs as root inside the container by design: host /var/log files are
# often root:adm or root:root and unreadable to `node` (uid 1000).
# Read-only rootfs + no-new-privileges + :ro volumes contain the blast
# radius — root here has no write path anywhere that matters.
CMD ["node", "src/index.js"]
